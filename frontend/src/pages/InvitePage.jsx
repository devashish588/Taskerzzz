import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Zap } from 'lucide-react';
import { authApi } from '../api/modules';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const InvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      const res = await authApi.acceptInvite({ token, name: data.name, password: data.password });
      setUser(res.data.user);
      toast.success('Welcome to Taskerzz!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired invite');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-950">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-success/5 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-success flex items-center justify-center shadow-lg">
              <Zap size={24} className="text-base-950" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white font-heading">Accept Invitation</h1>
          <p className="text-base-300 text-sm mt-2">Set up your account to get started</p>
        </div>
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-base-200 mb-1.5">Full Name</label>
              <input {...register('name', { required: 'Name is required' })} className="input" placeholder="Your name" />
              {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-base-200 mb-1.5">Password</label>
              <input {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })} className="input" placeholder="••••••••" type="password" />
              {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-center disabled:opacity-50">
              {isSubmitting ? 'Setting up...' : 'Join Taskerzz'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InvitePage;
