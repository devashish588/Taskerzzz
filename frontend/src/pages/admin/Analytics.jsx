import { useState, useEffect } from 'react';
import { FolderKanban, Users, CheckSquare, CheckCircle2, AlertTriangle, Flag, SkipForward, FileCheck } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, AreaChart, Area } from 'recharts';
import { analyticsApi } from '../../api/modules';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import Modal from '../../components/Modal';

const STATUS_COLORS = { ASSIGNED: '#4d8da6', IN_PROGRESS: '#006A67', IN_REVIEW: '#FFF4B7', COMPLETED: '#2dd4a8', FLAGGED: '#ff8c42', SKIPPED: '#80a0b4' };
const PRIORITY_COLORS = { CRITICAL: '#f0506e', HIGH: '#ff8c42', MEDIUM: '#FFF4B7', LOW: '#2dd4a8' };

const ChartTooltip = ({ active, payload, label, suffix = 'tasks' }) => {
  if (!active || !payload?.length) return null;
  return <div className="glass-card px-3 py-2 text-xs"><p className="text-base-300 font-mono">{label}</p><p className="text-white font-bold">{payload[0].value} {suffix}</p></div>;
};

const Analytics = () => {
  const [overview, setOverview] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [projectData, setProjectData] = useState([]);
  const [taskerPerf, setTaskerPerf] = useState([]);
  const [reviewMetrics, setReviewMetrics] = useState(null);
  const [selectedTasker, setSelectedTasker] = useState(null);
  const [taskerTimeline, setTaskerTimeline] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, tl, st, pr, pj, tp, rm] = await Promise.all([
          analyticsApi.getOverview(), analyticsApi.getTasksOverTime(30),
          analyticsApi.getByStatus(), analyticsApi.getByPriority(),
          analyticsApi.getByProject(), analyticsApi.getTaskerPerformance(),
          analyticsApi.getReviewMetrics(),
        ]);
        setOverview(ov.data); setTimeline(tl.data.data); setStatusData(st.data.data);
        setPriorityData(pr.data.data); setProjectData(pj.data.data); setTaskerPerf(tp.data.data);
        setReviewMetrics(rm.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    load();
  }, []);

  const openTaskerDrillDown = async (tasker) => {
    setSelectedTasker(tasker);
    try {
      const res = await analyticsApi.getTaskerTimeline(tasker.id, 30);
      setTaskerTimeline(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="space-y-4"><LoadingSkeleton type="stat" count={8} /><LoadingSkeleton type="chart" /><LoadingSkeleton type="chart" /></div>;

  const o = overview || {};
  const rm = reviewMetrics || {};

  return (
    <div className="space-y-4 animate-fade-in">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        <KPI icon={FolderKanban} label="Projects" value={o.totalProjects || 0} color="text-accent-light" />
        <KPI icon={Users} label="Taskers" value={o.totalTaskers || 0} color="text-purple" />
        <KPI icon={CheckSquare} label="Tasks" value={o.totalTasks || 0} color="text-cream" />
        <KPI icon={CheckCircle2} label="Completed" value={o.completed || 0} color="text-success" />
        <KPI icon={FileCheck} label="In Review" value={o.inReview || 0} color="text-warning" />
        <KPI icon={Flag} label="Flagged" value={o.flagged || 0} color="text-orange" />
        <KPI icon={AlertTriangle} label="Overdue" value={o.overdue || 0} color="text-danger" />
        <KPI icon={SkipForward} label="Skipped" value={o.skipped || 0} color="text-base-300" />
      </div>

      {/* Review metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <MetricBox label="Approval Rate" value={`${rm.approvalRate || 0}%`} />
        <MetricBox label="Pending Review" value={rm.inReview || 0} />
        <MetricBox label="Total Reviewed" value={rm.totalReviewed || 0} />
        <MetricBox label="Flagged" value={rm.flaggedCount || 0} accent />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h3 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3">Completion Trend (30d)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeline}>
              <defs><linearGradient id="gradComp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#006A67" stopOpacity={0.3}/><stop offset="95%" stopColor="#006A67" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#0a1a40" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#4d6880' }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 9, fill: '#4d6880' }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#006A67" strokeWidth={2} fill="url(#gradComp)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="count" nameKey="status">
                {statusData.map((e, i) => <Cell key={i} fill={STATUS_COLORS[e.status]} />)}
              </Pie>
              <Tooltip content={({ active, payload }) => active && payload?.length ? <div className="glass-card px-3 py-2 text-xs"><p className="text-white font-bold">{payload[0].name.replace('_',' ')}: {payload[0].value}</p></div> : null} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center">
            {statusData.map((s, i) => <div key={i} className="flex items-center gap-1 text-[9px]"><div className="w-2 h-2 rounded-full" style={{background: STATUS_COLORS[s.status]}}/><span className="text-base-300">{s.status.replace('_',' ')}: {s.count}</span></div>)}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h3 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3">Priority Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0a1a40" />
              <XAxis dataKey="priority" tick={{ fontSize: 10, fill: '#80a0b4' }} />
              <YAxis tick={{ fontSize: 9, fill: '#4d6880' }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>{priorityData.map((e, i) => <Cell key={i} fill={PRIORITY_COLORS[e.priority]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3">Project Progress</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={projectData} layout="vertical" margin={{ left: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0a1a40" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: '#4d6880' }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#80a0b4' }} width={70} />
              <Tooltip content={({ active, payload }) => active && payload?.length ? <div className="glass-card px-3 py-2 text-xs"><p className="text-white font-bold">{payload[0].payload.name}</p><p className="text-base-300">{payload[0].payload.done}/{payload[0].payload.total}</p></div> : null} />
              <Bar dataKey="percentage" radius={[0, 4, 4, 0]} fill="#006A67" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tasker Performance */}
      <div className="glass-card p-4">
        <h3 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3">Tasker Performance</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Tasker</th><th>Total</th><th>Completed</th><th>Flagged</th><th>Overdue</th><th>Approval</th><th>Quality</th><th>Time</th><th></th></tr></thead>
            <tbody>
              {taskerPerf.map((t) => (
                <tr key={t.id} className="cursor-pointer" onClick={() => openTaskerDrillDown(t)}>
                  <td><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-purple flex items-center justify-center text-[9px] font-bold text-white">{t.name?.charAt(0)}</div><span className="text-white font-medium text-xs">{t.name}</span></div></td>
                  <td className="font-mono text-xs">{t.total}</td>
                  <td className="font-mono text-xs text-success">{t.completed}</td>
                  <td className="font-mono text-xs text-orange">{t.flagged}</td>
                  <td className="font-mono text-xs text-danger">{t.overdue}</td>
                  <td><div className="flex items-center gap-1"><div className="progress-bar flex-1 max-w-[60px]"><div className="progress-fill" style={{ width: `${t.approvalRate || 0}%` }} /></div><span className="font-mono text-[10px] text-base-200">{t.approvalRate ?? '—'}%</span></div></td>
                  <td className="font-mono text-[10px]">{t.avgQuality != null ? `${t.avgQuality}%` : '—'}</td>
                  <td className="font-mono text-[10px]">{t.avgTimeScore != null ? `${t.avgTimeScore}%` : '—'}</td>
                  <td><span className="text-[10px] text-cream hover:underline cursor-pointer">Details</span></td>
                </tr>
              ))}
              {taskerPerf.length === 0 && <tr><td colSpan={9} className="text-center text-base-400 py-6">No taskers yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Most flagged */}
      {rm.mostFlagged?.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3">Most Flagged Taskers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {rm.mostFlagged.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-base-800/40 border border-base-700/30">
                <span className="text-xs font-mono text-base-400 w-4">{i + 1}</span>
                <span className="text-xs text-white flex-1">{t.name}</span>
                <span className={`text-xs font-mono font-bold ${t.flaggedCount > 0 ? 'text-orange' : 'text-success'}`}>{t.flaggedCount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasker Drill-Down */}
      <Modal isOpen={!!selectedTasker} onClose={() => { setSelectedTasker(null); setTaskerTimeline(null); }} title={`${selectedTasker?.name}'s Performance`} size="lg">
        {selectedTasker && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              <div className="stat-card text-center"><p className="text-lg font-bold text-white font-mono">{selectedTasker.total}</p><p className="text-[10px] text-base-300">Total</p></div>
              <div className="stat-card text-center"><p className="text-lg font-bold text-success font-mono">{selectedTasker.completed}</p><p className="text-[10px] text-base-300">Done</p></div>
              <div className="stat-card text-center"><p className="text-lg font-bold text-orange font-mono">{selectedTasker.flagged}</p><p className="text-[10px] text-base-300">Flagged</p></div>
              <div className="stat-card text-center"><p className="text-lg font-bold text-danger font-mono">{selectedTasker.overdue}</p><p className="text-[10px] text-base-300">Overdue</p></div>
            </div>
            {taskerTimeline && (
              <div className="glass-card p-3">
                <h4 className="text-[10px] font-bold text-white uppercase tracking-wider mb-2">Completion (30d)</h4>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={taskerTimeline.timeline}>
                    <defs><linearGradient id="gradTasker" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2dd4a8" stopOpacity={0.3}/><stop offset="95%" stopColor="#2dd4a8" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0a1a40" />
                    <XAxis dataKey="date" tick={{ fontSize: 8, fill: '#4d6880' }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 8, fill: '#4d6880' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="count" stroke="#2dd4a8" strokeWidth={2} fill="url(#gradTasker)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

const KPI = ({ icon: Icon, label, value, color }) => (
  <div className="glass-card p-2.5">
    <div className="flex items-center gap-1 mb-0.5"><Icon size={12} className={color} /><span className="text-[8px] text-base-400 uppercase tracking-wider">{label}</span></div>
    <p className={`text-base font-bold font-mono ${color}`}>{value}</p>
  </div>
);

const MetricBox = ({ label, value, accent }) => (
  <div className={`glass-card p-2.5 ${accent ? 'border-orange/20' : ''}`}>
    <p className="text-[9px] text-base-300 uppercase tracking-wider mb-0.5">{label}</p>
    <p className={`text-base font-bold font-mono ${accent ? 'text-orange' : 'text-white'}`}>{value}</p>
  </div>
);

export default Analytics;
