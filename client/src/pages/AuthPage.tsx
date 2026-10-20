import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Palette } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export const AuthPage: React.FC<{ initialMode?: 'login' | 'register' }> = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const { login, register: authRegister } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const redirectUrl = searchParams.get('redirect') || '/';

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const user = await login(data.email, data.password);
      success('Welcome Back!', `Signed in as ${user.name} (${user.role}).`);
      if (user.role === 'studio') {
        navigate('/admin');
      } else {
        navigate(redirectUrl === '/' ? '/dashboard' : redirectUrl);
      }
    } catch (err: any) {
      toastError('Authentication Failed', err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      const user = await authRegister(data.name, data.email, data.password);
      success('Welcome to The Living Atelier!', `Your customer account has been created.`);
      navigate('/dashboard');
    } catch (err: any) {
      toastError('Registration Failed', err.message || 'Could not register customer account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-3xl border-4 border-atelier-ink shadow-brutal-xl overflow-hidden">
        
        {/* Upper Art Banner */}
        <div className="bg-atelier-lavender p-8 border-b-2 border-atelier-ink text-center space-y-2 relative">
          <div className="w-12 h-12 rounded-full bg-atelier-chartreuse border-2 border-atelier-ink shadow-brutal flex items-center justify-center mx-auto mb-3">
            <Palette className="w-6 h-6 text-atelier-ink" />
          </div>
          <h1 className="font-display font-black text-2xl text-atelier-ink tracking-tight">
            THE LIVING ATELIER
          </h1>
          <p className="text-xs font-bold text-atelier-ink/80 uppercase tracking-widest">
            {mode === 'login' ? 'Patron & Studio Access' : 'Create Customer Account'}
          </p>

          {/* Tab Switcher */}
          <div className="flex bg-white/60 p-1 rounded-full border-2 border-atelier-ink mt-4">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-1.5 rounded-full font-display font-bold text-xs uppercase tracking-wider transition-all ${
                mode === 'login'
                  ? 'bg-atelier-chartreuse text-atelier-ink border-2 border-atelier-ink shadow-sm'
                  : 'text-atelier-muted hover:text-atelier-ink'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-1.5 rounded-full font-display font-bold text-xs uppercase tracking-wider transition-all ${
                mode === 'register'
                  ? 'bg-atelier-chartreuse text-atelier-ink border-2 border-atelier-ink shadow-sm'
                  : 'text-atelier-muted hover:text-atelier-ink'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-8 space-y-6">
          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label className="block font-display font-bold text-xs text-atelier-ink uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. patron@example.com"
                  {...loginForm.register('email')}
                  className="w-full px-4 py-3 rounded-xl border-2 border-atelier-ink bg-atelier-cream text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-atelier-chartreuse"
                />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-atelier-tomato font-bold">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block font-display font-bold text-xs text-atelier-ink uppercase">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...loginForm.register('password')}
                  className="w-full px-4 py-3 rounded-xl border-2 border-atelier-ink bg-atelier-cream text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-atelier-chartreuse"
                />
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-atelier-tomato font-bold">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 shadow-brutal text-sm"
              >
                {loading ? 'Authenticating...' : 'Sign In to Atelier'}
              </button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label className="block font-display font-bold text-xs text-atelier-ink uppercase">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Maya Patel"
                  {...registerForm.register('name')}
                  className="w-full px-4 py-3 rounded-xl border-2 border-atelier-ink bg-atelier-cream text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-atelier-chartreuse"
                />
                {registerForm.formState.errors.name && (
                  <p className="text-xs text-atelier-tomato font-bold">
                    {registerForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block font-display font-bold text-xs text-atelier-ink uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="maya@example.com"
                  {...registerForm.register('email')}
                  className="w-full px-4 py-3 rounded-xl border-2 border-atelier-ink bg-atelier-cream text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-atelier-chartreuse"
                />
                {registerForm.formState.errors.email && (
                  <p className="text-xs text-atelier-tomato font-bold">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block font-display font-bold text-xs text-atelier-ink uppercase">
                  Password (Min 6 Characters)
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...registerForm.register('password')}
                  className="w-full px-4 py-3 rounded-xl border-2 border-atelier-ink bg-atelier-cream text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-atelier-chartreuse"
                />
                {registerForm.formState.errors.password && (
                  <p className="text-xs text-atelier-tomato font-bold">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="bg-atelier-cream p-3 rounded-xl border border-atelier-border text-xs text-atelier-muted">
                🛡️ Note: Public registration strictly creates a <b>customer</b> account. Studio administration credentials are restricted to atelier personnel.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-accent w-full py-3.5 shadow-brutal text-sm"
              >
                {loading ? 'Creating Account...' : 'Register Customer Account'}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
