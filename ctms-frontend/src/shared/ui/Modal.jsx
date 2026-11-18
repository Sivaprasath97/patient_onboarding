import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button.jsx';
import { FormAlert } from './Form.jsx';

const SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

export default function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-8 overflow-y-auto">
      <div className="fixed inset-0 bg-[#0F172A]/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${SIZES[size]} bg-surface-container-lowest rounded-xl border border-[#E2E8F0] my-auto`}
        style={{ boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.08), 0 1px 2px 0 rgba(15, 23, 42, 0.04)' }}
      >
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#E2E8F0]">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">{title}</h2>
            {subtitle && <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-container-low text-outline" aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto custom-scroll">{children}</div>
        {footer && <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] rounded-b-xl">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Modal with a <form>: handles submit, loading and error display.
 *   onSubmit: async () => {...}  (throw to show an error)
 */
export function FormModal({ open, onClose, title, subtitle, size, submitLabel = 'Save', submitVariant = 'primary', onSubmit, loading, error, children }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size={size}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={submitVariant} type="submit" form="modal-form" loading={loading}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form
        id="modal-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        <FormAlert>{error}</FormAlert>
        {children}
      </form>
    </Modal>
  );
}
