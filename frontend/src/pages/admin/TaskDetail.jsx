import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Trash2, Clock, Flag, CheckCircle, Timer } from 'lucide-react';
import { tasksApi, commentsApi } from '../../api/modules';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const ADMIN_STATUSES = ['ASSIGNED', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'FLAGGED', 'SKIPPED'];
const TASKER_STATUSES = ['IN_PROGRESS', 'SKIPPED'];

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const load = useCallback(async () => {
    try { const res = await tasksApi.getById(id); setTask(res.data.task); } catch { navigate(-1); }
    setLoading(false);
  }, [id, navigate]);
  useEffect(() => { load(); }, [load]);

  const updateStatus = async (status) => {
    try { await tasksApi.update(id, { status }); toast.success('Status updated'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleSubmitForReview = async () => {
    try { await tasksApi.submitForReview(id); toast.success('Submitted for review'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Cannot submit'); }
  };

  const handleReview = async (action, data = {}) => {
    try {
      await tasksApi.review(id, { action, ...data });
      toast.success(action === 'approve' ? 'Task approved' : 'Task flagged');
      setShowReview(false);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try { await commentsApi.create(id, comment); setComment(''); load(); } catch { toast.error('Failed'); }
    setSubmitting(false);
  };

  const deleteComment = async (cId) => {
    try { await commentsApi.delete(cId); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  if (loading) return <LoadingSkeleton type="card" count={2} />;
  if (!task) return null;

  const statuses = isAdmin ? ADMIN_STATUSES : TASKER_STATUSES;

  return (
    <div className="space-y-4 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-base-300 hover:text-cream"><ArrowLeft size={14}/>Back</button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-lg font-bold text-white font-heading">{task.title}</h2>
              <PriorityBadge priority={task.priority} />
            </div>
            {task.description && <p className="text-sm text-base-300 whitespace-pre-wrap mb-3">{task.description}</p>}

            {/* Time tracking */}
            <div className="flex flex-wrap gap-3 mt-3">
              {task.estimatedMinutes && (
                <div className="flex items-center gap-1.5 text-xs text-base-300">
                  <Timer size={12} className="text-accent-light" />
                  Est: <span className="font-mono text-white">{task.estimatedMinutes}m</span>
                </div>
              )}
              {task.actualMinutes && (
                <div className="flex items-center gap-1.5 text-xs text-base-300">
                  <Clock size={12} className="text-success" />
                  Actual: <span className="font-mono text-white">{task.actualMinutes}m</span>
                </div>
              )}
              {task.category && <span className="text-xs text-base-400 bg-base-700/40 px-2 py-0.5 rounded">{task.category}</span>}
            </div>

            {/* Flag warning */}
            {task.status === 'FLAGGED' && task.flagReason && (
              <div className="mt-3 p-3 rounded-lg bg-orange/10 border border-orange/20">
                <p className="text-xs font-semibold text-orange mb-1">Flagged — Revision Required</p>
                <p className="text-xs text-orange/80">{task.flagReason}</p>
                {task.revisionCount > 0 && <p className="text-[10px] text-base-400 mt-1">Revision #{task.revisionCount}</p>}
              </div>
            )}

            {/* Review note */}
            {task.reviewNote && (
              <div className="mt-3 p-3 rounded-lg bg-base-800/50 border border-base-700/40">
                <p className="text-xs font-semibold text-base-200 mb-1">Admin Review Note</p>
                <p className="text-xs text-base-300">{task.reviewNote}</p>
              </div>
            )}

            {/* Scores */}
            {(task.qualityScore != null || task.timeScore != null) && (
              <div className="flex gap-3 mt-3">
                {task.qualityScore != null && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-base-400">Quality:</span>
                    <span className={`font-mono font-bold ${task.qualityScore >= 70 ? 'text-success' : task.qualityScore >= 40 ? 'text-warning' : 'text-danger'}`}>{task.qualityScore}%</span>
                  </div>
                )}
                {task.timeScore != null && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-base-400">Time Efficiency:</span>
                    <span className={`font-mono font-bold ${task.timeScore >= 70 ? 'text-success' : task.timeScore >= 40 ? 'text-warning' : 'text-danger'}`}>{task.timeScore}%</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tasker actions */}
          {!isAdmin && ['IN_PROGRESS', 'FLAGGED'].includes(task.status) && (
            <button onClick={handleSubmitForReview} className="btn-primary flex items-center gap-1.5 text-xs w-full justify-center py-2.5">
              <Send size={14} /> Submit for Review
            </button>
          )}

          {/* Admin review actions */}
          {isAdmin && task.status === 'IN_REVIEW' && (
            <div className="flex gap-2">
              <button onClick={() => handleReview('approve', { qualityScore: 85, timeScore: 80 })}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-success/15 text-success border border-success/30 hover:bg-success/25 flex items-center justify-center gap-1.5">
                <CheckCircle size={14} /> Quick Approve
              </button>
              <button onClick={() => setShowReview(true)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-warning/15 text-warning border border-warning/30 hover:bg-warning/25 flex items-center justify-center gap-1.5">
                Detailed Review
              </button>
            </div>
          )}

          {/* Comments */}
          <div className="glass-card p-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Comments ({task.comments?.length || 0})</h3>
            <form onSubmit={addComment} className="flex gap-2 mb-3">
              <input value={comment} onChange={(e) => setComment(e.target.value)} className="input flex-1 text-sm" placeholder="Add a comment..." />
              <button type="submit" disabled={submitting} className="btn-primary px-3"><Send size={14}/></button>
            </form>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {task.comments?.map((c) => (
                <div key={c.id} className="flex gap-2 p-2 rounded-lg bg-base-800/40">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-purple flex items-center justify-center text-[8px] font-bold text-white shrink-0">{c.user.name?.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white">{c.user.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-base-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                        {(isAdmin || c.userId === user.id) && <button onClick={() => deleteComment(c.id)} className="text-base-500 hover:text-danger"><Trash2 size={10}/></button>}
                      </div>
                    </div>
                    <p className="text-xs text-base-200 mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))}
              {(!task.comments || task.comments.length === 0) && <p className="text-center text-base-500 text-xs py-3">No comments yet</p>}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          <div className="glass-card p-4 space-y-3">
            <div><p className="text-[10px] text-base-400 uppercase tracking-wider mb-1.5">Status</p>
              <div className="flex flex-wrap gap-1">
                {statuses.map((s) => (
                  <button key={s} onClick={() => updateStatus(s)} className={`text-[10px] px-2 py-1 rounded-md transition-all ${task.status === s ? 'bg-accent/20 text-cream border border-accent/30' : 'bg-base-700/50 text-base-300 hover:bg-base-600/50 border border-transparent'}`}>{s.replace('_',' ')}</button>
                ))}
              </div>
            </div>
            <div><p className="text-[10px] text-base-400 uppercase tracking-wider">Project</p><p className="text-xs text-white mt-0.5">{task.project?.name}</p></div>
            <div><p className="text-[10px] text-base-400 uppercase tracking-wider">Assigned To</p><p className="text-xs text-white mt-0.5">{task.assignedTo?.name || 'Unassigned'}</p></div>
            <div><p className="text-[10px] text-base-400 uppercase tracking-wider">Due Date</p><p className="text-xs text-white font-mono mt-0.5">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</p></div>
            {task.completedAt && <div><p className="text-[10px] text-base-400 uppercase tracking-wider">Completed</p><p className="text-xs text-success font-mono mt-0.5">{new Date(task.completedAt).toLocaleDateString()}</p></div>}
            {task.submittedAt && <div><p className="text-[10px] text-base-400 uppercase tracking-wider">Submitted</p><p className="text-xs text-warning font-mono mt-0.5">{new Date(task.submittedAt).toLocaleDateString()}</p></div>}
          </div>

          {/* Status History */}
          {task.statusHistory?.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5"><Clock size={12}/>History</h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {task.statusHistory.slice(0, 15).map((h) => (
                  <div key={h.id} className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-base-500 font-mono">{new Date(h.changedAt).toLocaleDateString()}</span>
                    <span className="text-base-600">→</span>
                    <StatusBadge status={h.toStatus} />
                    <span className="text-base-500 truncate">{h.changedBy?.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Review Modal */}
      {showReview && <ReviewModal task={task} onClose={() => setShowReview(false)} onReview={handleReview} />}
    </div>
  );
};

const ReviewModal = ({ task, onClose, onReview }) => {
  const [action, setAction] = useState('approve');
  const [feedback, setFeedback] = useState('');
  const [quality, setQuality] = useState(80);
  const [timeEff, setTimeEff] = useState(80);
  const [flagReason, setFlagReason] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-white font-heading mb-3">Review: {task.title}</h3>
        <div className="flex gap-2 mb-3">
          <button onClick={() => setAction('approve')} className={`flex-1 py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 ${action === 'approve' ? 'bg-success/15 border-success/30 text-success' : 'bg-base-800 border-base-600 text-base-300'}`}>
            <CheckCircle size={13} /> Approve
          </button>
          <button onClick={() => setAction('flag')} className={`flex-1 py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 ${action === 'flag' ? 'bg-orange/15 border-orange/30 text-orange' : 'bg-base-800 border-base-600 text-base-300'}`}>
            <Flag size={13} /> Flag
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><label className="text-[10px] text-base-300 uppercase tracking-wider mb-1 block">Quality (%)</label><input type="number" min="0" max="100" value={quality} onChange={(e) => setQuality(e.target.value)} className="input text-sm" /></div>
          <div><label className="text-[10px] text-base-300 uppercase tracking-wider mb-1 block">Time Efficiency (%)</label><input type="number" min="0" max="100" value={timeEff} onChange={(e) => setTimeEff(e.target.value)} className="input text-sm" /></div>
        </div>
        <div className="mb-3"><label className="text-[10px] text-base-300 uppercase tracking-wider mb-1 block">Feedback</label><textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} className="input text-sm" rows={2} placeholder="Review notes..." /></div>
        {action === 'flag' && <div className="mb-3"><label className="text-[10px] text-orange uppercase tracking-wider mb-1 block">Rejection Reason *</label><textarea value={flagReason} onChange={(e) => setFlagReason(e.target.value)} className="input text-sm border-orange/30" rows={2} required /></div>}
        <button onClick={() => onReview(action, { reviewNote: feedback, qualityScore: parseInt(quality), timeScore: parseInt(timeEff), flagReason: action === 'flag' ? flagReason : null })}
          disabled={action === 'flag' && !flagReason}
          className={`w-full py-2 rounded-lg text-sm font-semibold disabled:opacity-50 ${action === 'approve' ? 'bg-success/20 text-success border border-success/30' : 'bg-orange/20 text-orange border border-orange/30'}`}>
          {action === 'approve' ? 'Approve' : 'Flag Task'}
        </button>
      </div>
    </div>
  );
};

export default TaskDetail;
