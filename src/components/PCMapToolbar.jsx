import { useState } from 'react';

const ICONS = {
    me: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>,
    locate: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>,
    plus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>,
    minus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/></svg>,
    layer: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
    ruler: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 14l8-8 12 12-8 8z"/></svg>,
    region: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
};

export default function PCMapToolbar({ mapRef }) {
    const [layerActive, setLayerActive] = useState(false);
    const [regionActive, setRegionActive] = useState(true);

    const call = (fn) => () => mapRef.current && mapRef.current[fn] && mapRef.current[fn]();

    return (
        <div className="pc-map3-toolbar">
            <button className="pc-map3-tool" aria-label="현위치" title="현위치" onClick={call('locateMe')}>{ICONS.me}</button>
            <button className="pc-map3-tool" aria-label="중앙으로" title="중앙으로" onClick={call('recenter')}>{ICONS.locate}</button>
            <button className="pc-map3-tool" aria-label="확대" title="확대" onClick={call('zoomIn')}>{ICONS.plus}</button>
            <button className="pc-map3-tool" aria-label="축소" title="축소" onClick={call('zoomOut')}>{ICONS.minus}</button>
            <button
                className={`pc-map3-tool ${layerActive ? 'active' : ''}`}
                aria-label="지도 유형"
                title="지도 유형 (일반/스카이뷰)"
                onClick={() => { setLayerActive(!layerActive); call('toggleMapType')(); }}
            >
                {ICONS.layer}
            </button>
            <button className="pc-map3-tool disabled" aria-label="거리 측정" title="거리 측정 (준비 중)" style={{ color: '#9ca3af', cursor: 'not-allowed', opacity: 0.5 }} onClick={() => {}}>{ICONS.ruler}</button>
            <button
                className={`pc-map3-tool ${regionActive ? 'active' : ''}`}
                aria-label="구역 표시"
                title="구역 표시 토글"
                onClick={() => { setRegionActive(!regionActive); call('toggleRegions')(); }}
            >
                {ICONS.region}
            </button>
        </div>
    );
}
