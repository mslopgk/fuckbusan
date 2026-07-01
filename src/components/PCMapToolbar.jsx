export default function PCMapToolbar({ mapRef, onToggleSidebar, sidebarOpen = true }) {
    const call = (fn) => () => mapRef.current && mapRef.current[fn] && mapRef.current[fn]();

    return (
        <div className="pc-map3-toolbar">
            {/* Card 1: AI 가상시민 */}
            <div className="pc-map3-card">
                <button className="pc-map3-tool" aria-label="AI 가상시민" title="AI 가상시민">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        <path d="M19 2l.6 1.8L21.4 4.4l-1.8.6L19 6.8l-.6-1.8-1.8-.6 1.8-.6L19 2z" fill="#23bdbb"/>
                    </svg>
                </button>
            </div>

            {/* Card 2: 지도 컨트롤 5버튼 */}
            <div className="pc-map3-card">
                <button className="pc-map3-tool" aria-label="내 위치" title="내 위치" onClick={call('locateMe')}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                    </svg>
                </button>
                <button className="pc-map3-tool pc-map3-tool--sep" aria-label="확대" title="확대" onClick={call('zoomIn')}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                </button>
                <button className="pc-map3-tool" aria-label="축소" title="축소" onClick={call('zoomOut')}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13H5v-2h14v2z"/>
                    </svg>
                </button>
                <button className="pc-map3-tool pc-map3-tool--sep pc-map3-tool--teal" aria-label="일반 지도" title="일반 지도">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
                    </svg>
                </button>
                <button className="pc-map3-tool pc-map3-tool--sep" aria-label="위성 지도" title="위성 지도" onClick={call('toggleMapType')}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.59 3.41 2 8l4.59 4.59L8 11.17 5.83 9l3.58-3.59-1.41-1.41zM15 1.59 11 7l1.41 1.41L15 5.83l3.17 3.17 1.42-1.42L15 1.59zM20.59 11 16 15.59l1.41 1.42 3.59-3.6-3.59-3.58-1.41 1.42L18.17 13l-3.58 3.59 1.41 1.41L20.59 11zM9 16.41 7.59 15 4 18.59l3.59 3.59L9 20.76l-1.59-1.6L9 17.83l2.17 2.17 1.41-1.41L9 15.59zm5.12 3.88L11.59 18l-1.41 1.41L12 21.24l-.59.58 1.41 1.41 1.71-1.71.58.58 1.41-1.41-1.4-1.41z"/>
                    </svg>
                </button>
            </div>

            {/* Card 3: 목록 토글 */}
            <div className="pc-map3-card">
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
            </div>
        </div>
    );
}
