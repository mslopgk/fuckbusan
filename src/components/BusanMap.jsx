import React, { useState, useEffect, useRef } from 'react';
import './BusanMap.css';

/*
 * Figma TCuOzEqNhoLKjhF0reBDks node 215:3631 "지도 Group" 재현.
 * 좌표는 메인 지도 프레임(215:3649, 750.48×572.98) 기준 상대 좌표.
 * 구별 도형은 public/assets/districts/*.svg (Figma export, fill=var(--fill-0,white)).
 */
const VBW = 750.48;
const VBH = 572.98;

// name(=svg 파일명), x, y, w, h
const DISTRICTS = [
    { name: '강서구', x: 0, y: 250.87, w: 290.94, h: 252.45 },
    { name: '사상구', x: 231.50, y: 311.47, w: 97.20, h: 131.77 },
    { name: '북구', x: 288.90, y: 177.37, w: 95.24, h: 149.38 },
    { name: '금정구', x: 353.93, y: 131.70, w: 155.91, h: 160.47 },
    { name: '기장군', x: 462.15, y: 0, w: 288.33, h: 338.56 },
    { name: '동래구', x: 363.14, y: 263.99, w: 101.11, h: 59.36 },
    { name: '연제구', x: 367.04, y: 310.23, w: 101.11, h: 61.97 },
    { name: '부산진구', x: 321.45, y: 308.86, w: 100.46, h: 110.90 },
    { name: '해운대구', x: 462.80, y: 230.14, w: 150.69, h: 159.17 },
    { name: '수영구', x: 439.04, y: 339.51, w: 51.81, h: 64.58 },
    { name: '남구', x: 385.97, y: 373.44, w: 108.29, h: 101.11 },
    { name: '사하구', x: 200.84, y: 428.82, w: 121.99, h: 144.17 },
    { name: '서구', x: 293.40, y: 404.68, w: 49.58, h: 139.60 },
    { name: '동구', x: 331.82, y: 396.85, w: 58.06, h: 49.58 },
    { name: '중구', x: 329.21, y: 441.15, w: 52.84, h: 41.10 },
    { name: '영도구', x: 340.82, y: 460.06, w: 103.07, h: 93.28 },
];

// 라벨 위치 = 각 구 도형의 면적 centroid (박스 내 0~1 비율, 스케일 독립)
const CENTROID = {
    강서구: [0.535, 0.516], 사상구: [0.524, 0.506], 북구: [0.474, 0.556], 금정구: [0.497, 0.498],
    기장군: [0.474, 0.441], 동래구: [0.508, 0.528], 연제구: [0.576, 0.42], 부산진구: [0.428, 0.497],
    해운대구: [0.42, 0.572], 수영구: [0.483, 0.481], 남구: [0.488, 0.531], 사하구: [0.519, 0.447],
    서구: [0.5, 0.22], 동구: [0.553, 0.494], 중구: [0.492, 0.443], 영도구: [0.521, 0.505],
};

const pct = (v, total) => `${(v / total) * 100}%`;

const DRAG_CLICK_THRESHOLD = 5; // px — 이내면 클릭, 초과면 드래그로 판정

