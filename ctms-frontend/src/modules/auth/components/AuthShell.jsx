import BrandLogo, { BrandName } from '../../../shared/components/BrandLogo.jsx';

/** Split-screen frame shared by login, register, forgot and reset password pages. */
export default function AuthShell({ title, subtitle, children, footer, aside }) {
  return (
    <div className="min-h-screen flex bg-background text-on-surface antialiased">
      {/* Brand panel */}
      <aside className="hidden lg:flex w-[44%] max-w-[640px] bg-brand-gradient text-on-primary flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-white/10" />
        <div className="absolute -left-20 bottom-6 w-80 h-80 rounded-full bg-leaf-gradient opacity-25" />

        <div className="relative flex items-center gap-3">
          <BrandLogo size={48} />
          <BrandName light subtitle="Clinical Trial Management System" />
        </div>

        <div className="relative space-y-6">
          <h2 className="font-display-lg text-display-lg leading-tight">
            Precision trial operations, from screening to close-out.
          </h2>
          <ul className="space-y-3 font-body-lg text-body-lg text-on-primary-container">
            {[
              ['verified_user', 'Role-based access for every member of the study team'],
              ['groups', 'Participant onboarding with eligibility & consent tracking'],
              ['policy', 'Audit-ready activity logs on every action'],
            ].map(([icon, text]) => (
              <li key={icon} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-brand-lime text-xl">{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative font-data-mono-sm text-data-mono-sm text-on-primary-container">
          ICH-GCP aligned • Encrypted in transit • Audit logged
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md py-6">
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <BrandLogo size={36} />
            <BrandName />
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface">{title}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1 mb-6">{subtitle}</p>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 sm:p-6 border-t-4 border-t-brand-green">{children}</div>
          {footer && <div className="mt-5 text-center font-body-md text-body-md text-on-surface-variant">{footer}</div>}
          {aside}
        </div>
      </main>
    </div>
  );
}
