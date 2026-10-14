import React, { useState, useRef, useEffect } from 'react';
import { X, User, Phone, Lock, KeyRound, Check, ShieldCheck, Mail, Building, Upload, Image, Trash2, Sparkles } from 'lucide-react';
import { UserAccount, Language } from '../types';
import { PRESET_AVATARS, compressAndReadImage } from '../utils/avatarUtils';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onUpdateProfile: (updated: Partial<UserAccount>) => void;
  lang: Language;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  lang,
}) => {
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [department, setDepartment] = useState(currentUser.department || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(currentUser.avatarUrl || '');
  const [newPassword, setNewPassword] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFullName(currentUser.fullName);
      setPhone(currentUser.phone || '');
      setDepartment(currentUser.department || '');
      setAvatarUrl(currentUser.avatarUrl || '');
      setNewPassword('');
      setSavedSuccess(false);
      setUploadError('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const compressedDataUrl = await compressAndReadImage(file, 256, 0.85);
      setAvatarUrl(compressedDataUrl);
    } catch (err: any) {
      setUploadError(err.message || 'ფოტოს ატვირთვა ვერ მოხერხდა');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectPreset = (url: string) => {
    setAvatarUrl(url);
    setUploadError('');
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<UserAccount> = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      department: department.trim(),
      avatarUrl: avatarUrl || undefined,
    };
    if (newPassword.trim()) {
      updates.password = newPassword.trim();
    }
    onUpdateProfile(updates);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-left text-white max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center shadow-inner overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-black text-white">პროფილის რედაქტირება</h3>
            <p className="text-xs text-slate-400">
              {currentUser.role === 'admin' ? 'ადმინისტრატორის პროფილი' : 'თანამშრომლის პროფილი'}
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>პროფილი და ფოტო წარმატებით განახლდა!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* ================= PROFILE PHOTO UPLOAD & PRESETS ================= */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <Image className="w-4 h-4 text-teal-400" />
                <span>პროფილის ფოტო & ავატარი</span>
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>ფოტოს წაშლა</span>
                </button>
              )}
            </div>

            {/* Avatar Preview & Upload Buttons */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 border-2 border-teal-500/50 shadow-md shrink-0 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <User className="w-7 h-7" />
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center text-xs">
                    ⌛
                  </div>
                )}
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="profile-photo-upload-input"
                  />
                  <label
                    htmlFor="profile-photo-upload-input"
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'მუშავდება...' : 'ფოტოს ატვირთვა'}</span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-400">
                  ატვირთეთ ფოტო კომპიუტერიდან/ტელეფონიდან, ან აირჩიეთ ჩაშენებული დეფაულტ სურათი ქვემოთ.
                </p>
                {uploadError && (
                  <p className="text-[10px] text-rose-400 font-semibold">{uploadError}</p>
                )}
              </div>
            </div>

            {/* Built-in Default Profile Pictures (ჩაშენებული დეფაულტ ავატარები) */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-300 block mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>ჩაშენებული დეფაულტ პროფილის სურათები:</span>
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = avatarUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url)}
                      title={preset.label}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all p-0.5 group ${
                        isSelected
                          ? 'border-teal-400 ring-2 ring-teal-400/50 scale-105 shadow-md'
                          : 'border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-teal-500/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              სახელი და გვარი *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              ტელეფონის ნომერი
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+995 599 00 00 00"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              განყოფილება / პოზიცია
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="ადმინისტრაცია / ოპერატორი"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              ახალი პაროლი (თუ შეცვლა გსურთ)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="დატოვეთ ცარიელი თუ არ ცვლით"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/25 transition-all"
            >
              შენახვა
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
