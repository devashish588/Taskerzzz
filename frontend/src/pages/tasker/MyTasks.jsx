import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, List, Plus, Clock, Send, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { tasksApi, projectsApi } from '../../api/modules';
import { PriorityBadge } from '../../components/Badges';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'IN_PROGRESS', label: 'In Progress', color: '#006A67' },
  { id: 'IN_REVIEW', label: 'In Review', color: '#FFF4B7' },
  { id: 'COMPLETED', label: 'Completed', color: '#2dd4a8' },
  { id: 'FLAGGED', label: 'Flagged', color: '#ff8c42' },
  { id: 'SKIPPED', label: 'Skipped', color: '#80a0b4' },
];

const TIME_OPTIONS = [5, 10, 15];

const MyTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban');
  const [showAdd, setShowAdd] = useState(false);
  const [projects, setProjects] = useState([]);

  const load = async () => {
    try {
      const [tasksRes, projRes] = await Promise.all([
        tasksApi.getAll({ limit: 200 }),
        projectsApi.getAll({ limit: 50 }),
      ]);
      setTasks(tasksRes.data.data);
      setProjects(projRes.data.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Tasker cannot drag to COMPLETED
    if (newStatus === 'COMPLETED') {
      toast.error('Submit for review instead. Only admins can approve.');
      return;
    }

    // If dragging to IN_REVIEW, use submit endpoint
    if (newStatus === 'IN_REVIEW' && ['IN_PROGRESS', 'FLAGGED'].includes(task.status)) {
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: 'IN_REVIEW' } : t));
      try {
        await tasksApi.submitForReview(taskId);
        toast.success('Submitted for review');
      } catch { load(); toast.error('Failed to submit'); }
      return;
    }

    // Normal status change
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await tasksApi.update(taskId, { status: newStatus });
    } catch { load(); toast.error('Failed to update'); }
  };

  const handleResubmit = async (taskId) => {
    try {
      await tasksApi.submitForReview(taskId);
      toast.success('Resubmitted for review');
      load();
    } catch { toast.error('Failed to resubmit'); }
  };

  const handleStartTask = async (taskId) => {
    try {
      await tasksApi.update(taskId, { status: 'IN_PROGRESS' });
      toast.success('Task started');
      load();
    } catch { toast.error('Failed to start'); }
  };

  if (loading) return <LoadingSkeleton type="card" count={6} />;

  const grouped = {};
  COLUMNS.forEach((c) => { grouped[c.id] = tasks.filter((t) => t.status === c.id); });
  const assignedTasks = tasks.filter((t) => t.status === 'ASSIGNED');

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white font-heading">My Tasks</h2>
          <p className="text-[11px] text-base-400">{tasks.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
            <Plus size={14} /> Add Task
          </button>
          <div className="flex items-center gap-0.5 bg-base-800 rounded-lg p-0.5">
            <button onClick={() => setView('kanban')} className={`p-1.5 rounded-md transition-colors ${view === 'kanban' ? 'bg-base-600 text-cream' : 'text-base-400'}`}><LayoutGrid size={14} /></button>
            <button onClick={() => setView('list')} className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-base-600 text-cream' : 'text-base-400'}`}><List size={14} /></button>
          </div>
        </div>
      </div>

      {/* Assigned tasks — action bar */}
      {assignedTasks.length > 0 && (
        <div className="glass-card p-3">
          <h3 className="text-xs font-semibold text-cream uppercase tracking-wider mb-2">Assigned to you ({assignedTasks.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {assignedTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-base-800/60 border border-base-700/40 hover:border-accent/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{t.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {t.estimatedMinutes && <span className="text-[9px] text-base-400 font-mono">{t.estimatedMinutes}m</span>}
                    <PriorityBadge priority={t.priority} />
                  </div>
                </div>
                <button onClick={() => handleStartTask(t.id)} className="px-2 py-1 text-[10px] font-semibold bg-accent/15 text-accent-light rounded border border-accent/20 hover:bg-accent/25 transition-colors whitespace-nowrap">
                  Start
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState title="No tasks yet" description="Tasks assigned to you will appear here. You can also create your own." />
      ) : view === 'kanban' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {COLUMNS.map((col) => (
              <Droppable key={col.id} droppableId={col.id}>
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}
                    className={`kanban-column ${snapshot.isDraggingOver ? 'border-accent/30 bg-accent/5' : ''}`}>
                    <div className="flex items-center gap-2 mb-2 px-1 sticky top-0 bg-inherit z-10 py-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                      <span className="text-[10px] font-bold text-base-200 uppercase tracking-wider">{col.label}</span>
                      <span className="text-[10px] text-base-500 font-mono ml-auto">{grouped[col.id]?.length || 0}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
                      {grouped[col.id]?.map((task, idx) => (
                        <Draggable key={task.id} draggableId={task.id} index={idx} isDragDisabled={col.id === 'COMPLETED'}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                              className={`kanban-card ${snapshot.isDragging ? 'shadow-lg border-accent/30' : ''} ${col.id === 'FLAGGED' ? 'border-l-2 border-l-orange' : ''}`}>
                              <p className="text-[11px] text-white font-medium leading-tight mb-1.5">{task.title}</p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <PriorityBadge priority={task.priority} />
                                {task.estimatedMinutes && (
                                  <span className="text-[9px] text-base-400 font-mono flex items-center gap-0.5">
                                    <Clock size={9} />{task.estimatedMinutes}m
                                  </span>
                                )}
                                {task.category && <span className="text-[9px] text-base-500">{task.category}</span>}
                              </div>
                              {task.dueDate && (
                                <p className="text-[9px] text-base-500 mt-1 font-mono">{new Date(task.dueDate).toLocaleDateString()}</p>
                              )}
                              {/* Flagged: show reason and resubmit */}
                              {col.id === 'FLAGGED' && task.flagReason && (
                                <div className="mt-2 p-1.5 rounded bg-orange/10 border border-orange/20">
                                  <p className="text-[9px] text-orange leading-snug">{task.flagReason}</p>
                                  <button onClick={(e) => { e.stopPropagation(); handleResubmit(task.id); }}
                                    className="mt-1.5 flex items-center gap-1 text-[9px] font-semibold text-accent-light bg-accent/10 px-2 py-0.5 rounded border border-accent/20 hover:bg-accent/20">
                                    <Send size={8} /> Resubmit
                                  </button>
                                </div>
                              )}
                              {/* In progress: submit for review button */}
                              {col.id === 'IN_PROGRESS' && (
                                <button onClick={(e) => { e.stopPropagation(); handleResubmit(task.id); }}
                                  className="mt-1.5 w-full flex items-center justify-center gap-1 text-[9px] font-semibold text-cream bg-cream/8 px-2 py-1 rounded border border-cream/15 hover:bg-cream/15 transition-colors">
                                  <Send size={8} /> Submit for Review
                                </button>
                              )}
                              {/* Review note if present */}
                              {task.reviewNote && col.id !== 'FLAGGED' && (
                                <p className="text-[9px] text-base-400 mt-1 italic">"{task.reviewNote}"</p>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead><tr><th>Task</th><th>Category</th><th>Priority</th><th>Status</th><th>Est.</th><th>Due</th></tr></thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="cursor-pointer" onClick={() => navigate(`/tasks/${t.id}`)}>
                  <td className="text-white font-medium text-xs">{t.title}</td>
                  <td className="text-base-400 text-[10px]">{t.category || '—'}</td>
                  <td><PriorityBadge priority={t.priority} /></td>
                  <td><StatusDot status={t.status} /></td>
                  <td className="text-[10px] text-base-300 font-mono">{t.estimatedMinutes ? `${t.estimatedMinutes}m` : '—'}</td>
                  <td className="text-[10px] text-base-300 font-mono">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Add Modal */}
      {showAdd && <QuickAddModal projects={projects} onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(); }} />}
    </div>
  );
};

const StatusDot = ({ status }) => {
  const styles = {
    ASSIGNED: 'bg-base-400', IN_PROGRESS: 'bg-accent', IN_REVIEW: 'bg-warning',
    COMPLETED: 'bg-success', FLAGGED: 'bg-orange', SKIPPED: 'bg-base-500',
  };
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-base-200 uppercase">
      <span className={`w-1.5 h-1.5 rounded-full ${styles[status] || 'bg-base-500'}`} />
      {status?.replace('_', ' ')}
    </span>
  );
};

const QuickAddModal = ({ projects, onClose, onCreated }) => {
  const [form, setForm] = useState({ title: '', projectId: projects[0]?.id || '', estimatedMinutes: 10, priority: 'MEDIUM', category: '', notes: '' });
  const [customTime, setCustomTime] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.projectId) return toast.error('Title and project required');
    setSubmitting(true);
    try {
      await tasksApi.create(form);
      toast.success('Task created');
      onCreated();
    } catch { toast.error('Failed to create'); }
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white font-heading">Add Task</h3>
          <button onClick={onClose} className="text-base-400 hover:text-white"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] text-base-300 uppercase tracking-wider font-semibold mb-1 block">Title</label>
            <input className="input text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-base-300 uppercase tracking-wider font-semibold mb-1 block">Project</label>
              <select className="select w-full" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-base-300 uppercase tracking-wider font-semibold mb-1 block">Priority</label>
              <select className="select w-full" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-base-300 uppercase tracking-wider font-semibold mb-1 block">Estimated Time</label>
            <div className="flex items-center gap-2">
              {TIME_OPTIONS.map((t) => (
                <button type="button" key={t}
                  onClick={() => { setForm({ ...form, estimatedMinutes: t }); setCustomTime(false); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-colors ${form.estimatedMinutes === t && !customTime ? 'bg-accent/20 border-accent/40 text-accent-light' : 'bg-base-800 border-base-600 text-base-300 hover:border-base-400'}`}>
                  {t}m
                </button>
              ))}
              <button type="button" onClick={() => setCustomTime(true)}
                className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${customTime ? 'bg-accent/20 border-accent/40 text-accent-light' : 'bg-base-800 border-base-600 text-base-300 hover:border-base-400'}`}>
                Custom
              </button>
              {customTime && (
                <input type="number" min="1" className="input w-20 text-xs" placeholder="min"
                  value={form.estimatedMinutes} onChange={(e) => setForm({ ...form, estimatedMinutes: parseInt(e.target.value) || 0 })} />
              )}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-base-300 uppercase tracking-wider font-semibold mb-1 block">Category</label>
            <input className="input text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Frontend, Backend, Design" />
          </div>
          <div>
            <label className="text-[11px] text-base-300 uppercase tracking-wider font-semibold mb-1 block">Notes</label>
            <textarea className="input text-sm" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional details..." />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5 text-center disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MyTasks;
