/**
 * Don & Ugnė's cats as footer doodles: the ginger one sits and blinks, the
 * chocolate one loafs. Pure SVG + CSS keyframes (in globals.css) so it costs
 * no client JS and pauses under prefers-reduced-motion.
 */
export default function CatDoodles({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 80"
      className={className}
      role="img"
      aria-label="Two British shorthairs: a ginger one sitting, a chocolate one loafing"
    >
      {/* floating heart between the cats */}
      <path
        className="doodle-heart"
        d="M100 34 c-2 -4 -8 -3 -8 1 c0 3 4 6 8 9 c4 -3 8 -6 8 -9 c0 -4 -6 -5 -8 -1 z"
        fill="#cf6b3f"
      />

      {/* ginger cat, sitting */}
      <g>
        <g className="doodle-tail" style={{ transformOrigin: "76px 68px" }}>
          <path
            d="M76 70 q20 -2 22 -20"
            fill="none"
            stroke="#e8a45c"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </g>
        <ellipse cx="55" cy="58" rx="22" ry="19" fill="#e8a45c" />
        <path d="M43 21 l-4 -11 l11 5 z" fill="#e8a45c" />
        <path d="M67 21 l4 -11 l-11 5 z" fill="#e8a45c" />
        <path d="M43 20 l-2 -6 l6 3 z" fill="#d07f4a" />
        <path d="M67 20 l2 -6 l-6 3 z" fill="#d07f4a" />
        <circle cx="55" cy="31" r="15" fill="#e8a45c" />
        <g className="doodle-blink">
          <ellipse cx="49" cy="30" rx="2" ry="2.6" fill="#4d2f18" />
          <ellipse cx="61" cy="30" rx="2" ry="2.6" fill="#4d2f18" />
        </g>
        <path d="M54 35 l2 0 l-1 1.8 z" fill="#c77e5a" />
        <g stroke="#c07f43" strokeWidth="0.8" opacity="0.7">
          <line x1="40" y1="34" x2="30" y2="32" />
          <line x1="40" y1="37" x2="30" y2="38" />
          <line x1="70" y1="34" x2="80" y2="32" />
          <line x1="70" y1="37" x2="80" y2="38" />
        </g>
        <ellipse cx="47" cy="75" rx="6" ry="3.5" fill="#f0bc80" />
        <ellipse cx="62" cy="75" rx="6" ry="3.5" fill="#f0bc80" />
      </g>

      {/* chocolate cat, loafing */}
      <g>
        <g className="doodle-tail-flick" style={{ transformOrigin: "118px 70px" }}>
          <path
            d="M120 70 q-12 4 -18 -2"
            fill="none"
            stroke="#4a2c1e"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>
        <ellipse cx="145" cy="63" rx="27" ry="15" fill="#4a2c1e" />
        <path d="M153 39 l-3 -10 l9 5 z" fill="#4a2c1e" />
        <path d="M173 39 l3 -10 l-9 5 z" fill="#4a2c1e" />
        <circle cx="163" cy="47" r="13" fill="#4a2c1e" />
        {/* asleep: eyes are always-closed arcs */}
        <g stroke="#d8b294" strokeWidth="1.2" fill="none" strokeLinecap="round">
          <path d="M155 47 q2.5 2.5 5 0" />
          <path d="M166 47 q2.5 2.5 5 0" />
        </g>
        <g stroke="#9a7257" strokeWidth="0.8" opacity="0.7">
          <line x1="150" y1="51" x2="141" y2="50" />
          <line x1="176" y1="51" x2="185" y2="50" />
        </g>
      </g>
    </svg>
  );
}
