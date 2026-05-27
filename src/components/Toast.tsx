import { useEffect } from 'react';
import { motion } from 'motion/react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgStyle =
    type === 'success'
      ? 'from-[#adc6ff]/20 to-[#8BE9FD]/10 border-[#8BE9FD]/40 text-[#8BE9FD]'
      : type === 'error'
      ? 'from-[#93000a]/30 to-[#121317]/80 border-[#ffb4ab]/40 text-[#ffb4ab]'
      : 'from-[#cbade2]/20 to-[#121317]/80 border-[#d9bbf1]/40 text-[#d9bbf1]';

  const iconName = type === 'success' ? 'verified' : type === 'error' ? 'error_medial' : 'info';

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-55 w-11/12 max-w-xs pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: -15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`bg-gradient-to-r ${bgStyle} backdrop-blur-md border px-4 py-3 rounded-xl shadow-[0_0_15px_rgba(139,233,253,0.15)] flex items-center gap-3`}
      >
        <span className="material-symbols-outlined text-lg animate-pulse">{iconName}</span>
        <p className="font-mono text-xs tracking-tight leading-snug">{message}</p>
      </motion.div>
    </div>
  );
}
