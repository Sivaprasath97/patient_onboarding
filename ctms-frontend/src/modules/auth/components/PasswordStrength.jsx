/** Password strength meter with the policy checklist. */
export function scorePassword(pw = '') {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

const LEVELS = [
  ['Too weak', 'bg-error'],
  ['Weak', 'bg-[#D97706]'],
  ['Fair', 'bg-[#EAB308]'],
  ['Good', 'bg-brand-green'],
  ['Strong', 'bg-secondary'],
];

export default function PasswordStrength({ password }) {
  if (!password) return null;
  const score = scorePassword(password);
  const rules = [
    [password.length >= 8, 'At least 8 characters'],
    [/[A-Za-z]/.test(password), 'A letter'],
    [/\d/.test(password), 'A number'],
  ];
  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex-1 grid grid-cols-4 gap-1">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={`h-1.5 rounded-full ${i <= score ? LEVELS[score][1] : 'bg-surface-container'}`} />
          ))}
        </div>
        <span className="font-label-md text-label-md text-on-surface-variant w-16 text-right">{LEVELS[score][0]}</span>
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-0.5">
        {rules.map(([ok, label]) => (
          <li key={label} className={`flex items-center gap-1 font-body-sm text-body-sm ${ok ? 'text-secondary' : 'text-outline'}`}>
            <span className="material-symbols-outlined text-[14px]">{ok ? 'check_circle' : 'radio_button_unchecked'}</span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
