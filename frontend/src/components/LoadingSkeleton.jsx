const LoadingSkeleton = ({ type = 'card', count = 1 }) => {
  const items = Array.from({ length: count });

  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
            <div className="skeleton h-20 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'stat') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {items.map((_, i) => (
          <div key={i} className="stat-card space-y-3">
            <div className="skeleton h-10 w-10 rounded-xl" />
            <div className="skeleton h-6 w-16" />
            <div className="skeleton h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="glass-card p-4 space-y-3">
        <div className="skeleton h-10 w-full" />
        {items.map((_, i) => (
          <div key={i} className="skeleton h-12 w-full" />
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return <div className="glass-card p-5"><div className="skeleton h-64 w-full" /></div>;
  }

  return <div className="skeleton h-8 w-full" />;
};

export default LoadingSkeleton;
