// Yengil (SVG) masjid: 3D yuklanmagan yoki o'chirilgan qurilmalar uchun zaxira.
export function MosqueArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ma-dome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7d99bd" />
          <stop offset="1" stopColor="#3e5878" />
        </linearGradient>
        <linearGradient id="ma-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efe5d6" />
          <stop offset="1" stopColor="#cbbca6" />
        </linearGradient>
      </defs>
      {/* minoralar */}
      {[28, 212].map((x) => (
        <g key={x}>
          <rect x={x - 5} y="62" width="10" height="112" fill="url(#ma-wall)" />
          <rect x={x - 9} y="92" width="18" height="5" rx="1.5" fill="#efe5d6" />
          <rect x={x - 9} y="122" width="18" height="5" rx="1.5" fill="#efe5d6" />
          <path d={`M${x - 7} 62 L${x} 28 L${x + 7} 62Z`} fill="url(#ma-dome)" />
          <circle cx={x} cy="26" r="2.6" fill="#f2c14e" />
        </g>
      ))}
      {[70, 170].map((x) => (
        <g key={x}>
          <rect x={x - 4} y="100" width="8" height="74" fill="url(#ma-wall)" />
          <rect x={x - 8} y="124" width="16" height="4.5" rx="1.5" fill="#efe5d6" />
          <path d={`M${x - 6} 100 L${x} 72 L${x + 6} 100Z`} fill="url(#ma-dome)" />
          <circle cx={x} cy="70" r="2.2" fill="#f2c14e" />
        </g>
      ))}
      {/* yon va burchak gumbazlari */}
      <path d="M62 138c0-18 12-30 26-30s26 12 26 30z" fill="url(#ma-dome)" />
      <path d="M126 138c0-18 12-30 26-30s26 12 26 30z" fill="url(#ma-dome)" />
      {/* markaziy gumbaz */}
      <rect x="86" y="100" width="68" height="14" fill="url(#ma-wall)" />
      <path d="M84 100c0-34 15-56 36-56s36 22 36 56z" fill="url(#ma-dome)" />
      <path d="M120 44v-14" stroke="#f2c14e" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="120" cy="27" r="3.2" fill="#f2c14e" />
      {/* zal */}
      <rect x="54" y="138" width="132" height="36" fill="url(#ma-wall)" />
      {[70, 94, 118, 142, 166].map((x) => (
        <path key={x} d={`M${x - 6} 168v-16a6 6 0 0 1 12 0v16z`} fill="#ffb45a" opacity=".85" />
      ))}
      <rect x="40" y="174" width="160" height="8" rx="2" fill="#26334d" />
    </svg>
  );
}
