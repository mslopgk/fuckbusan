/* onAI / aiTeal: AI가상시민 페이지 전용 옵션 (Figma 302:3611 — Card A가 teal 버튼 + 챗봇 트리거).
   미전달 시 기존 4개 지도 페이지와 동일한 흰색 무동작 버튼 렌더 (하위호환). */
export default function PCMapToolbar({ mapRef, onToggleSidebar, sidebarOpen = true, onAI, aiTeal = false }) {
    const call = (fn) => () => mapRef.current && mapRef.current[fn] && mapRef.current[fn]();

    return (
        <div className="pc-map3-toolbar">
            {/* Card 1: AI 가상시민 */}
            <div className="pc-map3-card">
                <button
                    className={`pc-map3-tool pc-map3-tool--ai${aiTeal ? ' pc-map3-tool--teal' : ''}`}
                    aria-label="AI 가상시민" title="AI 가상시민" onClick={onAI}
                >
                    <img src="/figma-assets/icons/map-controls/person.svg" alt="" width="22" height="22" />
                </button>
            </div>

            {/* Card 2: 지도 컨트롤 5버튼 */}
            <div className="pc-map3-card">
                <button className="pc-map3-tool" aria-label="내 위치" title="내 위치" onClick={call('locateMe')}>
                    <img src="/figma-assets/icons/map-controls/my_location.svg" alt="" width="22" height="22" />
                </button>
                <button className="pc-map3-tool pc-map3-tool--sep" aria-label="확대" title="확대" onClick={call('zoomIn')}>
                    <img src="/figma-assets/icons/map-controls/add.svg" alt="" width="22" height="22" />
                </button>
                <button className="pc-map3-tool" aria-label="축소" title="축소" onClick={call('zoomOut')}>
                    {/* remove.svg's viewBox is 14x2 (not square) and uses preserveAspectRatio="none",
                        so it must be sized to its true aspect ratio here or it stretches into a block. */}
                    <img src="/figma-assets/icons/map-controls/remove.svg" alt="" width="22" height="3" />
                </button>
                <button className="pc-map3-tool pc-map3-tool--sep pc-map3-tool--teal" aria-label="일반 지도" title="일반 지도">
                    <img src="/figma-assets/icons/map-controls/map.svg" alt="" width="22" height="22" />
                </button>
                <button className="pc-map3-tool pc-map3-tool--sep" aria-label="위성 지도" title="위성 지도" onClick={call('toggleMapType')}>
                    {/* satellite_alt.svg is a fine multi-segment beam icon (thin ~1-unit
                        strokes even in its own 23x23 native box); rendered at the same
                        22px as the bold add/remove glyphs it reads noticeably thinner
                        and "busier". Bumping it a few px restores comparable visual
                        weight/footprint within the 48x48 button without touching color. */}
                    <img src="/figma-assets/icons/map-controls/satellite_alt.svg" alt="" width="26" height="26" />
                </button>
            </div>

            {/* Card 3: 목록 토글 — 사이드바가 있는 페이지에서만 (AI가상시민 페이지는 미사용) */}
            {onToggleSidebar && <div className="pc-map3-card">
                <button
                    className={`pc-map3-tool pc-map3-tool--teal${sidebarOpen ? '' : ' pc-map3-tool--teal-off'}`}
                    aria-label={sidebarOpen ? '목록 숨기기' : '목록 보기'}
                    title={sidebarOpen ? '목록 숨기기' : '목록 보기'}
                    onClick={onToggleSidebar}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>
                </button>
            </div>}
        </div>
    );
}
