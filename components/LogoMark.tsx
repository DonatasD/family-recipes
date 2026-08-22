/**
 * The wordmark doodle: Don and Ugnė either side of their cooking pot, drawn
 * like the pair at the GardenScene table (same hair and clothes colours).
 * The heart in the steam reuses the footer cats' globals.css keyframes.
 */
export default function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 76 40" aria-hidden className={className}>
      {/* Don: dark hair, olive jumper */}
      <g>
        <circle cx="10" cy="16" r="5.5" fill="#e8b48c" />
        <path d="M4.5 16 a5.5 5.5 0 0 1 11 0 z" fill="#3a2c20" />
        <rect x="4.5" y="22" width="11" height="15" rx="5" fill="#5c6b3f" />
      </g>

      {/* the pot between them */}
      <g stroke="#a85332" strokeWidth="2.5" strokeLinecap="round">
        <line x1="21" y1="23" x2="26" y2="23" />
        <line x1="50" y1="23" x2="55" y2="23" />
      </g>
      <g
        fill="none"
        stroke="#6b6e48"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      >
        <path d="M33 13 q-2.5 -4 0.5 -7" />
        <path d="M41 13 q2.5 -4 -0.5 -7" />
      </g>
      <path
        className="doodle-heart"
        d="M49 7 c-1 -2 -4 -1.5 -4 0.5 c0 1.5 2 3 4 4.5 c2 -1.5 4 -3 4 -4.5 c0 -2 -3 -2.5 -4 -0.5 z"
        fill="#cf6b3f"
      />
      <path
        d="M26 21 h24 c0 8 -5 12 -12 12 c-7 0 -12 -4 -12 -12 z"
        fill="#cf6b3f"
      />
      <ellipse cx="38" cy="20" rx="13" ry="3" fill="#66761a" />
      <circle cx="38" cy="16" r="2.5" fill="#4f5c14" />

      {/* Ugnė: blonde hair with the side lock, terracotta top */}
      <g>
        <circle cx="66" cy="16" r="5.5" fill="#eec09a" />
        <path d="M60.5 15.5 a5.5 5.5 0 0 1 11 0 l1.5 7 h-3 z" fill="#dfb35e" />
        <rect x="60.5" y="22" width="11" height="15" rx="5" fill="#b06a52" />
      </g>
    </svg>
  );
}
