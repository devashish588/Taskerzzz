import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, UserPlus, Trash2 } from 'lucide-react';
import { projectsApi, usersApi } from '../../api/modules';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import Modal from '../../components/Modal';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  const load = async () => {
    try {
      const res = await projectsApi.getById(id);
      setProject(res.data.project);
    } catch { navigate('/projects'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const loadUsers = async () => {
    try { const res = await usersApi.getAll({ limit: 100, role: 'TASKER' }); setAllUsers(res.data.data); } catch {}
    setShowAddMember(true);
  };

  const addMember = async (userId) => {
    try { await projectsApi.addMember(id, userId); toast.success('Member added'); setShowAddMember(false); load(); } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try { await projectsApi.removeMember(id, userId); toast.success('Member removed'); load(); } catch (err) { toast.error('Failed'); }
  };

  if (loading) return <LoadingSkeleton type="card" count={3} />;
  if (!project) return null;

  const memberIds = project.members?.map((m) => m.userId) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-sm text-base-300 hover:text-cream"><ArrowLeft size={16} />Back to Projects</button>

      <div className="glass-card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white font-heading">{project.name}</h2>
            {project.description && <p className="text-sm text-base-300 mt-1">{project.description}</p>}
          </div>
          <StatusBadge status={project.status} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div><p className="text-xs text-base-400">Progress</p><div className="flex items-center gap-2 mt-1"><div className="progress-bar flex-1"><div className="progress-fill" style={{width:`${project.progress}%`}}/></div><span className="text-sm font-mono text-white">{project.progress}%</span></div></div>
          <div><p className="text-xs text-base-400">Tasks</p><p className="text-sm text-white font-mono mt-1">{project.taskStats?.done}/{project.taskStats?.total}</p></div>
          <div><p className="text-xs text-base-400">Members</p><p className="text-sm text-white font-mono mt-1">{project.members?.length || 0}</p></div>
          <div><p className="text-xs text-base-400">Deadline</p><p className="text-sm text-white font-mono mt-1">{project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white font-heading">Members</h3>
            {isAdmin && <button onClick={loadUsers} className="btn-secondary text-xs py-1 px-3 flex items-center gap-1"><UserPlus size={14}/>Add</button>}
          </div>
          <div className="space-y-2">
            {project.members?.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-base-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-purple flex items-center justify-center text-[10px] font-bold text-white">{m.user.name?.charAt(0)}</div>
                  <div><p className="text-sm text-white">{m.user.name}</p><p className="text-xs text-base-400">{m.user.email}</p></div>
                </div>
                {isAdmin && <button onClick={() => removeMember(m.userId)} className="text-base-400 hover:text-danger"><Trash2 size={14}/></button>}
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white font-heading">Tasks</h3>
            {isAdmin && <button onClick={() => navigate('/tasks?projectId=' + id)} className="btn-secondary text-xs py-1 px-3 flex items-center gap-1"><Plus size={14}/>View All</button>}
          </div>
          <div className="space-y-2">
            {project.tasks?.length === 0 && <p className="text-center text-base-400 py-8 text-sm">No tasks yet</p>}
            {project.tasks?.slice(0, 10).map((t) => (
              <div key={t.id} onClick={() => navigate(`/tasks/${t.id}`)} className="flex items-center justify-between p-3 rounded-lg hover:bg-base-700/50 cursor-pointer">
                <div className="flex items-center gap-3 flex-1">
                  <PriorityBadge priority={t.priority} />
                  <span className="text-sm text-white">{t.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {t.assignedTo && <span className="text-xs text-base-300">{t.assignedTo.name}</span>}
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Member">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {allUsers.filter((u) => !memberIds.includes(u.id)).map((u) => (
            <div key={u.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-base-700/50 cursor-pointer" onClick={() => addMember(u.id)}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-purple flex items-center justify-center text-[10px] font-bold text-white">{u.name?.charAt(0)}</div>
                <div><p className="text-sm text-white">{u.name}</p><p className="text-xs text-base-400">{u.email}</p></div>
              </div>
              <Plus size={16} className="text-cream" />
            </div>
          ))}
          {allUsers.filter((u) => !memberIds.includes(u.id)).length === 0 && <p className="text-center text-base-400 py-4 text-sm">All taskers already added</p>}
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDetail;
