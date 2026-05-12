import { useState, useEffect } from 'react';
import { FolderKanban, Users, CheckSquare, CheckCircle2, AlertTriangle, Flag, SkipForward, FileCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid } from 'recharts';
import { analyticsApi } from '../../api/modules';
import LoadingSkeleton from '../../components/LoadingSkeleton';

const COLORS = { ASSIGNED: '#4d8da6', IN_PROGRESS: '#006A67', IN_REVIEW: '#FFF4B7', COMPLETED: '#2dd4a8', FLAGGED: '#ff8c42', SKIPPED: '#80a0b4' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="text-base-300 font-mono">{label}</p>
      <p className="text-white font-bold">{payload[0].value} tasks</p>
    </div>
  );
};

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [projectData, setProjectData] = useState([]);
  const [reviewMetrics, setReviewMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, tl, st, pj, rm] = await Promise.all([
          analyticsApi.getOverview(),
          analyticsApi.getTasksOverTime(30),
          analyticsApi.getByStatus(),
          analyticsApi.getByProject(),
          analyticsApi.getReviewMetrics(),
        ]);
        setOverview(ov.data);
        setTimeline(tl.data.data);
        setStatusData(st.data.data);
        setProjectData(pj.data.data);
        setReviewMetrics(rm.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <div className="space-y-5">
      <LoadingSkeleton type="stat" count={8} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><LoadingSkeleton type="chart" /><LoadingSkeleton type="chart" /></div>
    </div>
  );

  const o = overview || {};
  const rm = reviewMetrics || {};

  return (
    <div className="space-y-4 animate-fade-in">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatMini icon={FolderKanban} label="Projects" value={o.totalProjects || 0} color="text-accent-light" />
        <StatMini icon={Users} label="Taskers" value={o.totalTaskers || 0} color="text-purple" />
        <StatMini icon={CheckSquare} label="Total Tasks" value={o.totalTasks || 0} color="text-cream" />
        <StatMini icon={CheckCircle2} label="Completed" value={o.completed || 0} color="text-success" />
        <StatMini icon={FileCheck} label="In Review" value={o.inReview || 0} color="text-warning" />
        <StatMini icon={Flag} label="Flagged" value={o.flagged || 0} color="text-orange" />
        <StatMini icon={AlertTriangle} label="Overdue" value={o.overdue || 0} color="text-danger" />
        <StatMini icon={SkipForward} label="Skipped" value={o.skipped || 0} color="text-base-300" />
      </div>

      {/* Review metrics bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Approval Rate" value={`${rm.approvalRate || 0}%`} sub={`${rm.approved || 0} approved`} />
        <MetricCard label="Pending Review" value={rm.inReview || 0} sub="tasks waiting" />
        <MetricCard label="Total Reviewed" value={rm.totalReviewed || 0} sub="all time" />
        <MetricCard label="Currently Flagged" value={rm.flaggedCount || 0} sub="need attention" accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Completion over time */}
        <div className="glass-card p-4">
          <h3 className="text-xs font-bold text-white font-heading uppercase tracking-wider mb-3">Completion Trend (30d)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#006A67" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#006A67" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#0a1a40" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#4d6880' }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 9, fill: '#4d6880' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#006A67" strokeWidth={2} fill="url(#colorComp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div className="glass-card p-4">
          <h3 className="text-xs font-bold text-white font-heading uppercase tracking-wider mb-3">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count" nameKey="status">
                {statusData.map((entry, i) => <Cell key={i} fill={COLORS[entry.status] || '#4d6880'} />)}
              </Pie>
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div className="glass-card px-3 py-2 text-xs"><p className="text-white font-bold">{payload[0].name}: {payload[0].value}</p></div>
              ) : null} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center">
            {statusData.map((s, i) => (
              <div key={i} className="flex items-center gap-1 text-[10px]">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[s.status] }} />
                <span className="text-base-300">{s.status.replace('_', ' ')}: {s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects progress + most flagged */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h3 className="text-xs font-bold text-white font-heading uppercase tracking-wider mb-3">Project Progress</h3>
          <ResponsiveContainer width="100%" height={Math.max(150, projectData.length * 40)}>
            <BarChart data={projectData} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0a1a40" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: '#4d6880' }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#80a0b4' }} width={80} />
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div className="glass-card px-3 py-2 text-xs">
                  <p className="text-white font-bold">{payload[0].payload.name}</p>
                  <p className="text-base-300">{payload[0].payload.done}/{payload[0].payload.total} ({payload[0].value}%)</p>
                </div>
              ) : null} />
              <Bar dataKey="percentage" radius={[0, 4, 4, 0]} fill="#006A67" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Most flagged taskers */}
        <div className="glass-card p-4">
          <h3 className="text-xs font-bold text-white font-heading uppercase tracking-wider mb-3">Most Flagged Taskers</h3>
          <div className="space-y-2">
            {(rm.mostFlagged || []).map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-base-800/40">
                <span className="text-xs font-mono text-base-400 w-4">{i + 1}</span>
                <span className="text-sm text-white flex-1">{t.name}</span>
                <span className={`text-xs font-mono font-bold ${t.flaggedCount > 0 ? 'text-orange' : 'text-success'}`}>{t.flaggedCount} flagged</span>
              </div>
            ))}
            {(!rm.mostFlagged || rm.mostFlagged.length === 0) && <p className="text-xs text-base-400">No flagged tasks yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatMini = ({ icon: Icon, label, value, color }) => (
  <div className="glass-card p-3">
    <div className="flex items-center gap-1.5 mb-1">
      <Icon size={13} className={color} />
      <span className="text-[9px] text-base-400 uppercase tracking-wider">{label}</span>
    </div>
    <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
  </div>
);

const MetricCard = ({ label, value, sub, accent }) => (
  <div className={`glass-card p-3 ${accent ? 'border-orange/20' : ''}`}>
    <p className="text-[10px] text-base-300 uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-lg font-bold font-mono ${accent ? 'text-orange' : 'text-white'}`}>{value}</p>
    <p className="text-[10px] text-base-500">{sub}</p>
  </div>
);

export default AdminDashboard;
