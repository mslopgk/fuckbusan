/* Shared hero illustration: person + paper + leaves (matches Figma's character illustration) */
export default function PCHeroIllu({ accent = '#5B2EAB', height = 160 }) {
    return (
        <svg width={(height * 220) / 160} height={height} viewBox="0 0 260 200" fill="none" aria-hidden="true">
            {/* Background leaves */}
            <path d="M30 60 Q10 50 20 30 Q40 35 45 55 Q35 65 30 60Z" fill={accent} opacity="0.40"/>
            <path d="M60 30 Q50 10 70 5 Q85 20 80 40 Q70 38 60 30Z" fill={accent} opacity="0.55"/>
            <path d="M210 30 Q230 10 245 25 Q240 50 220 50 Q210 40 210 30Z" fill={accent} opacity="0.50"/>
            <path d="M235 100 Q250 90 250 110 Q235 120 225 110 Q225 100 235 100Z" fill={accent} opacity="0.40"/>

            {/* Document paper */}
            <rect x="100" y="50" width="100" height="130" rx="6" fill="#fff" stroke={accent} strokeWidth="2"/>
            <line x1="115" y1="76" x2="180" y2="76" stroke={accent} strokeWidth="2" strokeLinecap="round"/>
            <line x1="115" y1="92" x2="180" y2="92" stroke={accent} strokeWidth="2" strokeLinecap="round"/>
            <line x1="115" y1="108" x2="170" y2="108" stroke={accent} strokeWidth="2" strokeLinecap="round"/>
            <line x1="115" y1="124" x2="180" y2="124" stroke={accent} strokeWidth="2" strokeLinecap="round"/>
            <line x1="115" y1="140" x2="160" y2="140" stroke={accent} strokeWidth="2" strokeLinecap="round"/>

            {/* Check circle on paper */}
            <circle cx="183" cy="158" r="14" fill={accent}/>
            <path d="M178 158l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

            {/* Person */}
            <ellipse cx="60" cy="170" rx="28" ry="6" fill="#000" opacity="0.10"/>
            <circle cx="62" cy="80" r="14" fill="#F4D2B5"/>
            <path d="M52 75 Q62 64 72 75" stroke="#3a2666" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <rect x="48" y="92" width="28" height="46" rx="6" fill={accent}/>
            <path d="M48 100 Q30 110 35 130" stroke={accent} strokeWidth="9" strokeLinecap="round" fill="none"/>
            <path d="M76 100 Q98 92 105 80" stroke={accent} strokeWidth="9" strokeLinecap="round" fill="none"/>
            <circle cx="105" cy="80" r="6" fill="#F4D2B5"/>
            <rect x="50" y="138" width="9" height="32" rx="4" fill="#3a2666"/>
            <rect x="65" y="138" width="9" height="32" rx="4" fill="#3a2666"/>
            <ellipse cx="55" cy="172" rx="7" ry="3" fill="#1a1a1b"/>
            <ellipse cx="69" cy="172" rx="7" ry="3" fill="#1a1a1b"/>
        </svg>
    );
}
