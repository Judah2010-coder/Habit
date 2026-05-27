import { useState } from 'react';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface PilotAvatarSectionProps {
  user: UserProfile;
  interactive?: boolean;
}

export interface AvatarDetail {
  level: number;
  name: string;
  badge: string;
  codename: string;
  description: string;
  imageUrl: string;
  specs: string[];
  systemStatus: string;
  glowColor: string;
}

export const AVATAR_DATA: Record<number, AvatarDetail> = {
  1: {
    level: 1,
    name: 'The Broken Suit',
    badge: 'STAGE 1: CRACKED PILOT',
    codename: 'CRACKED-ALPHA-01',
    description: 'A used, dilapidated suit with visible cracks and mechanical wear. It reflects the humble beginnings of your journey, where survival is the only objective.',
    imageUrl: 'https://res.cloudinary.com/dtrzwgkjo/image/upload/v1779768444/realistic_painterly_illustration_of_a_level_1_sci_fi_astronaut_avatar._average_hy1y19.png',
    specs: ['Basic Thermo-regulation (Fragile)', 'Cracked visor overlay', 'Manual oxygen vent valves'],
    systemStatus: 'WARNING: DECOMPRESSION RISK',
    glowColor: 'shadow-red-500/15 border-red-500/20'
  },
  2: {
    level: 2,
    name: 'The Patchwork Suit',
    badge: 'STAGE 2: SCAVENGER HERO',
    codename: 'SCAVENGER-BETA-02',
    description: 'Upgraded with scavenged alien plating and metallic duct tape. It features a makeshift plasma cutter and a crude back-thruster, signaling increased capability and resourcefulness.',
    imageUrl: 'https://res.cloudinary.com/dtrzwgkjo/image/upload/v1779768446/realistic_painterly_illustration_of_a_level_2_sci_fi_astronaut_avatar._male_tywlho.png',
    specs: ['Makeshift plasma blowtorch', 'Hydrogen low-yield thrusters', 'Composite layered shielding'],
    systemStatus: 'STABLE: HYBRID SCRAP DRIVE ONLINE',
    glowColor: 'shadow-yellow-500/15 border-yellow-500/25'
  },
  3: {
    level: 3,
    name: 'The Titanium Suit',
    badge: 'STAGE 3: TITANIUM ELITE',
    codename: 'TITAN-GAMMA-03',
    description: 'A polished, streamlined titanium alloy suit with neon-blue accents. This stage includes an energy rifle, a spherical drone companion, and high-tech HUD systems for the ultimate pilot experience.',
    imageUrl: 'https://res.cloudinary.com/dtrzwgkjo/image/upload/v1779768445/realistic_painterly_illustration_of_a_level_3_sci_fi_astronaut_avatar._male_rt0rwo.png',
    specs: ['Dynamic telemetry HUD', 'Energy blaster array', 'Autonomous drone buddy'],
    systemStatus: 'ADVANCED: SYSTEM OVERDRIVE PREPARED',
    glowColor: 'shadow-blue-500/20 border-primary/30'
  }
};

