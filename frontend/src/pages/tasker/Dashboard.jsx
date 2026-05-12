import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertTriangle, SkipForward, Flag, Target, TrendingUp, Timer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { usersApi, tasksApi } from '../../api/modules';
import useAuthStore from '../../store/authStore';
import LoadingSkeleton from '../../components/LoadingSkeleton';

const TaskerDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          usersApi.getStats(user.id),
          tasksApi.getAll({ limit: 100 }),
        ]);
        setStats(statsRes.data.stats);
        setTasks(tasksRes.data.data);
      } catch {}
      setLoading(false);
    };
    load();
  }, [user.id]);

  if (loading) return <LoadingSkeleton type="card" count={6} />;

  const s = stats || {};
  const remaining = s.dailyTarget - (s.todayCompleted || 0);
  const productivity = s.dailyTarget > 0 ? Math.round(((s.todayCompleted || 0) / s.dailyTarget) * 100) : 0;

  // Status distribution for chart
  const statusData = [
    { name: 'Assigned', value: s.assigned || 0, color: '#4d8da6' },
    { name: 'In Progress', value: s.inProgress || 0, color: '#006A67' },
    { name: 'In Review', value: s.inReview || 0, color: '#FFF4B7' },
    { name: 'Completed', value: s.completed || 0, color: '#2dd4a8' },
    { name: 'Flagged', value: s.flagged || 0, color: '#ff8c42' },
    { name: 'Skipped', value: s.skipped || 0, color: '#80a0b4' },
  ];

  // Recent tasks
  const recentTasks = tasks.slice(0, 8);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white font-heading">Welcome, {user?.name?.split(' ')[0]}</h2>
          <p className="text-xs text-base-300 mt-0.5">Daily target: {s.dailyTarget} tasks</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-accent/15 text-accent-light border border-accent/20 font-mono">
            {productivity}% productivity
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatMini icon={Target} label="Daily Target" value={s.dailyTarget} color="text-cream" bg="bg-cream/10" />
        <StatMini icon={CheckCircle} label="Completed" value={s.todayCompleted || 0} color="text-success" bg="bg-success/10" />
        <StatMini icon={Clock} label="Remaining" value={Math.max(0, remaining)} color="text-accent-light" bg="bg-accent/10" />
        <StatMini icon={AlertTriangle} label="Overdue" value={s.overdue || 0} color="text-danger" bg="bg-danger/10" />
        <StatMini icon={Flag} label="Flagged" value={s.flagged || 0} color="text-orange" bg="bg-orange/10" />
        <StatMini icon={SkipForward} label="Skipped" value={s.skipped || 0} color="text-base-300" bg="bg-base-700/50" />
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Productivity progress */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-base-200 uppercase tracking-wider">Daily Progress</span>
            <span className="text-lg font-bold text-white font-mono">{productivity}%</span>
          </div>
          <div className="w-full h-2 bg-base-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, productivity)}%`, background: productivity >= 100 ? '#2dd4a8' : productivity >= 50 ? '#006A67' : '#f0506e' }} />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-base-400">
            <span>{s.todayCompleted || 0} done</span>
            <span>{s.dailyTarget} target</span>
          </div>
        </div>

        {/* Quality score */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-base-200 uppercase tracking-wider">Quality Score</span>
            <TrendingUp size={14} className="text-base-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{s.avgQuality || 0}<span className="text-sm text-base-400">%</span></div>
          <p className="text-[10px] text-base-400 mt-1">Avg. across completed tasks</p>
        </div>

        {/* Time efficiency */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-base-200 uppercase tracking-wider">Time Efficiency</span>
            <Timer size={14} className="text-base-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{s.avgTimeScore || 0}<span className="text-sm text-base-400">%</span></div>
          <p className="text-[10px] text-base-400 mt-1">Avg. time vs estimated</p>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Status distribution */}
        <div className="glass-card p-4">
          <h3 className="text-xs font-semibold text-base-200 uppercase tracking-wider mb-3">Task Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={statusData} barSize={24}>
              <XAxis dataKey="name" tick={{ fill: '#4d8da6', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: '#001245', border: '1px solid #003161', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent tasks */}
        <div className="glass-card p-4">
          <h3 className="text-xs font-semibold text-base-200 uppercase tracking-wider mb-3">Recent Tasks</h3>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
            {recentTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-base-700/40 transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(t.status)}`} />
                <span className="text-xs text-white truncate flex-1">{t.title}</span>
                <span className="text-[10px] text-base-400 font-mono shrink-0">{t.estimatedMinutes ? `${t.estimatedMinutes}m` : ''}</span>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${priorityStyle(t.priority)}`}>{t.priority?.charAt(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatMini = ({ icon: Icon, label, value, color, bg }) => (
  <div className={`${bg} rounded-lg p-3 border border-base-700/40`}>
    <div className="flex items-center gap-2 mb-1">
      <Icon size={13} className={color} />
      <span className="text-[10px] text-base-300 uppercase tracking-wider">{label}</span>
    </div>
    <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
  </div>
);

const statusDot = (s) => ({ ASSIGNED: 'bg-base-400', IN_PROGRESS: 'bg-accent', IN_REVIEW: 'bg-warning', COMPLETED: 'bg-success', FLAGGED: 'bg-orange', SKIPPED: 'bg-base-500' }[s] || 'bg-base-500');
const priorityStyle = (p) => ({ CRITICAL: 'bg-danger/20 text-danger', HIGH: 'bg-orange/20 text-orange', MEDIUM: 'bg-cream/10 text-cream-dim', LOW: 'bg-base-700/50 text-base-300' }[p] || '');

export default TaskerDashboard;
