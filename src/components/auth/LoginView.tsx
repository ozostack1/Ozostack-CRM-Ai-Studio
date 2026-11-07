import React, { useState } from 'react';
import { Sparkles, Mail, Lock, Eye, EyeOff, AlertCircle, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_PASSWORD } from '../../context/authData';

const DEMO_ACCOUNTS = [
  { email: 'sayed@ozostack.io', label: 'Super Admin' },
  { email: 'marcus.vance@ozostack.io', label: 'Finance Manager' },
  { email: 'sarah.connor@ozostack.io', label: 'HR Manager' },
  { email: 'amit.kumar@ozostack.io', label: 'Dept. Manager' },
  { email: 'jessica.taylor@ozostack.io', label: 'Sales Executive' },
  { email: 'neha.sharma@ozostack.io', label: 'Employee' },
];

export const LoginView: React.FC = () => {
  const { login, users } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(email, password);
    if (!res.ok) setError(res.error || 'Unable to sign in.');
  };

  const inputCls =
    'w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-sky-100 shadow-xl p-7 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-wider text-slate-900">OZO STACK</h1>
            <p className="text-xs text-slate-500">Sign in to your company workspace</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="name@ozostack.io"
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                className={`${inputCls} pr-10`}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-2.5 text-slate-400 hover:text-sky-500">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold shadow-md shadow-sky-500/20 transition-colors"
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Demo accounts · default password <span className="font-mono text-sky-600 normal-case">{DEFAULT_PASSWORD}</span>
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {DEMO_ACCOUNTS.filter((d) => users.some((u) => u.email === d.email)).map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => { setEmail(d.email); setPassword(DEFAULT_PASSWORD); setError(''); }}
                className="text-left px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-sky-300 hover:bg-sky-50 transition-colors"
              >
                <span className="block text-[11px] font-bold text-slate-800">{d.label}</span>
                <span className="block text-[10px] text-slate-400 truncate">{d.email}</span>
              </button>
            ))}
          </div>
          <p className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" /> Access is limited to the modules and data your administrator assigns.
          </p>
        </div>
      </div>
    </div>
  );
};

