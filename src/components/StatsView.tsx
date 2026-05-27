import { UserProfile, UserHabit } from '../types';
import { motion } from 'motion/react';
import PilotAvatarSection from './PilotAvatarSection';

interface StatsViewProps {
  user: UserProfile;
  habits: UserHabit[];
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onLevelUp?: () => Promise<void>;
  loadingAction?: string | null;
}

export default function StatsView({
  user,
  habits,
  onNotify,
  onLevelUp,
  loadingAction,
}: StatsViewProps) {
  // Let's calculate the XP chart based on real completion or mock values so we have a responsive chart
  // Days of the week height percentages
  const chartDays = [
    { day: 'M', height: '40%', xp: 120 },
    { day: 'T', height: '65%', xp: 180 },
    { day: 'W', height: '30%', xp: 90 },
    { day: 'T', height: '85%', xp: 240 },
    { day: 'F', height: '55%', xp: 160 },
    { day: 'S', height: '100%', xp: 300, highlighted: true },
    { day: 'S', height: '15%', xp: 40, offline: true },
  ];

  return (
    <div className="space-y-6">
      {/* Pilot Profile & Suit Level Avatar */}
      <PilotAvatarSection user={user} />

      {/* 7-Day XP Chart Section */}
      <section>
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-on-surface uppercase tracking-wide">Weekly Output</h2>
            <p className="text-xs text-on-surface-variant/70 font-mono">Performance metrics overview</p>
          </div>
          <div className="text-right">
            <span className="font-mono text-[9px] tracking-widest text-on-surface-variant uppercase block">CURRENT SESSION</span>
            <span className="font-mono text-xs text-secondary uppercase font-semibold">DEEP SPACE OPS</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-end justify-between h-48 border border-outline-variant/20 relative overflow-hidden">
          {/* Subtle grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between p-5 pointer-events-none opacity-10">
            <div className="border-b border-white w-full"></div>
            <div className="border-b border-white w-full"></div>
            <div className="border-b border-white w-full"></div>
            <div className="border-b border-white w-full"></div>
          </div>

          {/* XP Bars */}
          {chartDays.map((d, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2 relative z-10">
              <div
                className={`w-full max-w-[24px] rounded-t-sm relative transition-all duration-500 hover:scale-y-105 ${
                  d.highlighted
                    ? 'border-2 border-secondary h-full glow-accent'
                    : d.offline
                    ? 'opacity-30 bg-surface-container-highest'
                    : 'bg-primary/20'
                }`}
                style={{ height: d.height, minHeight: '8px' }}
                title={`${d.xp} XP`}
              >
                {/* Active scan line for high energy days */}
                {d.highlighted ? (
                  <div className="absolute inset-0 bg-[#8BE9FD] opacity-100 glow-accent overflow-hidden rounded-t-sm">
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/40 to-transparent animate-pulse"></div>
                  </div>
                ) : d.offline ? (
                  <div className="h-full bg-surface-container-highest rounded-t-sm"></div>
                ) : (
                  <div className="absolute inset-0 bg-[#8BE9FD] opacity-80 rounded-t-sm"></div>
                )}
                <div className="absolute inset-0 xp-bar-scanner opacity-40"></div>
              </div>
              <span
                className={`font-mono text-[10px] ${
                  d.highlighted ? 'text-secondary font-bold' : 'text-on-surface-variant'
                }`}
              >
                {d.day}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Records Bento Grid */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          <h2 className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">MISSION ARCHIVE</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-primary/40 transition-colors">
            <span className="material-symbols-outlined absolute -right-2 -top-2 text-[#adc6ff]/5 text-7xl rotate-12 transition-transform duration-500 group-hover:rotate-45 pointer-events-none">
              rocket_launch
            </span>
            <span className="font-mono text-[11px] text-on-surface-variant/80 uppercase">Total XP</span>
            <span className="font-display text-4xl font-bold text-primary tracking-tight">{user.xp}</span>
          </div>

          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-[#d9bbf1]/40 transition-colors">
            <span className="material-symbols-outlined absolute -right-2 -top-2 text-[#d9bbf1]/5 text-7xl -rotate-12 transition-transform duration-500 group-hover:-rotate-45 pointer-events-none" style={{ fontVariationSettings: "'FILL' 1" }}>
              diamond
            </span>
            <span className="font-mono text-[11px] text-on-surface-variant/80 uppercase tracking-widest">Crystals</span>
            <span className="font-display text-4xl font-bold text-secondary tracking-tight">{user.crystals}</span>
          </div>

          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-32 border-l-4 border-l-tertiary hover:border-r hover:border-r-tertiary/10 transition-all">
            <span className="font-mono text-[11px] text-on-surface-variant/80 uppercase font-semibold">Perfect Days</span>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold text-[#ffb597]">{user.perfectDays}</span>
              <span className="font-mono text-[10px] text-on-surface-variant uppercase">CYCLES</span>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-32 bg-primary-container/10 border border-primary/25 hover:bg-primary-container/20 transition-colors">
            <span className="font-mono text-[11px] text-on-surface-variant/80 uppercase font-semibold">Best Streak</span>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold text-on-primary-container">{user.bestStreak}</span>
              <span className="font-mono text-[10px] text-on-primary-container uppercase">DAYS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Per-habit Streak Cards */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d9bbf1] animate-pulse"></span>
            <h2 className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">OPERATIONAL STREAKS</h2>
          </div>
          <span className="font-mono text-[11px] text-secondary">ACTIVE PROTOCOLS</span>
        </div>

        <div className="space-y-3">
          {habits.map((habit) => {
            const isMind = habit.category === 'mind';
            const isSkill = habit.category === 'skill';
            
            // Category styles
            const accentColor = isMind ? 'primary' : isSkill ? 'secondary' : 'tertiary';
            const accentHex = isMind ? '#adc6ff' : isSkill ? '#d9bbf1' : '#ffb597';
            const icon = isMind ? 'self_improvement' : isSkill ? 'menu_book' : 'fitness_center';
            const progressPct = Math.min(100, Math.round((habit.streak / Math.max(1, habit.highStreak)) * 100));

            return (
              <div
                key={habit.id}
                onClick={() => onNotify(`'${habit.name}' is registered with a high streak of ${habit.highStreak} days!`, 'info')}
                className="glass-card p-4 rounded-2xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] active:scale-95 duration-100 ease-in-out transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 hexagon-shape flex items-center justify-center border transition-all"
                    style={{
                      backgroundColor: `${accentHex}10`,
                      borderColor: `${accentHex}30`
                    }}
                  >
                    <span className="material-symbols-outlined text-sm" style={{ color: accentHex }}>
                      {icon}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors">
                      {habit.name}
                    </h3>
                    <p className="font-mono text-[10px] text-on-surface-variant/80">
                      Current: {habit.streak} Days | High: {habit.highStreak}
                    </p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className="flex items-center gap-1" style={{ color: accentHex }}>
                    <span className="font-mono text-xs font-bold">{habit.streak}</span>
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      local_fire_department
                    </span>
                  </div>
                  {/* Streak Progress indicator */}
                  <div className="h-1 w-16 bg-surface-container-highest rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${progressPct}%`, backgroundColor: accentHex }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Admiral Level Up Override Controls */}
      {onLevelUp && (
        <section className="mt-8 border-t border-outline-variant/25 pt-6">
          <div className="glass-card p-5 rounded-2xl border border-secondary/35 bg-secondary/[0.03] space-y-4">
            <div className="flex justify-between items-center border-b border-secondary/15 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary animate-pulse text-lg">admin_panel_settings</span>
                <span className="font-mono text-[10px] text-secondary font-bold uppercase tracking-wider">
                  ADMIRAL COCKPIT OVERRIDE
                </span>
              </div>
              <span className="font-mono text-[9px] text-[#adc6ff]/50">SECURE SHELL</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-on-surface-variant uppercase block">Current Command Level</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display text-3xl font-black text-secondary select-text">
                    LVL {Math.max(1, Math.floor(user.xp / 150))}
                  </span>
                  <span className="font-mono text-[9px] text-on-surface-variant/60 uppercase">
                    ({150 - (user.xp % 150)} XP to next standard level)
                  </span>
                </div>
              </div>
              <div className="h-10 w-10 hexagon-shape bg-secondary/15 border border-secondary/35 flex items-center justify-center text-secondary glow-accent">
                <span className="material-symbols-outlined text-sm">verified</span>
              </div>
            </div>

            <p className="text-[10.5px] text-on-surface-variant font-sans leading-relaxed">
              By order of Space Command Fleet, this override terminal bypasses standard neural sync thresholds to immediately authorize promotions and allocate security clearances at the next orbital plane.
            </p>

            <button
              onClick={onLevelUp}
              disabled={loadingAction === 'level_up'}
              className="w-full h-11 bg-secondary text-surface font-display text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-secondary-container hover:text-on-secondary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loadingAction === 'level_up' ? (
                <div className="w-4 h-4 rounded-full border-2 border-surface border-t-transparent animate-spin"></div>
              ) : (
                <>
                  <span>FORCE PROTOCOL ADVANCE</span>
                  <span className="material-symbols-outlined text-sm">upgrade</span>
                </>
              )}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
