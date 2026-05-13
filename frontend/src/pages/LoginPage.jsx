import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Zap, Eye, EyeOff, ArrowRight, UserCog, Users } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('TASKER');
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      const res = await login(data.email, data.password);
      toast.success('Welcome back');
      // Role-based redirect
      if (res.user?.role === 'ADMIN') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    }
  };

  const fillDemo = (type) => {
    if (type === 'ADMIN') {
      setValue('email', 'admin@taskerzz.com');
      setValue('password', 'admin123');
      setActiveTab('ADMIN');
    } else {
      setValue('email', 'alice@taskerzz.com');
      setValue('password', 'tasker123');
      setActiveTab('TASKER');
    }
  };

  return (
    <div className="login-page">
      <div className="login-ambient login-ambient--1" />
      <div className="login-ambient login-ambient--2" />

      <div className="login-container">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <span className="login-logo-text">Taskerzz</span>
        </div>

        <p className="login-subtitle">Sign in to your workspace</p>

        {/* Role Tabs */}
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab ${activeTab === 'TASKER' ? 'login-tab--active' : ''}`}
            onClick={() => { setActiveTab('TASKER'); fillDemo('TASKER'); }}
          >
            <Users size={14} />
            Tasker Login
          </button>
          <button
            type="button"
            className={`login-tab ${activeTab === 'ADMIN' ? 'login-tab--active' : ''}`}
            onClick={() => { setActiveTab('ADMIN'); fillDemo('ADMIN'); }}
          >
            <UserCog size={14} />
            Admin Login
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="login-field">
            <label className="login-label">Email</label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' }
              })}
              className="login-input"
              placeholder={activeTab === 'ADMIN' ? 'admin@taskerzz.com' : 'alice@taskerzz.com'}
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
                autoComplete="current-password"
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
                Sign In
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div className="login-demo">
          <p className="login-demo-label">Demo Credentials</p>
          <div className="login-demo-grid">
            <button type="button" className="login-demo-btn" onClick={() => fillDemo('ADMIN')}>
              <span className="login-demo-role">Admin</span>
              <span className="login-demo-email">admin@taskerzz.com</span>
            </button>
            <button type="button" className="login-demo-btn" onClick={() => fillDemo('TASKER')}>
              <span className="login-demo-role">Tasker</span>
              <span className="login-demo-email">alice@taskerzz.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
