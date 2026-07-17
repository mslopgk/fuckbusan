/* 지도 우측 컨트롤 툴바 — Figma 원본 그대로 (아이콘 = Figma 노드 4x PNG export, 필터/손그림 SVG 없음).
   섹션별 Figma 프레임: 제보/제안 302:12592 (accent #f74e7e, person 흰 버튼 48x47, analytics 있음)
                     가상시민 302:3611 (person teal 48x52, analytics 없음)
                     진단 302:4871/5845 (person 없음, analytics 열림=teal/닫힘=흰)
                     공공데이터 302:8820 (PCPublicData 자체 렌더 — 동일 에셋 사용)
   accent: 지도(항상 활성)·analytics(사이드바 열림 시) 버튼 배경색. */
const TB = '/figma-assets/icons/pubd-toolbar';

export default function PCMapToolbar({
    mapRef,
    onToggleSidebar,
    sidebarOpen = true,
    onAI,
    aiTeal = false,
    showPerson = true,
    accent = '#23bdbb',
}) {
    const call = (fn) => () => mapRef.current && mapRef.current[fn] && mapRef.current[fn]();

    return (
        <div className="pc-map3-toolbar">
            {/* Card 1: AI 가상시민 (person) — 진단 지도(Figma 302:4871)에는 없음 */}
            {showPerson && (
                <div className="pc-map3-card">
                    <button
                        className="pc-map3-tool"
                        style={aiTeal ? { background: accent, height: 52 } : { height: 47 }}
                        aria-label="AI 가상시민" title="AI 가상시민" onClick={onAI}
                    >
                        <img src={`${TB}/${aiTeal ? 'tb_person_white' : 'tb_person_dark'}.png`} alt="" width="21" height="25" />
                    </button>
                </div>
            )}

            {/* Card 2: 지도 컨트롤 5버튼 (my_location/add/remove/map/satellite — 아이콘 전부 24px) */}
            <div className="pc-map3-card">
                <button className="pc-map3-tool" aria-label="내 위치" title="내 위치" onClick={call('locateMe')}>
                    <img src={`${TB}/tb_my_location.png`} alt="" width="24" height="24" />
                </button>
                <button className="pc-map3-tool pc-map3-tool--sep" aria-label="확대" title="확대" onClick={call('zoomIn')}>
                    <img src={`${TB}/tb_add.png`} alt="" width="24" height="24" />
                </button>
                <button className="pc-map3-tool" aria-label="축소" title="축소" onClick={call('zoomOut')}>
                    <img src={`${TB}/tb_remove.png`} alt="" width="24" height="24" />
                </button>
                <button className="pc-map3-tool pc-map3-tool--sep" style={{ background: accent }} aria-label="일반 지도" title="일반 지도">
                    <img src={`${TB}/tb_map.png`} alt="" width="24" height="24" />
                </button>
                <button className="pc-map3-tool pc-map3-tool--sep" aria-label="위성 지도" title="위성 지도" onClick={call('toggleMapType')}>
                    <img src={`${TB}/tb_satellite.png`} alt="" width="24" height="24" />
                </button>
            </div>

            {/* Card 3: analytics(목록 토글) — 사이드바 있는 페이지에서만. 열림=accent+흰 글리프 / 닫힘=흰+다크 글리프 */}
            {onToggleSidebar && <div className="pc-map3-card">
                <button
                    className="pc-map3-tool"
                    style={sidebarOpen ? { background: accent } : undefined}
                    aria-label={sidebarOpen ? '목록 숨기기' : '목록 보기'}
                    title={sidebarOpen ? '목록 숨기기' : '목록 보기'}
                    onClick={onToggleSidebar}
                >
                    <img src={`${TB}/${sidebarOpen ? 'tb_analytics' : 'tb_analytics_dark'}.png`} alt="" width="24" height="24" />
                </button>
            </div>}
        </div>
    );
}
