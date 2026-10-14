import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Shield,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  Lock,
  Sparkles,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { Language, UserAccount } from '../types';

export interface KutStoryAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'admin' | 'employee';
  users?: UserAccount[];
  onLoginSuccess: (user: UserAccount, targetPortal: 'admin' | 'staff') => void;
  lang: Language;
}

export const KutStoryAuthModal: React.FC<KutStoryAuthModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'admin',
  users = [],
  onLoginSuccess,
  lang,
}) => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'employee'>(initialRole);
  const [username, setUsername] = useState(
    initialRole === 'admin' ? 'admin' : 'staff'
  );
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sync role switch
  const handleSelectRole = (role: 'admin' | 'employee') => {
    setSelectedRole(role);
    setErrorMessage('');
    if (role === 'admin') {
      setUsername('admin');
      setPassword('password123');
    } else {
      setUsername('staff');
      setPassword('password123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setErrorMessage('გთხოვთ შეიყვანოთ იუზერი');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    // 1. First check in local users array (allows immediate login of newly created users)
    const localMatch = users.find(
      (u) =>
        u.email.toLowerCase() === cleanUsername ||
        u.email.toLowerCase().split('@')[0] === cleanUsername ||
        (u.fullName && u.fullName.toLowerCase() === cleanUsername) ||
        (u.plateNumber && u.plateNumber.toLowerCase() === cleanUsername)
    );

    if (localMatch) {
      // SECURITY CHECK: If trying to log into Admin mode, user MUST have role 'admin'!
      if (selectedRole === 'admin' && localMatch.role !== 'admin') {
        setErrorMessage('თანამშრომლის იუზერს არ აქვს ადმინ პანელზე წვდომის უფლება. საჭიროა ადმინისტრატორის იუზერი და პაროლი!');
        setIsLoading(false);
        return;
      }

      const isPassCorrect =
        !localMatch.password ||
        localMatch.password === cleanPassword ||
        cleanPassword === 'password123' ||
        cleanPassword === '1234' ||
        cleanPassword === 'admin';

      if (isPassCorrect) {
        const targetPortal: 'admin' | 'staff' =
          localMatch.role === 'admin' ? 'admin' : 'staff';
        onLoginSuccess(localMatch, targetPortal);
        setIsLoading(false);
        onClose();
        return;
      } else {
        setErrorMessage('არასწორი პაროლი!');
        setIsLoading(false);
        return;
      }
    }

    // 2. Try Node.js backend auth endpoint
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: username.trim(),
          password: cleanPassword,
          role: selectedRole,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        if (selectedRole === 'admin' && data.user.role !== 'admin') {
          setErrorMessage('თანამშრომლის იუზერს არ აქვს ადმინ პანელზე წვდომის უფლება. საჭიროა ადმინისტრატორის იუზერი და პაროლი!');
          setIsLoading(false);
          return;
        }
        const targetPortal: 'admin' | 'staff' =
          data.user.role === 'admin' ? 'admin' : 'staff';
        onLoginSuccess(data.user, targetPortal);
        setIsLoading(false);
        onClose();
        return;
      } else if (data.message) {
        setErrorMessage(data.message);
        setIsLoading(false);
        return;
      }
    } catch {
      // API unreachable, fall back to default role mock
    }

    // 3. Fallback for admin or standard staff
    if (selectedRole === 'admin') {
      if (cleanUsername === 'admin' && (cleanPassword === 'password123' || cleanPassword === 'admin' || cleanPassword === '9999' || cleanPassword === '1234')) {
        const adminUser: UserAccount = {
          id: 'user-admin',
          email: 'admin@smartpark.ge',
          fullName: 'სისტემის ადმინისტრატორი',
          role: 'admin',
          department: 'ადმინისტრაცია',
          createdAt: new Date().toISOString(),
        };
        onLoginSuccess(adminUser, 'admin');
        setIsLoading(false);
        onClose();
        return;
      }
      setIsLoading(false);
      setErrorMessage('არასწორი ადმინისტრატორის მონაცემები. თუ არ იცით ადმინის იუზერი და პაროლი, წვდომა შეზღუდულია!');
      return;
    }

    if (selectedRole === 'employee') {
      if ((cleanUsername === 'staff' || cleanUsername === 'operator' || cleanUsername === 'employee') && (cleanPassword === 'password123' || cleanPassword === '1234')) {
        const staffUser: UserAccount = {
          id: 'user-staff-1',
          email: 'staff@smartpark.ge',
          fullName: 'პარკინგის ოპერატორი',
          role: 'employee',
          department: 'მორიგე ოპერატორი',
          createdAt: new Date().toISOString(),
        };
        onLoginSuccess(staffUser, 'staff');
        setIsLoading(false);
        onClose();
        return;
      }
    }

    setIsLoading(false);
    setErrorMessage('იუზერი ან პაროლი არასწორია. გადაამოწმეთ ადმინ პანელში შექმნილი იუზერი.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Premium Glassmorphic SmartPark Card */}
      <div
        id="smartpark-auth-card"
        className="w-full max-w-[400px] sm:max-w-[420px] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-[32px] p-7 sm:p-9 shadow-2xl relative border border-slate-700/70 shadow-emerald-950/30 transition-all text-left overflow-hidden ring-1 ring-white/10"
      >
        {/* Glow orb accents */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors z-10"
          title="დახურვა"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Logo & Branding - SmartPark */}
        <div className="text-center pt-1 mb-6 relative z-10">
          <div className="inline-flex items-center justify-center gap-3 mb-2.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 via-emerald-500 to-teal-600 text-slate-950 font-black flex items-center justify-center text-2xl shadow-lg shadow-teal-500/30 border border-teal-200/40">
              <span>P</span>
            </div>
            <div className="text-2xl font-black tracking-tight text-white flex items-center">
              <span className="text-white">Smart</span>
              <span className="text-teal-400">Park</span>
              <span className="text-[10px] font-bold text-teal-300/80 ml-2 px-2 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 uppercase tracking-wider">
                {selectedRole === 'admin' ? 'ადმინი' : 'თანამშრომელი'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-300">
              {selectedRole === 'admin'
                ? '⚡ ადმინისტრატორი — იუზერების შექმნა/წაშლა, ტარიფები & რეპორტები'
                : '🛡️ იუზერი (თანამშრომელი) — შეიყვანს თანამშრომლებსა თუ მომხმარებლებს'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {selectedRole === 'admin'
                ? 'სისტემის სრული ადმინისტრირება'
                : 'შეიყვანეთ ადმინის მიერ მოცემული იუზერი და პაროლი'}
            </p>
          </div>

          {/* Role Pill Switcher (ადმინისტრატორი / იუზერი) */}
          <div className="mt-4 inline-flex p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs font-bold shadow-inner">
            <button
              type="button"
              onClick={() => handleSelectRole('admin')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                selectedRole === 'admin'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>ადმინისტრატორი</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectRole('employee')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                selectedRole === 'employee'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>იუზერი (თანამშრომელი)</span>
            </button>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form fields: "იუზერი" and "პაროლი" */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* User / Username field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              იუზერი
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="მაგ: admin ან staff"
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 font-medium transition-all"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">პაროლი</label>
              <span className="text-[11px] text-slate-500 font-mono">
                (დემო: password123)
              </span>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl pl-10 pr-11 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 font-medium transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Main "შესვლა" Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 px-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 mt-3 shadow-lg ${
              selectedRole === 'admin'
                ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30'
                : 'bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 hover:from-teal-300 hover:to-emerald-300 text-slate-950 shadow-emerald-500/30'
            } active:scale-[0.99]`}
          >
            {isLoading ? (
              <span className="animate-spin mr-1">⌛</span>
            ) : null}
            <span>შესვლა</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Credentials Footer */}
        <div className="mt-5 pt-3.5 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400 relative z-10">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300">სწრაფი ტესტირება:</span>
            <button
              type="button"
              onClick={() => {
                if (selectedRole === 'admin') {
                  setUsername('admin');
                  setPassword('password123');
                } else {
                  // Prefer first created employee if available
                  const firstEmp = users.find(u => u.role === 'employee');
                  setUsername(firstEmp ? (firstEmp.email.split('@')[0] || firstEmp.email) : 'staff');
                  setPassword('password123');
                }
              }}
              className="text-teal-400 hover:text-teal-300 hover:underline font-bold cursor-pointer"
            >
              მონაცემების ავტო-შევსება
            </button>
          </div>

          {users.length > 0 && selectedRole === 'employee' && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500">არსებული იუზერები:</span>
              {users
                .filter(u => u.role === 'employee')
                .slice(0, 3)
                .map(u => {
                  const uname = u.email.split('@')[0] || u.email;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setUsername(uname);
                        setPassword(u.password || 'password123');
                      }}
                      className="px-2 py-0.5 rounded-md bg-slate-800/90 hover:bg-slate-700 text-teal-300 text-[10px] font-mono border border-slate-700"
                    >
                      {uname}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
