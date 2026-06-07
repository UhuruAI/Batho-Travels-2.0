// Ndebele-inspired triangular border lifted from the Batho logo.
// SVG repeats horizontally. Color follows currentColor so it adapts to the surface.

export function BorderPattern({
  height = 16,
  className,
  flip = false
}: {
  height?: number;
  className?: string;
  flip?: boolean;
}) {
  const transform = flip ? "scale(1, -1) translate(0, -16)" : undefined;
  return (
    <svg
      className={["batho-border-pattern", className].filter(Boolean).join(" ")}
      style={{ height }}
      viewBox="0 0 64 16"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <pattern id="batho-tri" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <g transform={transform}>
            <polygon points="0,16 8,2 16,16" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <polygon points="8,16 12,9 16,16" fill="currentColor" opacity="0.5" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#batho-tri)" />
    </svg>
  );
}
