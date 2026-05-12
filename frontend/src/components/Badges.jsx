const statusMap = {
  ASSIGNED: { label: 'Assigned', class: 'badge-assigned' },
  IN_PROGRESS: { label: 'In Progress', class: 'badge-in-progress' },
  IN_REVIEW: { label: 'In Review', class: 'badge-in-review' },
  COMPLETED: { label: 'Completed', class: 'badge-completed' },
  FLAGGED: { label: 'Flagged', class: 'badge-flagged' },
  SKIPPED: { label: 'Skipped', class: 'badge-skipped' },
  ACTIVE: { label: 'Active', class: 'badge-active' },
  ON_HOLD: { label: 'On Hold', class: 'badge-on-hold' },
  ARCHIVED: { label: 'Archived', class: 'badge-archived' },
};

const priorityMap = {
  CRITICAL: { label: 'Critical', class: 'badge-critical' },
  HIGH: { label: 'High', class: 'badge-high' },
  MEDIUM: { label: 'Medium', class: 'badge-medium' },
  LOW: { label: 'Low', class: 'badge-low' },
};

export const StatusBadge = ({ status }) => {
  const s = statusMap[status] || { label: status, class: 'badge-assigned' };
  return <span className={`badge ${s.class}`}>{s.label}</span>;
};

export const PriorityBadge = ({ priority }) => {
  const p = priorityMap[priority] || { label: priority, class: 'badge-medium' };
  return <span className={`badge ${p.class}`}>{p.label}</span>;
};
