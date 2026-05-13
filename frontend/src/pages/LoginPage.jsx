import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Zap, Eye, EyeOff, ArrowRight, UserCog, Users } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [activeTab, setActiveTab] = useState('TASKER');
  const { login, register: registerUser } = useAuthStore();
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const switchMode = (newMode) => {
    setMode(newMode);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      if (mode === 'signup') {
        await registerUser(data.name, data.email, data.password, activeTab);
        toast.success('Account created');
      } else {
        await login(data.email, data.password);
        toast.success('Welcome back');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="login-page">
      <div className="login-ambient login-ambient--1" />
      <div className="login-ambient login-ambient--2" />

      <div className="login-container">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <span className="login-logo-text">Taskerzz</span>
        </div>

        <p className="login-subtitle">
          {mode === 'login' ? 'Sign in to your workspace' : 'Create your account'}
        </p>

        {/* Role Tabs */}
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab ${activeTab === 'TASKER' ? 'login-tab--active' : ''}`}
            onClick={() => setActiveTab('TASKER')}
          >
            <Users size={14} />
            Tasker
          </button>
          <button
            type="button"
            className={`login-tab ${activeTab === 'ADMIN' ? 'login-tab--active' : ''}`}
            onClick={() => setActiveTab('ADMIN')}
          >
            <UserCog size={14} />
            Admin
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          {mode === 'signup' && (
            <div className="login-field">
              <label className="login-label">Full Name</label>
              <input
                {...register('name', { required: 'Name is required' })}
                className="login-input"
                placeholder="Your full name"
                autoComplete="name"
              />
              {errors.name && <span className="login-error">{errors.name.message}</span>}
            </div>
          )}

          <div className="login-field">
            <label className="login-label">Email</label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' }
              })}
              className="login-input"
              placeholder={activeTab === 'ADMIN' ? 'admin@company.com' : 'you@company.com'}
              type="email"
              autoComplete="email"
            />
            {errors.email && <span className="login-error">{errors.email.message}</span>}
          </div>

          <div className="login-field">
            <label className="login-label">Password</label>
            <div className="login-input-wrap">
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Min 6 characters' }
                })}
                className="login-input"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <span className="login-error">{errors.password.message}</span>}
          </div>

          <button type="submit" disabled={isSubmitting} className="login-submit">
            {isSubmitting ? (
              <span className="login-spinner" />
            ) : (
              <>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="login-toggle">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button type="button" onClick={() => switchMode('signup')}>Sign up</button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => switchMode('login')}>Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
