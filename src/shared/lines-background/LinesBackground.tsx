"use client";

/**
 * Абстрактный фон на главной: линии, дуги, формы.
 * Адаптируется к светлой и тёмной теме, лёгкая анимация.
 */
export default function LinesBackground() {
  return (
    <div className="lines-background" aria-hidden>
      <svg
        viewBox="0 0 1200 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="abstractGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.08" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id="abstractGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.16" />
          </linearGradient>
          <linearGradient id="abstractGrad3" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.12" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Мягкие дуги и волны */}
        <g className="lines-background__shapes">
          <path
            className="lines-background__line"
            pathLength={1}
            stroke="url(#abstractGrad1)"
            strokeWidth="1.2"
            strokeLinecap="round"
            d="M -50 200 Q 200 80 450 250 T 950 180 T 1250 350"
          />
          <path
            className="lines-background__line"
            pathLength={1}
            stroke="url(#abstractGrad1)"
            strokeWidth="1"
            strokeLinecap="round"
            d="M -30 500 Q 300 380 600 520 T 1230 450"
          />
          <path
            className="lines-background__line"
            pathLength={1}
            stroke="url(#abstractGrad2)"
            strokeWidth="1"
            strokeLinecap="round"
            d="M 1200 150 Q 800 280 400 120 Q 100 50 -50 220"
          />
          <path
            className="lines-background__line"
            pathLength={1}
            stroke="url(#abstractGrad2)"
            strokeWidth="0.8"
            strokeLinecap="round"
            d="M 0 700 Q 400 600 800 720 Q 1100 800 1250 650"
          />
          <path
            className="lines-background__line"
            pathLength={1}
            stroke="url(#abstractGrad1)"
            strokeWidth="0.8"
            strokeLinecap="round"
            d="M 200 0 L 180 400 Q 220 550 200 900"
          />
          <path
            className="lines-background__line"
            pathLength={1}
            stroke="url(#abstractGrad1)"
            strokeWidth="0.8"
            strokeLinecap="round"
            d="M 1000 0 L 1020 400 Q 980 550 1000 900"
          />
        </g>

        {/* Круги — размытые пятна */}
        <g className="lines-background__circles">
          <circle className="lines-background__circle" cx="200" cy="300" r="120" fill="url(#abstractGrad3)" />
          <circle className="lines-background__circle" cx="950" cy="400" r="100" fill="url(#abstractGrad3)" />
          <circle className="lines-background__circle" cx="600" cy="650" r="140" fill="url(#abstractGrad3)" />
        </g>

        {/* Сетка из тонких линий */}
        <g className="lines-background__grid" stroke="currentColor" strokeWidth="0.35" opacity="0.1">
          {[180, 360, 540, 720].map((y) => (
            <line key={`h-${y}`} x1="0" y1={y} x2="1200" y2={y} />
          ))}
          {[240, 480, 720, 960].map((x) => (
            <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="900" />
          ))}
        </g>
      </svg>
    </div>
  );
}
