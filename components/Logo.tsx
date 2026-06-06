interface LogoIconProps {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 32, className = '' }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sg-g" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      {/* Nucleus */}
      <circle cx="16" cy="16" r="2.75" fill="url(#sg-g)" />
      {/* Orbit 1 */}
      <ellipse cx="16" cy="16" rx="13" ry="4.5" stroke="url(#sg-g)" strokeWidth="1.2" />
      {/* Orbit 2 */}
      <ellipse cx="16" cy="16" rx="13" ry="4.5" stroke="url(#sg-g)" strokeWidth="1.2" strokeOpacity="0.55" transform="rotate(60 16 16)" />
      {/* Orbit 3 */}
      <ellipse cx="16" cy="16" rx="13" ry="4.5" stroke="url(#sg-g)" strokeWidth="1.2" strokeOpacity="0.55" transform="rotate(-60 16 16)" />
    </svg>
  );
}

interface LogoProps {
  showWordmark?: boolean;
  wordmarkClass?: string;
}

export function Logo({ showWordmark = true, wordmarkClass = '' }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoIcon size={24} />
      {showWordmark && (
        <span className={`font-semibold tracking-tight text-sm ${wordmarkClass}`}>
          Scigestible
        </span>
      )}
    </div>
  );
}
