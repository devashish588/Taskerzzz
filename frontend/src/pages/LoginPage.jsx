import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Zap, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const QUICK_LOGINS = [
  { label: 'Login as Admin', email: 'admin@taskerzz.com', password: 'admin123' },
  { label: 'Login as Tasker', email: 'alice@taskerzz.com', password: 'tasker123' },
];

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [quickLoginLabel, setQuickLoginLabel] = useState(null);
  const { login, register: registerUser } = useAuthStore();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      if (isRegister) {
        await registerUser(data.name, data.email, data.password);
        toast.success('Account created successfully.');
      } else {
        await login(data.email, data.password);
        toast.success('Welcome back.');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    }
  };

  const handleQuickLogin = async ({ label, email, password }) => {
    setQuickLoginLabel(label);
    try {
      await login(email, password);
      toast.success('Welcome back.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setQuickLoginLabel(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-950 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cream/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-lg shadow-accent/15">
              <Zap size={24} className="text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white font-heading">Taskerzz</h1>
              <p className="text-xs text-cream font-mono uppercase tracking-widest">workspace</p>
            </div>
          </div>
          <p className="text-base-200 text-sm">{isRegister ? 'Create your admin account' : 'Sign in to your account'}</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-base-100 mb-1.5">Full Name</label>
                <input {...register('name', { required: isRegister ? 'Name is required' : false })} className="input" placeholder="John Doe" />
                {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-base-100 mb-1.5">Email</label>
              <input {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } })} className="input" placeholder="you@example.com" type="email" />
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-base-100 mb-1.5">Password</label>
              <div className="relative">
                <input {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })} className="input pr-10" placeholder="Enter password" type={showPassword ? 'text' : 'password'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-base-400 hover:text-white">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
            </div>

            {!isRegister && (
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-accent-light hover:text-cream">Forgot password?</Link>
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-center disabled:opacity-50">
              {isSubmitting ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button onClick={() => setIsRegister(!isRegister)} className="text-sm text-base-300 hover:text-cream transition-colors">
              {isRegister ? 'Already have an account? Sign in' : 'First time? Create admin account'}
            </button>
          </div>

          {!isRegister && (
            <div className="mt-6 border-t border-base-700/50 pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_LOGINS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleQuickLogin(option)}
                    disabled={isSubmitting || !!quickLoginLabel}
                    className="btn-secondary px-3 py-2.5 text-xs disabled:opacity-50"
                  >
                    {quickLoginLabel === option.label ? 'Signing in...' : option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
