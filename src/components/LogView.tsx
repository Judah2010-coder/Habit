import { UserProfile, UserLog } from '../types';
import { auth } from '../firebase';
import { useState } from 'react';

interface LogViewProps {
  user: UserProfile;
  logs: UserLog[];
  onTogglePreference: (field: 'visualMode' | 'neuralComms') => Promise<void>;
  onResetData: () => Promise<void>;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  loadingAction: string | null;
}

export default function LogView({
  user,
  logs,
  onTogglePreference,
  onResetData,
  onNotify,
  loadingAction,
}: LogViewProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Parse last completed logging action time nicely
  const lastSyncTime = logs.length > 0 ? logs[0].createdAt : '2026-05-21 04:46:19';

  const handleToggle = async (field: 'visualMode' | 'neuralComms') => {
    if (loadingAction) return;
    try {
      await onTogglePreference(field);
    } catch (e) {
      onNotify('Failed to synchronize configuration preference.', 'error');
    }
  };

  const executeReset = async () => {
    setResetting(true);
    try {
      await onResetData();
      onNotify('All local operative systems returned to initial default state.', 'success');
      setConfirmReset(false);
    } catch (e) {
      onNotify('Self-destruct process failed to execute.', 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleSignOut = () => {
    auth.signOut();
    onNotify('Neural transmitter disconnected.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <section>
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-2xl font-bold text-on-surface tracking-tight uppercase">
            System Configuration
          </h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(217,187,241,0.8)] animate-pulse"></div>
            <p className="font-mono text-[10px] text-secondary uppercase tracking-widest font-bold">
              Core Status: Online
            </p>
          </div>
        </div>
      </section>

      {/* Bento Settings Grid */}
      <div className="grid grid-cols-1 gap-4">
        {/* Hardware ID Panel */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col gap-4">
          <div className="absolute top-0 right-0 p-4 font-mono text-[9px] text-on-surface-variant/30">ID_91X08</div>
          <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">HARDWARE ID</p>
          <h3 className="font-display text-2xl font-bold text-primary tracking-tight">HABIT HUSTLE</h3>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="px-2.5 py-0.5 bg-primary-container/20 text-primary rounded-full text-[10px] font-mono border border-primary/20">
              VERSION 1.0
            </span>
            <span className="text-on-surface-variant/60 font-mono text-[10px] uppercase">
              ARCH: DEEP-SPACE-RECOV
            </span>
          </div>

          <div className="w-full h-32 rounded-xl overflow-hidden border border-outline-variant/30 relative mt-2 bg-[#0d0e11]">
            <img
              alt="Orbital backdrop"
              className="w-full h-full object-cover opacity-30 grayscale"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRFqfOzpmXcTKl4cE8mxtWUs8tSx7On9WKpxO7EzDAzgWX6bQxd6LOb4eegxZ_GBXVzjDjPoqSuDbOO8ofYfYXXBe11vaYJA2-zN2Yg3EN8j-n57lgUNJqSSRXnCv96sfNUoZzKnT2CWREekpHesyr6wrGPglqWL0f3raap_nylkD7w2s3O1K5PnPsrZfFT3hgd3M5UVrr6yvmGTie5EGvMoZyZlFx3zJkEmpK3FJHyH7tyavZ9iqzG7unRnaMR9vcbSYM2WhgFX0"
            />
            {/* Visual scan indicators */}
            <div className="absolute inset-0 xp-bar-scanner opacity-[0.05]"></div>
          </div>
        </div>

        {/* Theme Toggle Card */}
        <div
          onClick={() => handleToggle('visualMode')}
          className="glass-card p-5 rounded-2xl hover:border-secondary/20 transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="flex gap-4 items-center">
            <div className="p-2.5 bg-secondary-container/20 rounded-xl text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">dark_mode</span>
            </div>
            <div>
              <h4 className="font-display text-xs font-bold text-on-surface">Visual Mode</h4>
              <p className="text-[11px] text-on-surface-variant/80 mt-1 max-w-[200px] leading-tight">
                Switch to {user.visualMode === 'dark' ? 'Sunlight Optimized (Light)' : 'High-Contrast Dark'} mode.
              </p>
            </div>
          </div>
          {/* Switch toggle layout */}
          <div className={`h-6 w-11 rounded-full p-0.5 flex items-center ${user.visualMode === 'light' ? 'bg-[#ffb597]' : 'bg-surface-container-highest'}`}>
            <div className={`h-5 w-5 rounded-full shadow-[0_0_8px_#d9bbf1] transition-transform duration-200 ${user.visualMode === 'light' ? 'translate-x-5 bg-white' : 'translate-x-0 bg-secondary'}`}></div>
          </div>
        </div>

        {/* Notifications Card */}
        <div
          onClick={() => handleToggle('neuralComms')}
          className="glass-card p-5 rounded-2xl hover:border-primary/20 transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="flex gap-4 items-center">
            <div className="p-2.5 bg-primary-container/20 rounded-xl text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">notifications_active</span>
            </div>
            <div>
              <h4 className="font-display text-xs font-bold text-on-surface">Neural Comms</h4>
              <p className="text-[11px] text-on-surface-variant/80 mt-1 max-w-[200px] leading-tight">
                Manage mission notifications &amp; tactical alarms.
              </p>
            </div>
          </div>

          <div className={`h-6 w-11 rounded-full p-0.5 flex items-center ${user.neuralComms ? 'bg-primary-container' : 'bg-surface-container-highest'}`}>
            <div className={`h-5 w-5 rounded-full shadow-[0_0_8px_#adc6ff] transition-transform duration-200 ${user.neuralComms ? 'translate-x-5 bg-primary' : 'translate-x-0 bg-outline'}`}></div>
          </div>
        </div>

        {/* Data Persistence (Firebase Uplink & Real Sync Feed) */}
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-primary flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary-container/20 rounded-xl text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                cloud_sync
              </span>
            </div>
            <div>
              <h4 className="font-display text-xs font-bold text-on-surface">Firebase Uplink</h4>
              <div className="flex items-center gap-1.5 mt-0.5 animate-pulse">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                <span className="text-mono text-[9px] text-primary uppercase font-bold tracking-wider">
                  STATUS: SECURED &bull; CONNECTED
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest/80 p-3.5 rounded-xl border border-outline-variant/10 font-mono text-[10px] text-on-surface-variant/80 space-y-1">
            <div className="flex justify-between">
              <span>Last Sync Time:</span>
              <span className="text-primary truncate max-w-[150px]">{lastSyncTime}</span>
            </div>
            <div className="flex justify-between">
              <span>Security Protocols:</span>
              <span className="text-primary">100% AES-256</span>
            </div>
          </div>

          {/* Render real activities from Firestore cloud feed logs! */}
          <div className="mt-2 space-y-2">
            <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider font-bold">
              LOG RECORD HISTORY / SYNC_FEED
            </p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {logs.length > 0 ? (
                logs.slice(0, 10).map((log) => {
                  let badgeColor = 'text-status-good';
                  if (log.type === 'purchase') badgeColor = 'text-[#d9bbf1]';
                  if (log.type === 'threat_defeated') badgeColor = 'text-green-300 font-bold';

                  return (
                    <div
                      key={log.id}
                      className="bg-surface-container/40 p-2.5 rounded-lg border border-outline-variant/10 flex justify-between items-center text-[10px] font-mono leading-tight"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-on-surface-variant truncate">{log.title}</div>
                        <div className="text-[8px] text-on-surface-variant/40 mt-0.5">
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            timeStyle: 'medium',
                            dateStyle: 'short',
                          })}
                        </div>
                      </div>
                      <span className={`shrink-0 text-[9px] ${badgeColor}`}>
                        {log.xpEarned > 0 && `+${log.xpEarned}XP `}
                        {log.crystalsChange > 0 && `+${log.crystalsChange}Cr `}
                        {log.crystalsChange < 0 && `${log.crystalsChange}Cr `}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-[10px] text-on-surface-variant/50 text-center py-4 italic border border-dashed border-outline-variant/20 rounded-xl bg-surface-container/10">
                  No telemetric logs registered yet. Complete sector habits to launch sync arrays!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User profile detail details with Sign Out */}
        <div className="glass-card p-5 rounded-2xl flex flex-col gap-3">
          <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
            NEURAL IDENTITY
          </p>
          <div className="flex items-center gap-3">
            <img
              alt="Avatar profile"
              className="w-10 h-10 rounded-full border border-primary/40 object-cover"
              src={user.photoURL || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRJYmscQRERwAQVhluJUggfF6G3OepWySjsMd3niVk9O14O3XinAvuSIYcP_2fH0gOgrSOkNpj_8NVAlTG0LzILvipge6M9jrZd5ZwjKQxeaAkkzXU4O-VjFrxaWPYjYJefS6M3DbXf1_Im0IpijJspOsOUXi6GxO-cFajuUkSC8m0dvRso2CXt4SNN8AhPV9WCrRoRhfy1iUS8j1CgMWaXsBDqe8gwvGEp-wja4v_3Iqgk-STVC6U6cvIrMU-W10-vy0we3ZfvzY'}
            />
            <div className="min-w-0 flex-1">
              <h5 className="text-xs font-bold text-on-surface leading-tight truncate">{user.displayName}</h5>
              <p className="font-mono text-[10px] text-on-surface-variant/60 truncate leading-snug">{user.email}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full mt-2 py-2 border border-outline-variant/30 text-on-surface-variant/60 hover:text-red-300 font-mono text-[10px] bg-surface-container-high/40 rounded-xl hover:bg-surface-container-high hover:border-red-400/40 cursor-pointer active:scale-98 transition-all"
          >
            DISCONNECT TELEMETRIC TRANSMISSION
          </button>
        </div>

        {/* Danger Zone */}
        <div className="border border-error/20 bg-error-container/5 p-5 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center gap-2 text-error">
            <span className="material-symbols-outlined text-[20px]">warning</span>
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest">DANGER ZONE</span>
          </div>
          <h4 className="text-xs font-bold text-on-error-container leading-none">Self-Destruct</h4>
          <p className="text-[11px] text-on-error-container/70 leading-relaxed">
            Permanently zero all stats, clear cosmetic purchase items, wipe sector logs, and reboot operative data state.
          </p>

          {confirmReset ? (
            <div className="flex gap-2 mt-2">
              <button
                disabled={resetting}
                onClick={executeReset}
                className="flex-1 py-3 bg-error text-on-error font-mono text-[10px] font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                {resetting ? 'WIPING SYS...' : 'CONFIRM RESET DATA'}
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-4 py-3 bg-surface-container-highest font-mono text-[10px] text-white rounded-xl cursor-pointer"
              >
                CANCEL
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setConfirmReset(true);
                onNotify('Commander, this deletes all records! Confirm once ready.', 'info');
              }}
              className="w-full mt-1 py-3 bg-red-500/10 border border-error/30 text-[#ffdad6] font-mono text-[10px] font-bold rounded-xl hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer"
            >
              RESET DATA
            </button>
          )}
        </div>
      </div>

      {/* Technical Metadata Footer */}
      <section className="pt-6 border-t border-outline-variant/20">
        <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-on-surface-variant/40 font-mono text-[9px] uppercase tracking-widest">
          <div>
            <p className="text-on-surface-variant/60 mb-0.5">Build ID</p>
            <p className="truncate">HH-2024-X9-ALPHA</p>
          </div>
          <div>
            <p className="text-on-surface-variant/60 mb-0.5">Latency</p>
            <p>12ms (Secure)</p>
          </div>
          <div>
            <p className="text-on-surface-variant/60 mb-0.5">Kernel</p>
            <p className="truncate">V8.Lumina-Core</p>
          </div>
          <div>
            <p className="text-on-surface-variant/60 mb-0.5">Session</p>
            <p>0x4F2...99BC</p>
          </div>
        </div>
      </section>
    </div>
  );
}
