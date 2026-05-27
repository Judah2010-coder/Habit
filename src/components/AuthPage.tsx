import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useState } from 'react';
import { motion } from 'motion/react';

interface AuthPageProps {
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function AuthPage({ onNotify }: AuthPageProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onNotify('Neural uplink established successfully!', 'success');
    } catch (error) {
      console.error(error);
      onNotify('Uplink failed. Please ensure Firebase has been configured.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#0d0e11] text-[#e3e2e7] relative overflow-hidden px-margin py-stack-lg">
      {/* Decorative starry / grid background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]"></div>
        <div className="absolute top-10 left-10 w-2 h-2 rounded-full bg-white opacity-40 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-3 h-3 rounded-full bg-secondary opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-primary opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="grain-overlay"></div>

      {/* Top logo */}
      <header className="flex justify-between items-center w-full max-w-md mx-auto pt-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#adc6ff] text-2xl">rocket_launch</span>
          <span className="font-display font-medium text-xs tracking-[0.25em] text-[#adc6ff] uppercase">SYSTEMS ONLINE</span>
        </div>
        <span className="font-mono text-[10px] text-on-surface-variant/40">KRNL v8.12</span>
      </header>

      {/* Main heroic portal */}
      <main className="w-full max-w-md mx-auto my-auto flex flex-col items-center text-center relative z-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative w-28 h-28 rounded-full border border-primary/20 bg-primary-container/25 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(173,198,255,0.05)]"
        >
          <img
            alt="Commander Portrait"
            className="w-24 h-24 rounded-full border-2 border-primary bg-primary-container object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRJYmscQRERwAQVhluJUggfF6G3OepWySjsMd3niVk9O14O3XinAvuSIYcP_2fH0gOgrSOkNpj_8NVAlTG0LzILvipge6M9jrZd5ZwjKQxeaAkkzXU4O-VjFrxaWPYjYJefS6M3DbXf1_Im0IpijJspOsOUXi6GxO-cFajuUkSC8m0dvRso2CXt4SNN8AhPV9WCrRoRhfy1iUS8j1CgMWaXsBDqe8gwvGEp-wja4v_3Iqgk-STVC6U6cvIrMU-W10-vy0we3ZfvzY"
          />
          <div className="absolute -bottom-1 -right-1 bg-secondary text-on-secondary-container text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-background">
            NEW
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="font-display text-4xl font-bold text-primary tracking-tight uppercase leading-none mb-3"
        >
          Habit Hustle
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="font-mono text-xs text-on-surface-variant/70 tracking-widest uppercase mb-10 max-w-xs"
        >
          DEEP SPACE OPERATIVE DIRECTORY
        </motion.p>

        <motion.div
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full px-4"
        >
          <div className="glass-card p-6 rounded-2xl border border-outline-variant/30 mb-6 text-left shadow-xl">
            <h3 className="font-display font-medium text-sm text-primary mb-2">OPERATIONAL PARAMETERS</h3>
            <p className="text-xs text-on-surface-variant/80 leading-relaxed">
              Log into your ship systems to track tasks, engage mechanical swarms in the Arena, claim space upgrades at the Shop, and synchronize your data with the cloud.
            </p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-primary text-on-primary font-display font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-3 transition-all hover:brightness-110 active:scale-95 duration-100 ease-in-out cursor-pointer shadow-[0_0_20px_rgba(173,198,255,0.2)] disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 rounded-full border-2 border-on-primary border-t-transparent animate-spin"></span>
            ) : (
              <>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.86-3.577-7.86-8s3.53-8 7.86-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.102C18.29 2.05 15.49 1 12.24 1c-6.075 0-11 4.925-11 11s4.925 11 11 11c6.34 0 10.55-4.43 10.55-10.715 0-.725-.075-1.275-.175-1.715H12.24z" />
                </svg>
                ENGAGE NEURAL INTERFACE
              </>
            )}
          </button>
        </motion.div>
      </main>

      {/* Footer info */}
      <footer className="w-full max-w-md mx-auto text-center relative z-10 text-[10px] font-mono text-on-surface-variant/40 mt-10">
        SECURE FIREBASE ENCRYPTION CONNECTED &bull; AES-256
      </footer>
    </div>
  );
}
