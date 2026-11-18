import { Fragment } from 'react';
import { PERMISSION_GROUPS, ROLES } from '../../../shared/auth/permissions.js';
import { Card } from '../../../shared/ui/index.js';

/** Read-only role × permission matrix (SRD §3). Roles are fixed; assign them to users on the Users tab. */
export default function RolesMatrix() {
  return (
    <Card title="Roles & permissions" icon="shield_person" bodyClassName="p-0"
      subtitle="What each role can do. Roles are fixed by the SRD; change a user's access by changing their role.">
      <div className="overflow-x-auto custom-scroll">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <th className="px-4 py-2.5 font-label-md text-[11px] uppercase tracking-[0.04em] text-[#64748B] w-[38%]">Permission</th>
              {ROLES.map((r) => (
                <th key={r.value} className="px-2 py-2.5 font-label-md text-[11px] uppercase tracking-[0.04em] text-[#64748B] text-center">{r.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_GROUPS.map(([group, perms]) => (
              <Fragment key={group}>
                <tr className="bg-surface-container-low">
                  <td colSpan={ROLES.length + 1} className="px-4 py-1.5 font-label-md text-label-md uppercase tracking-[0.04em] text-primary">{group}</td>
                </tr>
                {perms.map(([p, desc, roles]) => (
                  <tr key={p} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                    <td className="px-4 py-2">
                      <div className="font-body-md text-body-md text-on-surface">{desc}</div>
                      <div className="font-data-mono-sm text-data-mono-sm text-outline">{p}</div>
                    </td>
                    {ROLES.map((r) => (
                      <td key={r.value} className="px-2 py-2 text-center">
                        {roles.includes(r.value) ? (
                          <span className="material-symbols-outlined text-secondary text-[20px]" aria-label="Allowed">check_circle</span>
                        ) : (
                          <span className="text-outline-variant" aria-label="Not allowed">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
