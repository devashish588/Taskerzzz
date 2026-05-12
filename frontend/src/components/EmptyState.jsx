import { Inbox } from 'lucide-react';

const EmptyState = ({ title = 'No data found', description = 'There is nothing to show here yet.', icon: Icon = Inbox, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-base-800 border border-base-600 flex items-center justify-center mb-4">
        <Icon size={32} className="text-base-400" />
      </div>
      <h3 className="text-lg font-bold text-white font-heading mb-1">{title}</h3>
      <p className="text-sm text-base-300 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
