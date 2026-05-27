import { UserProfile, ShopItem } from '../types';
import { SHOP_ITEMS } from '../shopData';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ShopViewProps {
  user: UserProfile;
  onPurchaseItem: (itemId: string, price: number) => Promise<void>;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  loadingAction: string | null;
}

export default function ShopView({ user, onPurchaseItem, onNotify, loadingAction }: ShopViewProps) {
  const [shakingId, setShakingId] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const handlePurchase = async (item: ShopItem) => {
    if (loadingAction) return;

    const alreadyPurchased = user.purchasedItems?.includes(item.id);
    if (alreadyPurchased) {
      onNotify(`'${item.name}' is already equipped on your ship systems.`, 'info');
      return;
    }

    if (item.priceType === 'crystals' && user.crystals < item.price) {
      // Trigger local shake animation on this specific card
      setShakingId(item.id);
      onNotify(`Insufficient balance. Requires ${item.price} Crystals!`, 'error');
      setTimeout(() => {
        setShakingId(null);
      }, 600);
      return;
    }

    setBuyingId(item.id);
    try {
      await onPurchaseItem(item.id, item.price);
    } catch (e) {
      onNotify('Failed to complete orbital drop transaction.', 'error');
    } finally {
      setBuyingId(null);
    }
  };

  const shipItems = SHOP_ITEMS.filter((i) => i.category === 'ship');
  const avatarItems = SHOP_ITEMS.filter((i) => i.category === 'avatar');
  const communityItems = SHOP_ITEMS.filter((i) => i.category === 'community');

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="mb-4">
        <h2 className="font-display text-xl font-bold text-primary mb-1 uppercase tracking-wide">QUARTERMASTER</h2>
        <div className="h-[2px] w-24 bg-gradient-to-r from-primary to-transparent rounded-full"></div>
        <p className="font-mono text-[9px] text-[#e3e2e7]/70 uppercase tracking-widest mt-2">
          Orbital Supply Drop Available
        </p>
      </div>

      {/* Grid: Ship Enhancements */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-secondary text-sm">rocket_launch</span>
          <h3 className="font-mono text-xs text-secondary uppercase tracking-widest font-semibold">SHIP ENHANCEMENTS</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {shipItems.map((item) => {
            const purchased = user.purchasedItems?.includes(item.id);
            const isShaking = shakingId === item.id;
            const isBuying = buyingId === item.id;

            return (
              <div
                key={item.id}
                className={`glass-card p-4 rounded-2xl relative overflow-hidden flex flex-col gap-3 transition-all duration-300 border ${
                  purchased
                    ? 'border-green-500/20 bg-green-500/[0.02]'
                    : isShaking
                    ? 'shake-animation border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                    : 'border-outline-variant/20 hover:border-primary/20'
                }`}
              >
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-[#0d0e11] border border-outline-variant/30 flex items-center justify-center relative">
                  <img
                    alt={item.name}
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                      !purchased ? 'grayscale opacity-50 backdrop-blur-sm' : 'hover:scale-105 opacity-90'
                    }`}
                    src={item.imageUrl}
                  />
                  {!purchased && (
                    <div className="absolute inset-0 bg-[#121317]/70 flex flex-col items-center justify-center backdrop-blur-[1px]">
                      <span className="material-symbols-outlined text-error text-3xl mb-1 animate-pulse">lock</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-display text-sm font-bold text-on-surface">{item.name}</h4>
                    <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">
                      {item.detailText}
                    </p>
                    <p className="text-[11px] text-on-surface-variant/80 mt-1">{item.description}</p>
                  </div>
                </div>

                <button
                  disabled={isBuying || !!loadingAction}
                  onClick={() => handlePurchase(item)}
                  className={`w-full mt-2 py-3 px-4 rounded-xl flex items-center justify-between font-mono text-[11px] transition-all cursor-pointer ${
                    purchased
                      ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                      : 'bg-surface-container-highest border border-outline-variant text-on-surface-variant hover:bg-surface-container-high hover:text-white'
                  }`}
                >
                  <span>{purchased ? 'COMMISSIONED' : isBuying ? 'PROVISIONING...' : 'ENROLL PROTOCOL'}</span>
                  {!purchased && (
                    <div className="flex items-center gap-1 shrink-0 font-bold text-primary">
                      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>token</span>
                      <span>{item.price}</span>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Avatar Cosmetics */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-secondary text-sm">person_pin</span>
          <h3 className="font-mono text-xs text-secondary uppercase tracking-widest font-semibold font-display">AVATAR COSMETICS</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {avatarItems.map((item) => {
            const purchased = user.purchasedItems?.includes(item.id);
            const isShaking = shakingId === item.id;
            const isBuying = buyingId === item.id;

            return (
              <div
                key={item.id}
                className={`glass-card p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden transition-all duration-300 border ${
                  purchased
                    ? 'border-green-500/20 bg-green-500/[0.02]'
                    : isShaking
                    ? 'shake-animation border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                    : 'border-outline-variant/20 hover:border-primary/20'
                }`}
              >
                <div className="w-20 h-20 hexagon-shape bg-surface-container-highest flex items-center justify-center border border-outline-variant shrink-0 relative">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/60">
                    {item.icon}
                  </span>
                  {!purchased && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#121317]/60">
                      <span className="material-symbols-outlined text-error text-sm">lock</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-xs font-bold text-on-surface truncate">{item.name}</h4>
                  <p className="text-[11px] text-on-surface-variant/80 mt-0.5 leading-snug">{item.description}</p>
                  
                  <button
                    disabled={isBuying || !!loadingAction}
                    onClick={() => handlePurchase(item)}
                    className={`mt-3 px-4 py-2 rounded-xl flex items-center gap-2 font-mono text-[10px] transition-all cursor-pointer ${
                      purchased
                        ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                        : 'bg-surface-container-high border border-outline-variant text-[#e3e2e7] hover:bg-surface-container hover:border-primary/20'
                    }`}
                  >
                    {purchased ? (
                      'ACQUIRED'
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>token</span>
                        <span>{item.price} CRYSTALS</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Claim Free & Communities drop */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary text-sm">stars</span>
          <h3 className="font-mono text-xs text-primary uppercase tracking-widest font-semibold">COMMUNITY DROPS</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {communityItems.map((item) => {
            const purchased = user.purchasedItems?.includes(item.id);
            const isShaking = shakingId === item.id;
            const isBuying = buyingId === item.id;
            const isFree = item.priceType === 'free';

            return (
              <div
                key={item.id}
                className={`glass-card p-5 rounded-2xl relative overflow-hidden transition-all duration-300 border ${
                  purchased
                    ? 'border-green-500/20 bg-green-500/[0.02]'
                    : isShaking
                    ? 'shake-animation border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                    : isFree
                    ? 'border-primary/30 shadow-[0_0_15px_rgba(173,198,255,0.03)]'
                    : 'border-outline-variant/20 hover:border-primary/20'
                }`}
              >
                {isFree && <div className="absolute inset-0 bg-primary/2 opacity-[0.03] pointer-events-none shimmer"></div>}

                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2.5 rounded-xl border ${isFree ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface-container-highest/60 border-outline-variant text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  </div>
                  {isFree && (
                    <span className="bg-primary text-primary-container font-mono text-[9px] font-bold px-2 py-0.5 rounded-full">
                      NEW FREE drop
                    </span>
                  )}
                </div>

                <h4 className="font-display text-xs font-bold text-on-surface">{item.name}</h4>
                <p className="text-[11px] text-on-surface-variant/80 mt-1 mb-4 leading-relaxed">{item.description}</p>

                <button
                  disabled={isBuying || !!loadingAction}
                  onClick={() => handlePurchase(item)}
                  className={`w-full py-3 rounded-xl font-bold font-mono text-[11px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    purchased
                      ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                      : isFree
                      ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(173,198,255,0.35)] hover:bg-[#c3d7ff]'
                      : 'bg-surface-container-highest border border-outline-variant text-[#e3e2e7] hover:bg-surface-container-high'
                  }`}
                >
                  {purchased ? (
                    'UNLOCKED'
                  ) : isBuying ? (
                    'PROCESSING DROP...'
                  ) : isFree ? (
                    'CLAIM FOR FREE'
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>token</span>
                      <span>CLAIM PROTOCOL ({item.price} CRYSTALS)</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
