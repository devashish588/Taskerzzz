const StatsCard = ({ icon: Icon, label, value, color = 'cyan', trend }) => {
  const colors = {
    cyan: 'from-accent/20 to-accent/5 text-cream border-accent/20',
    orange: 'from-orange/20 to-orange/5 text-orange border-orange/20',
    success: 'from-success/20 to-success/5 text-success border-success/20',
    danger: 'from-danger/20 to-danger/5 text-danger border-danger/20',
    warning: 'from-warning/20 to-warning/5 text-warning border-warning/20',
    purple: 'from-purple/20 to-purple/5 text-purple border-purple/20',
  };

  return (
    <div className={`stat-card bg-gradient-to-br ${colors[color]} border`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
          {Icon && <Icon size={20} />}
        </div>
        {trend && <span className="text-xs font-mono text-base-300">{trend}</span>}
      </div>
      <p className="text-2xl font-bold text-white font-heading">{value}</p>
      <p className="text-xs text-base-300 mt-1">{label}</p>
    </div>
  );
};

export default StatsCard;
