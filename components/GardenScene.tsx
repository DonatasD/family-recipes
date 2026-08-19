/**
 * Don & Ugnė's back garden closing every page: their white house and dark
 * slat fence, the lawn with hydrangeas and lavender, and the two of them at
 * the garden table (after Ugnė's marker drawing). Rendered in flow below the
 * footer so it can never sit underneath content.
 */
export default function GardenScene() {
  return (
    <div aria-hidden className="scene-fade pointer-events-none w-full">
      {/* "meet" never crops (so the roof survives wide screens); the fence
          and lawn are overdrawn past the viewBox to keep spanning the full
          width instead. */}
      <svg
        viewBox="0 0 1200 220"
        preserveAspectRatio="xMidYMax meet"
        className="h-40 w-full md:h-52"
      >
        {/* drifting clouds */}
        <g fill="#eceadb">
          <g className="scene-cloud">
            <ellipse cx="200" cy="40" rx="42" ry="13" />
            <ellipse cx="235" cy="32" rx="28" ry="10" />
          </g>
          <g className="scene-cloud-slow">
            <ellipse cx="700" cy="26" rx="50" ry="14" />
            <ellipse cx="745" cy="18" rx="30" ry="10" />
          </g>
        </g>

        {/* fence: dark slats with a top rail, like the garden photos */}
        <rect x="-2400" y="128" width="6000" height="6" fill="#3f4138" />
        <g fill="#494b40">
          {Array.from({ length: 300 }, (_, i) => (
            <rect
              key={i}
              x={i * 20 - 2398}
              y="132"
              width="12"
              height="58"
              rx="2"
            />
          ))}
        </g>

        {/* house */}
        <g>
          <rect x="850" y="80" width="180" height="112" fill="#fbfaf1" />
          <path d="M840 84 L940 30 L1040 84 z" fill="#4a4a42" />
          <rect x="955" y="34" width="14" height="26" fill="#4a4a42" />
          <g fill="#d9d5b4" stroke="#8b8a74" strokeWidth="2">
            <rect x="872" y="102" width="30" height="36" />
            <rect x="978" y="102" width="30" height="36" />
          </g>
          <rect x="925" y="120" width="30" height="72" fill="#6b5f46" />
        </g>

        {/* lawn */}
        <rect x="-2400" y="186" width="6000" height="34" fill="#dfe3bf" />

        {/* hydrangea bush */}
        <g>
          <ellipse cx="700" cy="184" rx="46" ry="22" fill="#a9b46b" />
          <circle cx="680" cy="172" r="10" fill="#f6f4e3" />
          <circle cx="704" cy="166" r="11" fill="#f6f4e3" />
          <circle cx="726" cy="174" r="9" fill="#f6f4e3" />
        </g>

        {/* lavender patch + butterfly */}
        <g strokeLinecap="round">
          <g stroke="#7f8a4d" strokeWidth="3">
            <line x1="130" y1="192" x2="126" y2="168" />
            <line x1="146" y1="192" x2="146" y2="164" />
            <line x1="162" y1="192" x2="166" y2="168" />
          </g>
          <g stroke="#a08cc0" strokeWidth="6">
            <line x1="125" y1="166" x2="122" y2="152" />
            <line x1="146" y1="162" x2="146" y2="148" />
            <line x1="167" y1="166" x2="170" y2="152" />
          </g>
        </g>
        <g className="scene-butterfly">
          <ellipse cx="196" cy="132" rx="6" ry="4" fill="#cf6b3f" transform="rotate(-25 196 132)" />
          <ellipse cx="206" cy="130" rx="6" ry="4" fill="#e3b62e" transform="rotate(25 206 130)" />
          <line x1="201" y1="126" x2="201" y2="138" stroke="#4a4a42" strokeWidth="1.5" />
        </g>

        {/* the two of them at the garden table, after Ugnė's drawing */}
        <g>
          <rect x="420" y="152" width="96" height="7" rx="3" fill="#6b5f46" />
          <rect x="428" y="159" width="7" height="33" fill="#6b5f46" />
          <rect x="501" y="159" width="7" height="33" fill="#6b5f46" />
          {/* mugs on the table */}
          <rect x="446" y="142" width="11" height="10" rx="2" fill="#cf6b3f" />
          <rect x="478" y="142" width="11" height="10" rx="2" fill="#8a9a4a" />
          {/* Don: dark hair */}
          <g>
            <circle cx="398" cy="132" r="9" fill="#e8b48c" />
            <path d="M389 128 a9 9 0 0 1 18 0 z" fill="#3a2c20" />
            <rect x="391" y="141" width="14" height="26" rx="6" fill="#5c6b3f" />
            <rect x="391" y="166" width="14" height="26" rx="6" fill="#43503a" />
          </g>
          {/* Ugnė: blonde hair */}
          <g>
            <circle cx="540" cy="132" r="9" fill="#eec09a" />
            <path d="M531 130 a9 9 0 0 1 18 0 l2 12 h-4 z" fill="#dfb35e" />
            <rect x="533" y="141" width="14" height="26" rx="6" fill="#b06a52" />
            <rect x="533" y="166" width="14" height="26" rx="6" fill="#43503a" />
          </g>
        </g>
      </svg>
    </div>
  );
}
