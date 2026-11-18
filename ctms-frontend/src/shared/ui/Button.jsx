import { Link } from 'react-router-dom';

const VARIANTS = {
  primary: 'bg-primary-container text-on-primary hover:bg-primary border border-transparent',
  secondary: 'bg-surface-container-lowest text-[#334155] border border-[#CBD5E1] hover:bg-[#F8FAFC]',
  danger: 'bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] hover:bg-[#FEE2E2]',
  solidDanger: 'bg-error text-on-error border border-transparent hover:bg-on-error-container',
  success: 'bg-secondary text-on-secondary border border-transparent hover:bg-on-secondary-fixed-variant',
  ghost: 'text-primary-container hover:bg-surface-container-low border border-transparent',
};
const SIZES = { sm: 'h-7 px-2.5 text-label-md font-label-md gap-1', md: 'h-9 px-3.5 text-label-lg font-label-lg gap-1.5' };

export default function Button({ variant = 'primary', size = 'md', icon, loading, to, className = '', children, ...props }) {
  const cls = `inline-flex items-center justify-center rounded-lg whitespace-nowrap transition-colors active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-container focus-visible:ring-offset-2 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
  const content = (
    <>
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
      ) : (
        icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>
      )}
      {children}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} disabled={loading || props.disabled} {...props}>
      {content}
    </button>
  );
}
