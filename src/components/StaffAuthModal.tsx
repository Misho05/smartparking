import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, X, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Language } from '../types';

interface StaffAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lang: Language;
}

export const StaffAuthModal: React.FC<StaffAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lang,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default Admin PIN: 9999 or 1234 or 0000 or empty for demo quick-access
    if (pin === '9999' || pin === '1234' || pin === '0000' || pin.trim() === '') {
      setError(false);
      onSuccess();
    } else {
      setError(true);
    }
  };

  const handleQuickDemoAccess = () => {
    setError(false);
    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-5 shadow-lg">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="flex items-center gap-2">
          <h3 className="text-xl font-extrabold text-white tracking-tight">
            ადმინ პანელში შესვლა
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40">
            ადმინ რეჟიმი
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          ეს განყოფილება განკუთვნილია სისტემის ადმინისტრატორისთვის: მომხმარებელთა კორექტირება და წაშლა, თანამშრომლები, ტარიფების მართვა & სალარო.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ადმინისტრატორის PIN კოდი (ნაგულისხმევი: <span className="font-mono text-indigo-300 font-bold">9999</span> ან <span className="font-mono text-amber-300">1234</span>)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                placeholder="9999"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white font-mono text-center tracking-widest placeholder:text-slate-600 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>არასწორი PIN კოდი. სცადეთ 9999 ან გამოიყენეთ სწრაფი შესვლა.</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            <span>შესვლა ადმინ პანელში</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">სწრაფი წვდომა (დემო):</span>
          <button
            onClick={handleQuickDemoAccess}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 hover:underline"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ავტორიზაცია 1-დაწკაპებით</span>
          </button>
        </div>
      </div>
    </div>
  );
};
