// Clinical status colours, aligned to the brand palette (blue = primary, green = active/success).
const TONES = {
  slate: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
  indigo: 'bg-[#EEF2FF] text-[#3730A3] border-[#C7D2FE]',
  teal: 'bg-[#EEF8EF] text-[#1B6B30] border-[#B7E2BF]',
  amber: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
  blue: 'bg-[#EAF4FA] text-[#165C8A] border-[#B9DCEF]',
  red: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
};
const DOTS = { slate: 'bg-[#64748B]', indigo: 'bg-[#4338CA]', teal: 'bg-[#23803A]', amber: 'bg-[#D97706]', blue: 'bg-[#1B74AC]', red: 'bg-[#DC2626]' };

const STATUS_TONE = {
  Draft: 'slate', Planned: 'indigo', Active: 'teal', Suspended: 'amber', Completed: 'blue', Terminated: 'red',
  Screening: 'amber', Enrolled: 'teal', 'Screen Failed': 'red', Withdrawn: 'red', Inactive: 'slate',
  Scheduled: 'indigo', Missed: 'red', Cancelled: 'slate', Overdue: 'red',
  Open: 'amber', Answered: 'indigo', Closed: 'slate', Reviewed: 'blue', Resolved: 'teal',
  Finalized: 'blue', Superseded: 'slate',
  Signed: 'teal', Pending: 'amber', Declined: 'red',
  Eligible: 'teal', 'Not eligible': 'red', Incomplete: 'slate',
  High: 'red', Medium: 'amber', Low: 'slate',
  Mild: 'teal', Moderate: 'amber', Severe: 'red', 'Life-threatening': 'red', Death: 'red',
  Minor: 'amber', Major: 'red', Critical: 'red', Serious: 'red', SAE: 'red',
  Ongoing: 'amber', Recovering: 'indigo', Recovered: 'teal', 'Recovered with sequelae': 'blue', Fatal: 'red', Unknown: 'slate',
};

export default function StatusBadge({ status, tone, children, dot = true, className = '' }) {
  const t = tone || STATUS_TONE[status] || 'slate';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border font-label-sm text-label-sm uppercase tracking-[0.04em] whitespace-nowrap ${TONES[t]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOTS[t]}`} />}
      {children || status}
    </span>
  );
}
