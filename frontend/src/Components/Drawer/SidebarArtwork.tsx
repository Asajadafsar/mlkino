export function SidebarBrandMark() {
    return <svg viewBox="0 0 74 74" aria-hidden="true" focusable="false">
        <path d="M7 25V15c0-6 4-9 9-9h8l13 10L50 6h8c6 0 9 3 9 9v10M7 49v10c0 6 4 9 9 9h8l13-10 13 10h8c6 0 9-3 9-9V49" fill="none" stroke="#ffbf00" strokeWidth="7" strokeLinejoin="round"/>
        <text x="37" y="46" textAnchor="middle" fill="white" fontSize="20" fontWeight="900" fontFamily="inherit">ملکینو</text>
    </svg>
}

export function SidebarSkyline() {
    return <svg className="sidebar-skyline" viewBox="0 0 360 180" aria-hidden="true" focusable="false">
        <defs>
            <linearGradient id="sidebar-building" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a1d9ff"/><stop offset="1" stopColor="#1867ff" stopOpacity=".15"/></linearGradient>
            <linearGradient id="sidebar-hill" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#0d3dba"/><stop offset=".5" stopColor="#0755ff"/><stop offset="1" stopColor="#041c68"/></linearGradient>
            <radialGradient id="sidebar-glow"><stop stopColor="#1275ff" stopOpacity=".8"/><stop offset="1" stopColor="#0556ff" stopOpacity="0"/></radialGradient>
        </defs>
        <ellipse cx="180" cy="140" rx="170" ry="95" fill="url(#sidebar-glow)"/>
        <path d="M12 150q-8-25 13-28-4-24 19-20 8-23 26-8 17-1 21 16M271 118q4-21 22-18 5-25 23-10 21-9 27 13 20-2 17 34" fill="#083eae" stroke="#2477ff"/>
        <g fill="#092e8b" stroke="url(#sidebar-building)" strokeWidth="1.3" strokeLinejoin="round">
            <path d="M59 140V89h34v51M66 89v-5h19v5M105 129V43l19-12 20 13v90M124 31v95M194 137V59h45v78M202 59V42h29v17M211 42V22h11v20M217 22V3M258 140V73h44v67M262 73l6-8h25l6 8M138 135l40-32 43 32M147 140l31-24 33 24"/>
        </g>
        <g fill="#b2dcff">
            {[67,78,86].map(x => [99,109,119].map(y => <rect key={x+'-'+y} x={x} y={y} width="2" height="3" rx="1"/>))}
            {[112,118,132,138].map(x => [55,66,77,88,99].map(y => <rect key={x+'-'+y} x={x} y={y} width="1.5" height="2.5" rx=".5"/>))}
            {[267,277,288].map(x => [82,94,106,118].map(y => <rect key={x+'-'+y} x={x} y={y} width="2" height="3" rx="1"/>))}
            <path d="M209 51h4v2h-4zM220 51h4v2h-4zM204 72h5v2h-5zM220 72h5v2h-5z"/>
        </g>
        <path d="M0 179Q180 72 360 179" fill="url(#sidebar-hill)" stroke="#1975ff" strokeWidth="1.2"/>
        <path d="M51 153q128-60 257-1" fill="none" stroke="#55caff" strokeWidth="1.5"/>
    </svg>
}
