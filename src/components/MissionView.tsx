import { UserProfile, UserThreat } from '../types';
import { motion } from 'motion/react';
import { useState } from 'react';

interface MissionViewProps {
  user: UserProfile;
  threats: UserThreat[];
  onUnlockThreat: (threatId: string) => Promise<void>;
  onEngageThreat: (threatId: string) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  loadingAction: string | null;
}

export default function MissionView({
  user,
  threats,
  onUnlockThreat,
  onEngageThreat,
  onNotify,
  loadingAction,
}: MissionViewProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleUnlock = async (threat: UserThreat) => {
    if (loadingAction || user.xp < threat.xpUnlockRequirement) return;
    setLoadingId(threat.id);
    try {
      await onUnlockThreat(threat.id);
    } catch (e) {
      onNotify('Failed to unlock threat level due to database error.', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-gradient-to-r from-primary/50 to-transparent pb-4">
        <h2 className="font-display text-2xl font-bold text-primary uppercase tracking-widest flex items-center gap-2">
          Mission Intelligence
          <span className="w-2.5 h-2.5 bg-error rounded-full animate-pulse"></span>
        </h2>
        <p className="font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mt-1">
          THREAT LEVEL: CRITICAL | COMMANDER CLEARANCE REQUIRED
        </p>
      </div>

      {/* Mission Grid list */}
      <div className="space-y-4">
        {threats.map((threat) => {
          const isScavenger = threat.id === 'scavenger_swarm';
          const isVoid = threat.id === 'void_stalker';
          const canUnlock = user.xp >= threat.xpUnlockRequirement;

          // Star ratings representing levels or difficulty
          const difficultyRanks = isScavenger ? 2 : isVoid ? 4 : 5;

          return (
            <div
              key={threat.id}
              className={`glass-card relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 ${
                threat.unlocked
                  ? 'border-primary/20 hover:border-primary/40'
                  : 'opacity-70 border-outline-variant/20'
              }`}
            >
              {threat.unlocked && <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>}
              
              <div className="flex justify-between items-start gap-4 mb-3">
                <div>
                  <h3
                    className={`font-display text-lg font-bold uppercase ${
                      threat.unlocked ? 'text-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    {threat.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="font-mono text-[9px] text-on-surface-variant uppercase">DIFFICULTY:</span>
                    <div className="flex gap-1 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-3.5 h-1 rounded-full ${
                            i < difficultyRanks
                              ? threat.unlocked
                                ? 'bg-secondary'
                                : 'bg-outline'
                              : 'bg-outline-variant/30'
                          }`}
                        ></span>
                      ))}
                    </div>
                  </div>
                </div>

                {threat.defeated ? (
                  <span className="bg-green-500/10 text-green-300 border border-green-500/30 px-3 py-1 rounded-full font-mono text-[10px]">
                    ELIMINATED
                  </span>
                ) : threat.unlocked ? (
                  <span className="bg-primary/20 text-primary border border-primary/40 px-3 py-1 rounded-full font-mono text-[10px] animate-pulse">
                    READY TO ENGAGE
                  </span>
                ) : (
                  <span className="bg-outline-variant/20 text-outline border border-outline-variant/30 px-3 py-1 rounded-full font-mono text-[10px]">
                    LOCKED
                  </span>
                )}
              </div>

              {/* Main thumbnail description */}
              <div className="flex gap-4 items-center my-4">
                <div className="w-20 h-20 bg-surface-container-lowest rounded-xl border border-outline-variant/20 flex items-center justify-center shrink-0 relative overflow-hidden">
                  <img
                    alt={threat.name}
                    className={`w-full h-full object-cover opacity-80 ${!threat.unlocked && 'grayscale opacity-30 blur-[0.5px]'}`}
                    src={
                      isScavenger
                        ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRrrYQTaXLNerKIdh-9H5xgzRlI-UOmyQyLosA5MZYTMKkFKmIHp4Y8xt6F-V9FeDIrvQvszWTy2PK2CDTFZOzprFi2ThbsmCB_mCMaM70p-KABvAHeCXb5pgNY8f9VKBnl7QipqPcb7sfTuLoZlp9OTJaA7tP4gPE2PPts0MSmRzhhWU6YxpdcrNVMakCNDMNBaISXT4vF968h9g5QpMNqK-FlBVBCT9iSQ54EFZfYYwsvjHxwGVcjNeTT45pF_NOzVVyLqlynBA'
                        : isVoid
                        ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBl-hvxfiHF_mQxYvEJqZ_KT1QshSiC0c_NU-s9tBNg_StA4dO4TLUdjrde3j52tvS8IvU6Pv5CsFUDYJT6NcZ60fEnCvIvtHEUR8eGyYx_eo3nCHrtTluPy03pqQKlGOlrIVwqyXAPV--Td5UkAFbGVIpfApz6i_OhsV_Ljhe6dG_nCXopEpfCJeYf4uYdYows8GXWrr6pa7bROUuyiKnwCKcz1wTJM6rdyKaIPMHypH2owb92NKQpnhPJVVygEBb_pDKaBXecRVg'
                        : 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUPhQ4If1FdAS_stNEQk2LLZpSVPTtgKJ41M6oi3FJSz5G0T4ZoDSaPAPYLjOmBDrHlIX7i8b7wmEHf2sYsJoZkjwnrMOfr2H3yyRAUT4zgpY3ajTLEc9_R8J7Snm0UgBkMlVHdoHhIawZsT2u6Y-tXfKWKWkOac5KqZwtGk-DZo17nSOebybPH690xnam0pmMEgOuWy5O5BodqraBgctAJX4C2n5bqpORQhCYDK3-XIuq2kTFXGmWdEeE16x_TtubZjluIPUsYaQ'
                    }
                  />
                  {!threat.unlocked && (
                    <span className="material-symbols-outlined absolute text-outline text-2xl z-10">lock</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] text-error uppercase font-bold tracking-wider mb-0.5">
                    Attack:{' '}
                    {isScavenger
                      ? 'System Sabotage'
                      : isVoid
                      ? 'Total Blackout'
                      : 'Spacetime Fracture'}
                  </p>
                  <p className="text-[11px] text-on-surface-variant/85 leading-tight">
                    {isScavenger
                      ? 'Locks access to Shop and XP processing until eliminated.'
                      : isVoid
                      ? 'Causes UI distortion and a persistent 15% coin penalty on all actions.'
                      : 'Triggers habit streak decay and scrambles active mission objectives.'}
                  </p>
                </div>
              </div>

              {/* Engage/Unlock Button */}
              {threat.unlocked ? (
                <button
                  onClick={() => onEngageThreat(threat.id)}
                  className="w-full mt-4 bg-primary-container text-primary font-display text-xs font-bold py-3 rounded-xl border border-primary/30 hover:bg-primary hover:text-primary-container active:scale-95 duration-100 ease-in-out transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">rocket_launch</span>
                  ENGAGE ENTITY &amp; LOCK TRANSMISSION
                </button>
              ) : (
                <button
                  onClick={() => handleUnlock(threat)}
                  disabled={!!loadingAction || !canUnlock}
                  className={`w-full mt-4 font-mono text-xs py-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all duration-150 select-none ${
                    canUnlock
                      ? 'bg-secondary/15 text-secondary border-secondary/40 hover:bg-secondary/25 cursor-pointer active:scale-95'
                      : 'bg-surface-container-highest/40 text-on-surface-variant/40 border-dashed border-outline-variant/40 cursor-not-allowed'
                  }`}
                >
                  {loadingId === threat.id ? (
                    <div className="w-4 h-4 rounded-full border-2 border-secondary border-t-transparent animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xs">lock_open</span>
                      {canUnlock
                        ? `UNLOCK THREAT MODULE`
                        : `REQUIRES: ${threat.xpUnlockRequirement} XP TO UNLOCK`}
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
