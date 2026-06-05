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
    >
      {/* Upper wing */}
      <path d="M28 4L4 12L12 16L28 4Z" fill="white" />
      {/* Lower wing — slightly recessed */}
      <path d="M28 4L12 16L16 28L28 4Z" fill="white" fillOpacity="0.72" />
      {/* Fold crease line */}
      <line
        x1="12" y1="16"
        x2="16" y2="28"
        stroke="rgba(37,99,235,0.35)"
        strokeWidth="0.75"
        strokeLinecap="round"
      />
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
      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/30">
        <LogoIcon size={20} />
      </div>
      {showWordmark && (
        <span className={`font-semibold tracking-tight text-sm ${wordmarkClass}`}>
          PaperPilot
        </span>
      )}
    </div>
  );
}
