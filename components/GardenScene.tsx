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

        {/* kitchen garden: carrot bed, tomatoes on stakes, cucumber vine,
            herb pots by the house */}
        <g>
          {/* carrot bed */}
          <rect x="30" y="176" width="78" height="13" rx="3" fill="#8a6a4a" />
          <g stroke="#5f7d2e" strokeWidth="2" strokeLinecap="round" fill="none">
            <path d="M44 176 v-9 m-4 9 l-3 -8 m7 8 l3 -8" />
            <path d="M68 176 v-10 m-4 10 l-3 -8 m7 8 l3 -8" />
            <path d="M92 176 v-9 m-4 9 l-3 -8 m7 8 l3 -8" />
          </g>
          <path d="M112 188 l14 -4 l-1 4 l-13 3 z" fill="#d97b2f" />

          {/* tomato plant */}
          <g stroke="#7a5a3a" strokeWidth="3" strokeLinecap="round">
            <line x1="265" y1="190" x2="265" y2="142" />
            <line x1="300" y1="190" x2="300" y2="142" />
          </g>
          <path
            d="M265 185 q18 -8 35 -25 M300 183 q-20 -10 -35 -28"
            fill="none"
            stroke="#5f7d2e"
            strokeWidth="2.5"
          />
          <g fill="#d24d33">
            <circle cx="272" cy="162" r="5" />
            <circle cx="290" cy="172" r="5.5" />
            <circle cx="302" cy="153" r="4.5" />
          </g>
          <g fill="#5f7d2e">
            <path d="M269 157 l3 -3 l3 3 z" />
            <path d="M287 167 l3 -3 l3 3 z" />
            <path d="M299 149 l3 -3 l3 3 z" />
          </g>

          {/* cucumber vine */}
          <path
            d="M580 190 q16 -10 32 0 q16 10 34 -2"
            fill="none"
            stroke="#5f7d2e"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <g fill="#6f8f34">
            <circle cx="596" cy="182" r="4" />
            <circle cx="628" cy="186" r="4" />
          </g>
          <rect x="598" y="188" width="26" height="8" rx="4" fill="#4f7a28" />
          <rect x="634" y="184" width="22" height="7" rx="3.5" fill="#5f8e33" transform="rotate(-12 645 187)" />

          {/* herb pots by the house */}
          <g>
            <path d="M1062 178 h20 l-3 16 h-14 z" fill="#b06a52" />
            <circle cx="1068" cy="172" r="5" fill="#5f7d2e" />
            <circle cx="1076" cy="169" r="5" fill="#6f8f34" />
            <circle cx="1072" cy="176" r="4" fill="#54702a" />
            <path d="M1094 178 h20 l-3 16 h-14 z" fill="#b06a52" />
            <g stroke="#5f7d2e" strokeWidth="2" strokeLinecap="round">
              <line x1="1100" y1="178" x2="1097" y2="160" />
              <line x1="1104" y1="178" x2="1104" y2="158" />
              <line x1="1108" y1="178" x2="1111" y2="160" />
            </g>
          </g>
        </g>

        {/* kamado grill, after their navy Kamado Bono: conical lid, black
            cap and side shelves, splayed cart with casters */}
        <g>
          <g stroke="#1d1d1a" strokeWidth="2.5" strokeLinecap="round">
            <line x1="708" y1="176" x2="701" y2="191" />
            <line x1="728" y1="176" x2="735" y2="191" />
          </g>
          <circle cx="701" cy="192" r="2.5" fill="#1d1d1a" />
          <circle cx="735" cy="192" r="2.5" fill="#1d1d1a" />
          <path d="M701 157 a17 21 0 0 0 34 0 z" fill="#24405f" />
          <path d="M704 155 l8 -19 q6 -4 12 0 l8 19 z" fill="#2a4d7a" />
          <rect x="710" y="130" width="16" height="6" rx="2" fill="#1d1d1a" />
          <circle cx="718" cy="146" r="2.5" fill="#e9e7d8" />
          <rect x="696" y="155" width="44" height="4" rx="2" fill="#1d1d1a" />
          <rect x="684" y="151" width="12" height="5" rx="1.5" fill="#1d1d1a" />
          <rect x="740" y="151" width="12" height="5" rx="1.5" fill="#1d1d1a" />
        </g>

        {/* olive tree, for Ugnė */}
        <g>
          <path
            d="M1160 194 q-2 -18 -6 -30 q10 4 8 -14"
            fill="none"
            stroke="#7a5a3a"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <g fill="#98a878">
            <circle cx="1150" cy="140" r="13" />
            <circle cx="1168" cy="134" r="14" />
            <circle cx="1182" cy="146" r="11" />
            <circle cx="1160" cy="152" r="12" />
          </g>
          <g fill="#4a4a30">
            <circle cx="1156" cy="142" r="2" />
            <circle cx="1172" cy="138" r="2" />
            <circle cx="1178" cy="150" r="2" />
          </g>
        </g>

        {/* padel backpack by the house (after Ugnė's Bullpadel Vertex):
            tall white pack, dark trim, racket poking out of the top */}
        <g>
          {/* Don's NOX AT10: white face, grey carbon X, white grip */}
          <g transform="rotate(10 812 146)">
            <rect x="809" y="140" width="6" height="14" rx="2" fill="#e9e7d8" stroke="#3a3a34" strokeWidth="1" />
            <ellipse
              cx="812"
              cy="132"
              rx="7.5"
              ry="10"
              fill="#f2f0e6"
              stroke="#3a3a34"
              strokeWidth="1.5"
            />
            <path
              d="M808 127 l8 10 M816 127 l-8 10"
              stroke="#8a8a80"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
          {/* Ugnė's NOX ML10 Pro Cup: white face, gold X, black grip */}
          <g transform="rotate(-14 800 148)">
            <rect x="797" y="142" width="6" height="14" rx="2" fill="#1d1d1a" />
            <ellipse
              cx="800"
              cy="134"
              rx="7.5"
              ry="10"
              fill="#f2f0e6"
              stroke="#3a3a34"
              strokeWidth="1.5"
            />
            <path
              d="M796 129 l8 10 M804 129 l-8 10"
              stroke="#c9a227"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
          <path d="M789 150 q4 -6 10 -4" fill="none" stroke="#3a3a34" strokeWidth="2.5" strokeLinecap="round" />
          <path
            d="M778 190 q0 4 4 4 h36 q4 0 4 -4 l-3 -34 q-1 -8 -9 -8 h-20 q-8 0 -9 8 z"
            fill="#f4f2e8"
            stroke="#3a3a34"
            strokeWidth="2"
          />
          <path d="M781 168 l38 12 v10 q0 4 -4 4 h-30 q-4 0 -4 -4 z" fill="#3a3a34" />
          <path d="M785 156 q15 6 32 18" fill="none" stroke="#3a3a34" strokeWidth="2" />
          <circle cx="789" cy="184" r="2.2" fill="#cf6b3f" />
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
