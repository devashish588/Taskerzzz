import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, CheckCircle, Flag, X } from 'lucide-react';
import { tasksApi, projectsApi, usersApi } from '../../api/modules';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import Modal from '../../components/Modal';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const Tasks = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [reviewTask, setReviewTask] = useState(null);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', projectId: '' });
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', projectId: '', assignedToId: '', dueDate: '', estimatedMinutes: 10, category: '' });

  const load = useCallback(async () => {
    try {
      const params = { limit: 100 };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.projectId) params.projectId = filters.projectId;
      const res = await tasksApi.getAll(params);
      setTasks(res.data.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (isAdmin) {
      projectsApi.getAll({ limit: 100 }).then((r) => setProjects(r.data.data)).catch(console.error);
      usersApi.getAll({ limit: 100 }).then((r) => setUsers(r.data.data)).catch(console.error);
    }
  }, [isAdmin]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await tasksApi.create(form);
      toast.success('Task created');
      setShowCreate(false);
      setForm({ title: '', description: '', priority: 'MEDIUM', projectId: '', assignedToId: '', dueDate: '', estimatedMinutes: 10, category: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <LoadingSkeleton type="table" count={8} />;

  // Separate review queue
  const reviewQueue = tasks.filter((t) => t.status === 'IN_REVIEW');
  const otherTasks = tasks;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-400" />
          <input value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} className="input pl-8 text-sm" placeholder="Search tasks..." />
        </div>
        <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="select text-sm">
          <option value="">All Status</option>
          {['ASSIGNED','IN_PROGRESS','IN_REVIEW','COMPLETED','FLAGGED','SKIPPED'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </select>
        <select value={filters.priority} onChange={(e) => setFilters({...filters, priority: e.target.value})} className="select text-sm">
          <option value="">All Priority</option>
          {['CRITICAL','HIGH','MEDIUM','LOW'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {isAdmin && <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5 ml-auto text-xs"><Plus size={14}/>New Task</button>}
      </div>

      {/* Review queue highlight */}
      {isAdmin && reviewQueue.length > 0 && (
        <div className="glass-card p-3 border-warning/20">
          <h3 className="text-xs font-semibold text-warning uppercase tracking-wider mb-2">Pending Review ({reviewQueue.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {reviewQueue.map((t) => (
              <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-warning/5 border border-warning/15 hover:border-warning/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium truncate">{t.title}</p>
                  <p className="text-[10px] text-base-400">{t.assignedTo?.name} · {t.project?.name}</p>
                </div>
                <button onClick={() => setReviewTask(t)} className="px-2 py-1 text-[10px] font-semibold bg-warning/15 text-warning rounded border border-warning/20 hover:bg-warning/25 transition-colors whitespace-nowrap">
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {otherTasks.length === 0 ? (
        <EmptyState title="No tasks found" description="Create tasks or adjust your filters" />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead><tr><th>Task</th><th>Project</th><th>Priority</th><th>Status</th><th>Est.</th><th>Assignee</th><th>Due</th>{isAdmin && <th>Action</th>}</tr></thead>
            <tbody>
              {otherTasks.map((t) => (
                <tr key={t.id} className="cursor-pointer" onClick={() => navigate(`/tasks/${t.id}`)}>
                  <td><span className="text-white font-medium text-xs">{t.title}</span></td>
                  <td className="text-base-300 text-[10px]">{t.project?.name}</td>
                  <td><PriorityBadge priority={t.priority} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td className="text-[10px] text-base-300 font-mono">{t.estimatedMinutes ? `${t.estimatedMinutes}m` : '—'}</td>
                  <td>
                    {t.assignedTo ? (
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent to-purple flex items-center justify-center text-[8px] font-bold text-white">{t.assignedTo.name?.charAt(0)}</div>
                        <span className="text-[10px] text-base-200">{t.assignedTo.name}</span>
                      </div>
                    ) : <span className="text-[10px] text-base-500">—</span>}
                  </td>
                  <td className="text-[10px] text-base-300 font-mono">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
                  {isAdmin && (
                    <td onClick={(e) => e.stopPropagation()}>
                      {t.status === 'IN_REVIEW' && (
                        <button onClick={() => setReviewTask(t)} className="text-[10px] text-warning hover:text-warning-light font-semibold">Review</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create task modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Task">
        <form onSubmit={handleCreate} className="space-y-3">
          <div><label className="block text-[11px] text-base-300 uppercase tracking-wider font-semibold mb-1">Title *</label><input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="input text-sm" required /></div>
          <div><label className="block text-[11px] text-base-300 uppercase tracking-wider font-semibold mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="input text-sm" rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[11px] text-base-300 uppercase tracking-wider font-semibold mb-1">Project *</label><select value={form.projectId} onChange={(e) => setForm({...form, projectId: e.target.value})} className="select w-full text-sm" required><option value="">Select</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="block text-[11px] text-base-300 uppercase tracking-wider font-semibold mb-1">Assign To</label><select value={form.assignedToId} onChange={(e) => setForm({...form, assignedToId: e.target.value})} className="select w-full text-sm"><option value="">Unassigned</option>{users.filter(u=>u.role==='TASKER').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-[11px] text-base-300 uppercase tracking-wider font-semibold mb-1">Priority</label><select value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value})} className="select w-full text-sm">{['CRITICAL','HIGH','MEDIUM','LOW'].map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><label className="block text-[11px] text-base-300 uppercase tracking-wider font-semibold mb-1">Est. Time</label><input type="number" min="1" value={form.estimatedMinutes} onChange={(e) => setForm({...form, estimatedMinutes: parseInt(e.target.value) || 10})} className="input text-sm" /></div>
            <div><label className="block text-[11px] text-base-300 uppercase tracking-wider font-semibold mb-1">Due Date</label><input type="date" value={form.dueDate} onChange={(e) => setForm({...form, dueDate: e.target.value})} className="input text-sm" /></div>
          </div>
          <div><label className="block text-[11px] text-base-300 uppercase tracking-wider font-semibold mb-1">Category</label><input value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="input text-sm" placeholder="e.g. Frontend, Backend" /></div>
          <div className="flex gap-2 justify-end"><button type="button" onClick={() => setShowCreate(false)} className="btn-secondary text-xs">Cancel</button><button type="submit" className="btn-primary text-xs">Create</button></div>
        </form>
      </Modal>

      {/* Review modal */}
      {reviewTask && <ReviewModal task={reviewTask} onClose={() => setReviewTask(null)} onDone={() => { setReviewTask(null); load(); }} />}
    </div>
  );
};

const ReviewModal = ({ task, onClose, onDone }) => {
  const [action, setAction] = useState('approve');
  const [feedback, setFeedback] = useState('');
  const [qualityScore, setQualityScore] = useState(80);
  const [timeScore, setTimeScore] = useState(80);
  const [flagReason, setFlagReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await tasksApi.review(task.id, {
        action,
        reviewNote: feedback || null,
        qualityScore: parseInt(qualityScore),
        timeScore: parseInt(timeScore),
        flagReason: action === 'flag' ? flagReason : null,
      });
      toast.success(action === 'approve' ? 'Task approved' : 'Task flagged');
      onDone();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white font-heading">Review Task</h3>
          <button onClick={onClose} className="text-base-400 hover:text-white"><X size={16} /></button>
        </div>

        <div className="mb-4 p-3 rounded-lg bg-base-900/50 border border-base-700/40">
          <p className="text-sm text-white font-medium">{task.title}</p>
          <p className="text-[10px] text-base-400 mt-1">{task.assignedTo?.name} · {task.project?.name} · Est. {task.estimatedMinutes || '?'}m</p>
        </div>

        {/* Action toggle */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setAction('approve')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 ${action === 'approve' ? 'bg-success/15 border-success/30 text-success' : 'bg-base-800 border-base-600 text-base-300 hover:border-base-400'}`}>
            <CheckCircle size={14} /> Approve
          </button>
          <button onClick={() => setAction('flag')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 ${action === 'flag' ? 'bg-orange/15 border-orange/30 text-orange' : 'bg-base-800 border-base-600 text-base-300 hover:border-base-400'}`}>
            <Flag size={14} /> Flag
          </button>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[10px] text-base-300 uppercase tracking-wider font-semibold mb-1 block">Quality Score (%)</label>
            <input type="number" min="0" max="100" value={qualityScore} onChange={(e) => setQualityScore(e.target.value)} className="input text-sm" />
          </div>
          <div>
            <label className="text-[10px] text-base-300 uppercase tracking-wider font-semibold mb-1 block">Time Efficiency (%)</label>
            <input type="number" min="0" max="100" value={timeScore} onChange={(e) => setTimeScore(e.target.value)} className="input text-sm" />
          </div>
        </div>

        {/* Feedback */}
        <div className="mb-3">
          <label className="text-[10px] text-base-300 uppercase tracking-wider font-semibold mb-1 block">Feedback</label>
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} className="input text-sm" rows={2} placeholder="Optional review notes..." />
        </div>

        {/* Flag reason (only when flagging) */}
        {action === 'flag' && (
          <div className="mb-3">
            <label className="text-[10px] text-orange uppercase tracking-wider font-semibold mb-1 block">Rejection Reason *</label>
            <textarea value={flagReason} onChange={(e) => setFlagReason(e.target.value)} className="input text-sm border-orange/30" rows={2} placeholder="Why is this task being flagged?" required />
          </div>
        )}

        <button onClick={handleSubmit} disabled={submitting || (action === 'flag' && !flagReason)}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${action === 'approve' ? 'bg-success/20 text-success border border-success/30 hover:bg-success/30' : 'bg-orange/20 text-orange border border-orange/30 hover:bg-orange/30'}`}>
          {submitting ? 'Processing...' : action === 'approve' ? 'Approve Task' : 'Flag Task'}
        </button>
      </div>
    </div>
  );
};

export default Tasks;
