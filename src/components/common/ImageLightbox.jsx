import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * 공용 이미지 라이트박스 (클릭 시 확대보기).
 * PCDiagPanelDetail.jsx 의 원형 패턴을 재사용 가능한 컴포넌트로 추출.
 *
 * Props
 * - images: string | (string|null|undefined)[]  — 단일 URL 또는 URL 배열 (falsy 항목은 자동 제거)
 * - index?: number  — 시작 인덱스 (기본 0)
 * - onClose: () => void  — 닫기 콜백 (필수)
 * - alt?: string  — 이미지 alt 텍스트 접두어 (기본 '첨부 사진')
 *
 * 사용하는 쪽에서는 open/close state만 들고, 열려있을 때만 마운트하면 됨:
 *   {lightbox && <ImageLightbox images={images} onClose={() => setLightbox(false)} />}
 */
export default function ImageLightbox({ images, index = 0, onClose, alt = '첨부 사진' }) {
    const list = (Array.isArray(images) ? images : [images]).filter(Boolean);
    const [i, setI] = useState(Math.min(Math.max(index, 0), Math.max(list.length - 1, 0)));
    const hasMulti = list.length > 1;
    const imgRef = useRef(null);

    // 뷰포트(92%)에 꽉 차도록 비율 유지하며 맞춘다.
    // maxWidth/maxHeight만 쓰면 원본이 작은 이미지가 그대로 작게 떠서, 확대까지 허용하도록 실제 크기를 계산한다.
    const fitToViewport = useCallback(() => {
        const img = imgRef.current;
        if (!img || !img.naturalWidth || !img.naturalHeight) return;
        const scale = Math.min(
            (window.innerWidth * 0.92) / img.naturalWidth,
            (window.innerHeight * 0.92) / img.naturalHeight,
        );
        img.style.width = `${Math.round(img.naturalWidth * scale)}px`;
        img.style.height = `${Math.round(img.naturalHeight * scale)}px`;
    }, []);

    useEffect(() => {
        window.addEventListener('resize', fitToViewport);
        return () => window.removeEventListener('resize', fitToViewport);
    }, [fitToViewport]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
            else if (hasMulti && e.key === 'ArrowLeft') setI((v) => (v - 1 + list.length) % list.length);
            else if (hasMulti && e.key === 'ArrowRight') setI((v) => (v + 1) % list.length);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [hasMulti, list.length, onClose]);

    if (!list.length) return null;
    const src = list[i];

    const goPrev = (e) => { e.stopPropagation(); setI((v) => (v - 1 + list.length) % list.length); };
    const goNext = (e) => { e.stopPropagation(); setI((v) => (v + 1) % list.length); };

    const navBtnStyle = {
        position: 'fixed', top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(255,255,255,0.15)', border: 'none',
        borderRadius: '50%', width: 44, height: 44,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    };

    return createPortal(
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                background: 'rgba(0,0,0,0.88)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'zoom-out',
            }}
        >
            <button
                type="button"
                onClick={onClose}
                style={{
                    position: 'fixed', top: 20, right: 24,
                    background: 'rgba(255,255,255,0.15)', border: 'none',
                    borderRadius: '50%', width: 44, height: 44,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                aria-label="닫기"
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>

            {hasMulti && (
                <button type="button" onClick={goPrev} style={{ ...navBtnStyle, left: 16 }} aria-label="이전 사진">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
            )}

            <img
                key={src}
                ref={imgRef}
                src={src}
                alt={hasMulti ? `${alt} ${i + 1}` : alt}
                onClick={(e) => e.stopPropagation()}
                onLoad={fitToViewport}
                style={{
                    maxWidth: '92vw', maxHeight: '92vh',
                    borderRadius: 10, boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
                    objectFit: 'contain', cursor: 'default',
                }}
            />

            {hasMulti && (
                <button type="button" onClick={goNext} style={{ ...navBtnStyle, right: 16 }} aria-label="다음 사진">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            )}

            {hasMulti && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                        color: '#fff', fontSize: 13, background: 'rgba(255,255,255,0.15)',
                        borderRadius: 999, padding: '4px 12px',
                    }}
                >
                    {i + 1} / {list.length}
                </div>
            )}
        </div>,
        document.body
    );
}
