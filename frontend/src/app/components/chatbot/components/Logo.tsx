import React from 'react'

/**
 * Visa Guide brand mark: a small passport glyph drawn in SVG (no emoji), set on
 * an ink badge with a gold accent. Used in the sidebar and the welcome screen.
 */
export default function Logo({ size = 38 }: { size?: number }) {
  const id = React.useId()
  return (
    <span className="logo" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1B2C4E" />
            <stop offset="1" stopColor="#0C1830" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill={`url(#${id}-bg)`} />
        <rect x="0.5" y="0.5" width="39" height="39" rx="10.5" stroke="#ffffff" strokeOpacity="0.08" />
        {/* passport book */}
        <g stroke="#E6B458" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="12" y="9" width="16" height="22" rx="2.5" />
          <circle cx="20" cy="17.5" r="4" />
          <path d="M20 13.6c1.7 1.1 1.7 6.7 0 7.8c-1.7-1.1-1.7-6.7 0-7.8Z" strokeWidth="1.2" />
          <line x1="16.5" y1="25.5" x2="23.5" y2="25.5" />
        </g>
      </svg>
    </span>
  )
}
