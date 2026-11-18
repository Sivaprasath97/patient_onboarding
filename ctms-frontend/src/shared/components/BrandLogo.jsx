import { useState } from 'react';

/**
 * Project logo. Loads /logo.png (put the licensed logo file at ctms-frontend/public/logo.png).
 * Until that file exists, a neutral placeholder mark in the brand colours is shown.
 */
export default function BrandLogo({ size = 40, className = '', variant = 'tile' }) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <img
        src="/logo.png"
        alt="CTMS logo"
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className={`object-contain ${variant === 'tile' ? 'rounded-lg bg-white p-1 border border-outline-variant' : ''} ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // Placeholder: simple medical cross on the brand gradient.
  return (
    <span
      role="img"
      aria-label="CTMS logo"
      className={`inline-flex items-center justify-center rounded-lg bg-brand-gradient shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} aria-hidden="true">
        <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" fill="#fff" />
        <circle cx="19" cy="19" r="3.2" fill="#7DCB45" stroke="#fff" strokeWidth="1.2" />
      </svg>
    </span>
  );
}

export function BrandName({ subtitle, light }) {
  return (
    <div className="overflow-hidden leading-tight">
      <div className={`font-headline-md text-headline-md font-bold tracking-tight ${light ? 'text-white' : 'text-primary'}`}>
        CTMS<span className={light ? 'text-brand-lime' : 'text-brand-green'}> Portal</span>
      </div>
      {subtitle && (
        <div className={`font-label-sm text-label-sm truncate ${light ? 'text-on-primary-container' : 'text-on-surface-variant'}`}>{subtitle}</div>
      )}
    </div>
  );
}
