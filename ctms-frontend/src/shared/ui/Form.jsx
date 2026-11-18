import { useState } from 'react';

const base =
  'w-full bg-surface-container-lowest border rounded-lg text-[#0F172A] font-body-md text-body-md placeholder-outline focus:outline-none focus:ring-2 disabled:bg-[#F8FAFC] disabled:text-on-surface-variant';
const ok = 'border-[#CBD5E1] focus:border-primary-container focus:ring-primary-container/10';
const bad = 'border-error focus:border-error focus:ring-error/10';

export function Field({ label, name, error, hint, required, children, className = '' }) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={`f-${name}`} className="block font-label-lg text-label-lg text-on-surface">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="font-body-sm text-body-sm text-error">{error}</p>
      ) : (
        hint && <p className="font-body-sm text-body-sm text-outline">{hint}</p>
      )}
    </div>
  );
}

export function Input({ label, name, error, hint, required, icon, type = 'text', className, ...props }) {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  return (
    <Field label={label} name={name} error={error} hint={hint} required={required} className={className}>
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={`f-${name}`}
          name={name}
          type={isPw && show ? 'text' : type}
          aria-invalid={!!error}
          className={`${base} ${error ? bad : ok} h-9 px-3 ${icon ? 'pl-9' : ''} ${isPw ? 'pr-10' : ''}`}
          {...props}
        />
        {isPw && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-outline hover:text-on-surface"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            <span className="material-symbols-outlined text-[18px]">{show ? 'visibility_off' : 'visibility'}</span>
          </button>
        )}
      </div>
    </Field>
  );
}

export function Select({ label, name, error, hint, required, options = [], placeholder, className, ...props }) {
  return (
    <Field label={label} name={name} error={error} hint={hint} required={required} className={className}>
      <select id={`f-${name}`} name={name} aria-invalid={!!error} className={`${base} ${error ? bad : ok} h-9 pl-3 pr-8 py-0`} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const opt = typeof o === 'string' ? { value: o, label: o } : o;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </Field>
  );
}

export function TextArea({ label, name, error, hint, required, rows = 3, className, ...props }) {
  return (
    <Field label={label} name={name} error={error} hint={hint} required={required} className={className}>
      <textarea id={`f-${name}`} name={name} rows={rows} aria-invalid={!!error} className={`${base} ${error ? bad : ok} px-3 py-2`} {...props} />
    </Field>
  );
}

export function Checkbox({ label, name, checked, onChange, hint }) {
  return (
    <label className="flex items-start gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        name={name}
        checked={!!checked}
        onChange={onChange}
        className="mt-0.5 w-4 h-4 rounded border-[#94A3B8] text-primary-container focus:ring-primary-container"
      />
      <span>
        <span className="font-body-md text-body-md text-on-surface">{label}</span>
        {hint && <span className="block font-body-sm text-body-sm text-outline">{hint}</span>}
      </span>
    </label>
  );
}

export function FormAlert({ children }) {
  if (!children) return null;
  return (
    <div role="alert" className="flex items-start gap-2 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] font-body-md text-body-md">
      <span className="material-symbols-outlined text-[18px]">error</span>
      <span>{children}</span>
    </div>
  );
}

/** Search box used in list toolbars. */
export function SearchInput({ value, onChange, placeholder = 'Search…', className = 'w-72' }) {
  return (
    <div className={`relative ${className}`}>
      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${base} ${ok} h-9 pl-9 pr-3`}
      />
    </div>
  );
}

/** Compact select for toolbars (no label). */
export function FilterSelect({ value, onChange, options, placeholder = 'All', className = '' }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${base.replace('w-full ', '')} ${ok} h-9 pl-3 pr-8 py-0 w-full sm:w-auto max-w-full ${className}`}>
      <option value="">{placeholder}</option>
      {options.map((o) => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o;
        return (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        );
      })}
    </select>
  );
}
