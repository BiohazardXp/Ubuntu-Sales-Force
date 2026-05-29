import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, LayoutDashboard, AlertCircle } from 'lucide-react';
import { authApi, tokenHelpers } from '../../services/api';

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Hit POST /api/v1/auth/login
      const { accessToken, user } = await authApi.login(username.trim(), password);

      // Persist token + user in localStorage
      tokenHelpers.set(accessToken);
      tokenHelpers.setUser(user);

      // Navigate without a full page reload
      navigate('/dashboard', { replace: true });

    } catch (err: any) {
      // NestJS returns { message: string } on 401
      const msg = err?.response?.data?.message;
      if (Array.isArray(msg)) {
        setError(msg[0]);
      } else {
        setError(msg || 'Invalid username or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="fixed inset-0 flex" style={{ background: '#f0f2f5' }}>

      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10"
        style={{ background: '#1a2236' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#3b82f6' }}>
            <LayoutDashboard size={18} color="white" />
          </div>
          <span className="text-white font-bold text-lg">Ubuntu Sales</span>
        </div>

        {/* Pitch + stats */}
        <div className="space-y-4">
          <p className="text-white text-2xl font-bold leading-snug">
            Real-time intelligence<br />for your field team.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Track reps live, monitor performance, predict outcomes — all from one control center.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-6">
            {[
              { label: 'Active Reps Today', value: '18 / 22'    },
              { label: 'Sales This Hour',   value: 'ZMW 6,250'  },
              { label: 'Customers Visited', value: '128'         },
              { label: 'Weekly Forecast',   value: 'ZMW 415K'   },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3" style={{ background: '#263049' }}>
                <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                <p className="text-white font-bold text-sm">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">© 2024 Ubuntu Sales Force. All rights reserved.</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#3b82f6' }}>
              <LayoutDashboard size={16} color="white" />
            </div>
            <span className="font-bold text-slate-800">Ubuntu Sales</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            <h1 className="text-xl font-bold text-slate-900 mb-1">Welcome back</h1>
            <p className="text-sm text-slate-500 mb-6">Sign in to your account to continue</p>

            {/* Error banner */}
            {error && (
              <div
                className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg text-xs font-medium"
                style={{ background: '#fee2e2', color: '#dc2626' }}
              >
                <AlertCircle size={13} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Username */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Username</label>
              <input
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                placeholder="Enter your username"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Password */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  onKeyDown={handleKeyDown}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2"
              style={{
                background: loading ? '#93c5fd' : '#3b82f6',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Signing in…</>
                : 'Sign In'
              }
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            Having trouble? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
