import useAuthStore from '../../store/authStore';
import { useState } from 'react';
import { usersApi } from '../../api/modules';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const data = { name };
      if (password) data.password = password;
      const res = await usersApi.update(user.id, data);
      setUser(res.data.user);
      setPassword('');
      toast.success('Profile updated');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="max-w-xl space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white font-heading mb-4">Profile Settings</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="block text-sm text-base-200 mb-1">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="input" /></div>
          <div><label className="block text-sm text-base-200 mb-1">Email</label><input value={user?.email} className="input opacity-50" disabled /></div>
          <div><label className="block text-sm text-base-200 mb-1">New Password (leave blank to keep)</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" /></div>
          <button type="submit" className="btn-primary">Save Changes</button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
