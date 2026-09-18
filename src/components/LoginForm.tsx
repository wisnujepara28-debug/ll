import React, { useState } from 'react';
import { Ship, Lock, User, CheckCircle2, ArrowRight, Anchor, Globe2, Sparkles } from 'lucide-react';
import { UserSession } from '../types';

interface LoginFormProps {
  onLoginSuccess: (user: UserSession) => void;
  onlineCount?: number;
}

const QUICK_USERS: UserSession[] = [
  {
    id: 'USR-ADMIN',
    username: 'admin',
    email: 'admin@japarabahari.co.id',
    name: 'Administrator Japara Bahari',
    role: 'Super Admin',
  },
  {
    id: 'USR-OPS',
    username: 'operasional',
    email: 'ops@japarabahari.co.id',
    name: 'Staff Operasional Jepara',
    role: 'Fleet Manager',
  },
  {
    id: 'USR-KAPTEN',
    username: 'kapten',
    email: 'kapten@japarabahari.co.id',
    name: 'Capt. Hendra Gunawan',
    role: 'Port Operations',
  },
];

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onlineCount = 1 }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Super Admin' | 'Fleet Manager' | 'Port Operations'>('Super Admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login Bebas: Menerima input apa saja tanpa batasan ketat
  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const cleanUsername = username.trim() || 'Petugas Japara';
      const cleanName = cleanUsername.includes('@')
        ? cleanUsername.split('@')[0]
        : cleanUsername;
      
      const displayName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      const generatedId = 'USR-' + Math.random().toString(36).substring(2, 9).toUpperCase();

      const userSession: UserSession = {
        id: generatedId,
        username: cleanUsername,
        email: cleanUsername.includes('@') ? cleanUsername : `${cleanUsername.toLowerCase().replace(/\s+/g, '')}@japarabahari.co.id`,
        name: displayName,
        role: role,
      };

      onLoginSuccess(userSession);
      setIsSubmitting(false);
    }, 250);
  };

  const handleQuickLogin = (quickUser: UserSession) => {
    setUsername(quickUser.username);
    setPassword('bebas123');
    setIsSubmitting(true);
    setTimeout(() => {
      onLoginSuccess(quickUser);
      setIsSubmitting(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      {/* Header Visual */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 mb-3">
          <Anchor className="w-9 h-9" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          JAPARA BAHARI SHIPPING
        </h1>
        <p className="mt-1 text-sm text-slate-600 font-medium">
          Sistem Manajemen Operasional Pelayaran & Logistik Maritim Real-Time
        </p>

        {/* Status Online Terhubung */}
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <Globe2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sistem Online Aktif ({onlineCount} pengguna terhubung)</span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-xl shadow-slate-100/80">
          <div className="mb-5 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
              <Ship className="w-5 h-5 text-blue-600" />
              <span>Portal Masuk Petugas</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Login Bebas
            </span>
          </div>

          <div className="mb-4 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
            <span>
              <strong>Bebas Login:</strong> Ketik username & kata sandi apa saja sesuai keinginan Anda untuk langsung masuk dan terhubung dengan pengguna lain.
            </span>
          </div>

          {/* Form Login Bebas */}
          <form id="login-form" onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label htmlFor="username-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Username / Nama Petugas (Bebas)
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: Budi, Admin, Japara, atau email Anda"
                  className="block w-full pl-11 pr-4 py-2.5 text-sm text-slate-800 bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Kata Sandi / Password (Bebas)
                </label>
                <span className="text-[11px] text-emerald-600 font-medium">Bebas diisi apa saja</span>
              </div>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ketik password bebas apa saja"
                  className="block w-full pl-11 pr-4 py-2.5 text-sm text-slate-800 bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role-select" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Peran / Jabatan di Sistem
              </label>
              <select
                id="role-select"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="block w-full px-3 py-2.5 text-sm text-slate-800 bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
              >
                <option value="Super Admin">Super Admin (Akses Penuh Kapal, Kargo & Kru)</option>
                <option value="Fleet Manager">Fleet Manager (Manajer Armada & Rute)</option>
                <option value="Port Operations">Port Operations (Operasional Pelabuhan & Bongkar Muat)</option>
              </select>
            </div>

            <button
              id="submit-login-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menghubungkan ke Server...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke JAPARA BAHARI SHIPPING</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Login */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                Atau Klik Login Cepat (Otomatis):
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {QUICK_USERS.map((quickUser) => (
                <button
                  key={quickUser.id}
                  type="button"
                  id={`quick-login-${quickUser.username}`}
                  onClick={() => handleQuickLogin(quickUser)}
                  disabled={isSubmitting}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 active:bg-blue-100/60 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {quickUser.role === 'Super Admin' ? 'SA' : quickUser.role === 'Fleet Manager' ? 'FM' : 'PO'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                        {quickUser.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal">
                        {quickUser.role} • {quickUser.username}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                    Masuk →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-5 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} PT Japara Bahari Shipping Tbk. Sistem Manajemen Maritim Terpadu.</p>
        </div>
      </div>
    </div>
  );
};
