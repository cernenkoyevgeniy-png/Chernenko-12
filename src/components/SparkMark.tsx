type Props = {
  className?: string;
  animate?: boolean;
};

export default function SparkMark({ className = 'h-7 w-7', animate = false }: Props) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${animate ? 'animate-sparkPulse' : ''}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sparkGrad" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fdba74" />
          <stop offset="0.5" stopColor="#f97316" />
          <stop offset="1" stopColor="#f43f5e" />
        </linearGradient>
        <radialGradient id="sparkCore" cx="24" cy="22" r="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff7ed" />
          <stop offset="1" stopColor="#fdba74" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d="M24 3c1.3 7.2 4.8 11.4 12 13-7.2 1.6-10.7 5.8-12 13-1.3-7.2-4.8-11.4-12-13 7.2-1.6 10.7-5.8 12-13Z"
        fill="url(#sparkGrad)"
      />
      <path
        d="M24 3c1.3 7.2 4.8 11.4 12 13-7.2 1.6-10.7 5.8-12 13-1.3-7.2-4.8-11.4-12-13 7.2-1.6 10.7-5.8 12-13Z"
        fill="url(#sparkCore)"
        opacity="0.9"
      />
      <circle cx="24" cy="16" r="3.2" fill="#fff7ed" />
      <path
        d="M38 30c.5 2.6 1.8 4.1 4.2 4.7-2.4.6-3.7 2.1-4.2 4.7-.5-2.6-1.8-4.1-4.2-4.7 2.4-.6 3.7-2.1 4.2-4.7Z"
        fill="#fbbf24"
      />
      <path
        d="M9 6c.4 2 .9 3 2.8 3.4C9.9 9.8 9.4 10.8 9 12.8c-.4-2-.9-3-2.8-3.4C8.1 9 8.6 8 9 6Z"
        fill="#fdba74"
        opacity="0.85"
      />
    </svg>
  );
}
