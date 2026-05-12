import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { projectsApi } from '../../api/modules';
import { StatusBadge } from '../../components/Badges';
import Modal from '../../components/Modal';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', startDate: '', deadline: '' });
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const res = await projectsApi.getAll({ search, limit: 50 });
      setProjects(res.data.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await projectsApi.create(form);
      toast.success('Project created');
      setShowModal(false);
      setForm({ name: '', description: '', startDate: '', deadline: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <LoadingSkeleton type="card" count={6} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" placeholder="Search projects..." />
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} />New Project</button>
      </div>

      {projects.length === 0 ? (
        <EmptyState title="No projects yet" description="Create your first project to get started" action={<button onClick={() => setShowModal(true)} className="btn-primary">Create Project</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="glass-card p-5 cursor-pointer hover:border-accent/30 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-white group-hover:text-cream transition-colors">{p.name}</h3>
                <StatusBadge status={p.status} />
              </div>
              {p.description && <p className="text-xs text-base-300 mb-4 line-clamp-2">{p.description}</p>}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-base-300">
                  <span>{p.taskStats?.done || 0}/{p.taskStats?.total || 0} tasks</span>
                  <span>{p.progress}%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${p.progress}%` }} /></div>
              </div>
              <div className="flex items-center justify-between mt-4 text-xs text-base-400">
                <span>{p._count?.members || 0} members</span>
                {p.deadline && <span>Due: {new Date(p.deadline).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="block text-sm text-base-200 mb-1">Name *</label><input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input" required /></div>
          <div><label className="block text-sm text-base-200 mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="input" rows={3} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-base-200 mb-1">Start Date</label><input type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} className="input" /></div>
            <div><label className="block text-sm text-base-200 mb-1">Deadline</label><input type="date" value={form.deadline} onChange={(e) => setForm({...form, deadline: e.target.value})} className="input" /></div>
          </div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Create</button></div>
        </form>
      </Modal>
    </div>
  );
};

export default Projects;
