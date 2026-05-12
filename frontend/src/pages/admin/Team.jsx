import { useState, useEffect } from 'react';
import { UserPlus, Target } from 'lucide-react';
import { usersApi, authApi } from '../../api/modules';
import Modal from '../../components/Modal';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';

const Team = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [editingTarget, setEditingTarget] = useState(null);
  const [targetValue, setTargetValue] = useState(15);

  const load = async () => {
    try { const res = await usersApi.getAll({ limit: 100 }); setUsers(res.data.data); } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    try { await authApi.invite(email); toast.success(`Invite sent to ${email}`); setEmail(''); setShowInvite(false); } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const toggleActive = async (u) => {
    try {
      if (u.isActive) { await usersApi.delete(u.id); toast.success('User deactivated'); }
      else { await usersApi.update(u.id, { isActive: true }); toast.success('User activated'); }
      load();
    } catch { toast.error('Failed'); }
  };

  const handleSetTarget = async (userId) => {
    try {
      await usersApi.setDailyTarget(userId, targetValue);
      toast.success('Daily target updated');
      setEditingTarget(null);
      load();
    } catch { toast.error('Failed to update target'); }
  };

  if (loading) return <LoadingSkeleton type="table" count={5} />;

  const taskers = users.filter((u) => u.role === 'TASKER');
  const admins = users.filter((u) => u.role === 'ADMIN');

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white font-heading">Team ({users.length})</h2>
        <button onClick={() => setShowInvite(true)} className="btn-primary flex items-center gap-1.5 text-xs"><UserPlus size={14}/>Invite</button>
      </div>

      {taskers.length === 0 ? (
        <EmptyState title="No taskers" description="Invite taskers to get started" />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Daily Target</th><th>Joined</th><th></th></tr></thead>
            <tbody>
              {admins.map((u) => (
                <tr key={u.id}>
                  <td><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-purple flex items-center justify-center text-[9px] font-bold text-white">{u.name?.charAt(0)}</div><span className="text-white font-medium text-xs">{u.name}</span></div></td>
                  <td className="text-base-300 text-xs">{u.email}</td>
                  <td><span className="badge badge-critical">{u.role}</span></td>
                  <td><span className="badge badge-completed">Active</span></td>
                  <td className="text-xs text-base-400">—</td>
                  <td className="text-base-300 text-[10px] font-mono">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td></td>
                </tr>
              ))}
              {taskers.map((u) => (
                <tr key={u.id}>
                  <td><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-purple flex items-center justify-center text-[9px] font-bold text-white">{u.name?.charAt(0)}</div><span className="text-white font-medium text-xs">{u.name}</span></div></td>
                  <td className="text-base-300 text-xs">{u.email}</td>
                  <td><span className="badge badge-in-progress">{u.role}</span></td>
                  <td><span className={`badge ${u.isActive ? 'badge-completed' : 'badge-skipped'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    {editingTarget === u.id ? (
                      <div className="flex items-center gap-1">
                        <input type="number" min="1" max="50" value={targetValue} onChange={(e) => setTargetValue(parseInt(e.target.value) || 1)} className="input w-14 py-0.5 px-1.5 text-[10px]" />
                        <button onClick={() => handleSetTarget(u.id)} className="text-[10px] text-success font-semibold">Save</button>
                        <button onClick={() => setEditingTarget(null)} className="text-[10px] text-base-400">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingTarget(u.id); setTargetValue(u.dailyTarget || 15); }}
                        className="flex items-center gap-1 text-xs text-accent-light hover:text-accent font-mono">
                        <Target size={11} />{u.dailyTarget || 15}
                      </button>
                    )}
                  </td>
                  <td className="text-base-300 text-[10px] font-mono">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>{u.role !== 'ADMIN' && <button onClick={() => toggleActive(u)} className={`text-[10px] font-semibold ${u.isActive ? 'text-danger hover:text-danger-light' : 'text-success hover:text-success-light'}`}>{u.isActive ? 'Deactivate' : 'Activate'}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite Tasker">
        <form onSubmit={handleInvite} className="space-y-3">
          <div><label className="block text-[11px] text-base-300 uppercase tracking-wider font-semibold mb-1">Email Address</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input text-sm" placeholder="tasker@example.com" required /></div>
          <p className="text-[10px] text-base-400">An invitation link will be sent. In dev mode, the link prints to the server console.</p>
          <div className="flex gap-2 justify-end"><button type="button" onClick={() => setShowInvite(false)} className="btn-secondary text-xs">Cancel</button><button type="submit" className="btn-primary text-xs">Send Invite</button></div>
        </form>
      </Modal>
    </div>
  );
};

export default Team;