const BusanMap = ({ selectedDistrict = null, onDistrictChange, zoom = 1, draggable = false, bgSrc = null }) => {
    const [svgs, setSvgs] = useState({});
    // 팬(드래그 이동) — draggable=true(공공데이터)일 때만 활성. 홈 등 기존 사용처는 영향 없음.
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const dragRef = useRef(null);   // { startX, startY, panX, panY }
    const movedRef = useRef(false); // 직전 제스처가 드래그였으면 click 무시

    const onPointerDown = (e) => {
        if (!draggable || e.button !== 0) return;
        dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
        movedRef.current = false;
        // ⚠️ 여기서 setState/setPointerCapture 하면 pointerdown~mousedown 사이 리렌더·retarget 으로
        //    구 클릭(click 합성)이 죽는다 → 실제 드래그로 판정된 뒤(onPointerMove)에만 수행.
    };
    const onPointerMove = (e) => {
        const d = dragRef.current;
        if (!d) return;
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        if (!movedRef.current) {
            if (Math.abs(dx) <= DRAG_CLICK_THRESHOLD && Math.abs(dy) <= DRAG_CLICK_THRESHOLD) return; // 클릭 후보 — 팬 시작 안 함
            movedRef.current = true;
            setDragging(true);
            e.currentTarget.setPointerCapture?.(e.pointerId);
        }
        setPan({ x: d.panX + dx, y: d.panY + dy });
    };
    const onPointerUp = (e) => {
        if (!dragRef.current) return;
        dragRef.current = null;
        setDragging(false);
        e.currentTarget.releasePointerCapture?.(e.pointerId);
    };
    // 드래그 직후 발생하는 click은 구 선택으로 처리하지 않음 (클릭 vs 드래그 구분)
    const onClickCapture = (e) => {
        if (movedRef.current) {
            e.preventDefault();
            e.stopPropagation();
            movedRef.current = false;
        }
    };

    useEffect(() => {
        let alive = true;
        Promise.all(
            DISTRICTS.map((d) =>
                fetch(`/assets/districts/${encodeURIComponent(d.name)}.svg`)
                    .then((r) => (r.ok ? r.text() : ''))
                    .then((t) => [d.name, t])
                    .catch(() => [d.name, ''])
            )
        ).then((entries) => { if (alive) setSvgs(Object.fromEntries(entries)); });
        return () => { alive = false; };
    }, []);

    const select = (name) => {
        if (!onDistrictChange) return;
        onDistrictChange(name === selectedDistrict ? null : name);
    };

    const sel = DISTRICTS.find((d) => d.name === selectedDistrict);

    return (
        <div
            className={`busanmap${draggable ? ' draggable' : ''}${dragging ? ' dragging' : ''}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClickCapture={onClickCapture}
        >
            <div className="busanmap-stage" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
                {/* 배경 (opt-in) — stage 내부라서 팬/줌 시 구역 도형과 한 몸으로 움직임 */}
                {bgSrc && (
                    <img className="busanmap-bg" src={bgSrc} alt="" aria-hidden="true" draggable={false} />
                )}

                {/* 그림자 */}
                <img className="busanmap-shadow" src="/assets/districts/shadow.svg" alt="" aria-hidden="true" draggable={false} />

                {/* 구역 도형 */}
                {DISTRICTS.map((d) => {
                    const isSel = d.name === selectedDistrict;
                    const c = CENTROID[d.name] || [0.5, 0.5];
                    return (
                        <div
                            key={d.name}
                            className={`busanmap-district${isSel ? ' selected' : ''}`}
                            style={{ left: pct(d.x, VBW), top: pct(d.y, VBH), width: pct(d.w, VBW), height: pct(d.h, VBH) }}
                            onClick={() => select(d.name)}
                            role="button"
                            aria-label={d.name}
                        >
                            <span className="busanmap-shape" dangerouslySetInnerHTML={{ __html: svgs[d.name] || '' }} />
                            <span
                                className="busanmap-label"
                                style={{ left: `${c[0] * 100}%`, top: `${c[1] * 100}%` }}
                            >
                                {d.name}
                            </span>
                        </div>
                    );
                })}

                {/* 선택 구 캐릭터 (구 크기와 무관하게 고정 크기 + 상한) */}
                {sel && (
                    <img
                        className="busanmap-char"
                        src="/people2.png"
                        alt=""
                        aria-hidden="true"
                        draggable={false}
                        style={{
                            left: pct(sel.x + sel.w / 2, VBW),
                            top: pct(sel.y + Math.min(sel.h * 0.4, 64), VBH),
                            width: pct(150, VBW),
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default BusanMap;