export default function PilotAvatarSection({ user, interactive = true }: PilotAvatarSectionProps) {
  // Determine real pilot level
  const realLevel = Math.max(1, Math.floor(user.xp / 150));
  
  // State to support previewing other levels
  const [selectedLevel, setSelectedLevel] = useState<number>(realLevel);
  const [isDarkMatterActive, setIsDarkMatterActive] = useState(false);

  // Get active rendering data
  // If preview level is higher than 3, fallback to 3 avatar parameters
  const avatarLevel = selectedLevel > 3 ? 3 : selectedLevel;
  const data = AVATAR_DATA[avatarLevel as 1 | 2 | 3] || AVATAR_DATA[3];

  const handleTogglePreview = (lvl: number) => {
    setSelectedLevel(lvl);
    if (lvl < 4) {
      setIsDarkMatterActive(false);
    } else {
      setIsDarkMatterActive(true);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 border border-primary/20 bg-primary/[0.02] space-y-4 overflow-hidden relative">
      {/* Aesthetic Cyber Decals */}
      <div className="absolute top-0 right-0 p-1 bg-primary/10 rounded-bl font-mono text-[8px] uppercase tracking-wider text-primary select-none z-10">
        PILOT DESIGNATION MATRIX
      </div>

      {/* Header section */}
      <div className="flex justify-between items-center border-b border-primary/10 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base animate-pulse">person_pin</span>
          <span className="font-mono text-[10px] text-primary font-bold uppercase tracking-wider">
            COCKPIT SUIT BIOMETRICS
          </span>
        </div>
        {selectedLevel !== realLevel && (
          <button 
            onClick={() => handleTogglePreview(realLevel)}
            className="font-mono text-[8px] px-1.5 py-0.5 bg-primary/20 text-primary rounded border border-primary/40 hover:bg-primary/30 transition-all uppercase cursor-pointer"
          >
            Reset to Level {realLevel} Status
          </button>
        )}
      </div>

      {/* Main Grid: Visual Art + Core Specs */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Avatar Art Showcase Container */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <div className={`relative w-36 h-36 rounded-full overflow-hidden border-2 bg-black/60 shadow-lg transition-all duration-500 ${data.glowColor} ${
            isDarkMatterActive ? 'shadow-purple-500/40 border-purple-500/60 ring-2 ring-purple-500/20' : ''
          }`}>
            <AnimatePresence mode="wait">
              <motion.img
                key={isDarkMatterActive ? 'lvl4' : selectedLevel}
                alt={data.name}
                referrerPolicy="no-referrer"
                src={data.imageUrl}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.25 }}
                className={`w-full h-full object-cover transition-all duration-700 ${
                  isDarkMatterActive 
                    ? 'hue-rotate-[190deg] brightness-[0.75] contrast-[1.25] saturate-[1.3]' 
                    : ''
                }`}
              />
            </AnimatePresence>

            {/* Glowing HUD/Overlay scanning line */}
            <div className="absolute inset-x-0 h-0.5 bg-cyan-400/50 blur-[1px] animate-pulse pointer-events-none top-1/2"></div>
            
            {/* Dark matter infusion particle overlay */}
            {isDarkMatterActive && (
              <div className="absolute inset-0 bg-gradient-to-t from-purple-950/40 via-transparent to-transparent pointer-events-none animate-pulse">
                <div className="absolute inset-0 bg-purple-500/10 blend-overlay"></div>
              </div>
            )}
          </div>

          <div className="mt-2 text-center">
            <span className={`font-mono text-[9px] font-bold tracking-widest block uppercase ${
              isDarkMatterActive ? 'text-purple-400' : 'text-primary'
            }`}>
              {isDarkMatterActive ? 'STAGE 4: DARK-MATTER EVOLUTION' : data.badge}
            </span>
            <span className="font-mono text-[8px] text-on-surface-variant/50 uppercase select-text">
              {isDarkMatterActive ? 'VOID-INFUSED-04' : data.codename}
            </span>
          </div>
        </div>

        {/* Narrative & Mechanical Specifications */}
        <div className="md:col-span-7 space-y-3">
          <div>
            <h4 className="font-display text-sm font-black text-on-surface uppercase flex items-center gap-1.5">
              <span>{isDarkMatterActive ? 'Level 4: Dark-Matter Evolution' : data.name}</span>
              {realLevel >= selectedLevel ? (
                <span className="material-symbols-outlined text-[14px] text-green-400" title="Unlocked & Synced">verified</span>
              ) : (
                <span className="px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[7px] font-bold uppercase tracking-wide">SIMULATED PREVIEW</span>
              )}
            </h4>
            <p className="text-[10.5px] text-on-surface-variant leading-relaxed font-sans mt-1 select-text">
              {isDarkMatterActive 
                ? 'Infused with exotic void particles, granting hyper-dimensional stealth and zero-friction orbit maneuvers. Resonates with a dark violet cosmic shimmer.' 
                : data.description}
            </p>
          </div>

          {/* Core Perks specs */}
          <div className="p-2.5 bg-surface-container rounded-xl border border-outline-variant/30 space-y-1.5">
            <span className="font-mono text-[8px] text-on-surface-variant/80 uppercase block tracking-wider font-bold">
              🛡️ SUIT MODULE PERKS
            </span>
            <ul className="space-y-1 list-none pl-0">
              {(isDarkMatterActive 
                ? ['Void Stealth Particle Cloaking', 'Dimensional Zero-Friction Shielding', 'Active Dark-Matter Plasma Thruster'] 
                : data.specs
              ).map((spec, i) => (
                <li key={i} className="text-[9.5px] font-mono text-[#adc6ff] flex items-center gap-1.5 select-text">
                  <span className="w-1 h-1 bg-secondary rounded-full"></span>
                  <span>{spec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Status Gauge */}
          <div className="flex items-center justify-between">
            <span className={`font-mono text-[8px] font-bold uppercase tracking-wider ${
              isDarkMatterActive ? 'text-purple-400' : 'text-on-surface-variant'
            }`}>
              {isDarkMatterActive ? 'SHIELD RESISTANCE: MAX OVERLOAD' : data.systemStatus}
            </span>
            <span className="font-mono text-[8px] text-on-surface-variant/40">CALIBRATING...</span>
          </div>
        </div>
      </div>

      {/* Manual interactive simulator block */}
      {interactive && (
        <div className="border-t border-primary/10 pt-3 space-y-2">
          <span className="font-mono text-[8px] text-on-surface-variant/70 uppercase tracking-widest block font-bold">
            🕹️ COCKPIT SUIT SIMULATOR (SYSTEMS DIAGNOSTIC DEVIATION)
          </span>
          <div className="grid grid-cols-4 gap-1.5 font-mono text-[9px]">
            <button
              onClick={() => handleTogglePreview(1)}
              className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                selectedLevel === 1 
                  ? 'bg-red-500/10 text-red-300 border-red-500/40 font-bold' 
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container'
              }`}
            >
              LVL 1
            </button>
            <button
              onClick={() => handleTogglePreview(2)}
              className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                selectedLevel === 2 
                  ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/40 font-bold' 
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container'
              }`}
            >
              LVL 2
            </button>
            <button
              onClick={() => handleTogglePreview(3)}
              className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                selectedLevel === 3 
                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/40 font-bold' 
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container'
              }`}
            >
              LVL 3
            </button>
            <button
              onClick={() => handleTogglePreview(4)}
              className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                selectedLevel === 4 
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/40 font-bold' 
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container hover:text-purple-300'
              }`}
            >
              LVL 4 ⚡
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
