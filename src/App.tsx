import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  writeBatch,
  getDoc,
  getDocFromServer,
} from 'firebase/firestore';
import { auth, db, OperationType, handleFirestoreError } from './firebase';
import { UserProfile, UserHabit, UserThreat, UserLog } from './types';

// Importing Tab Components
import ArenaView from './components/ArenaView';
import StatsView from './components/StatsView';
import ShopView from './components/ShopView';
import MissionView from './components/MissionView';
import LogView from './components/LogView';
import AuthPage from './components/AuthPage';
import Toast from './components/Toast';

import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Firestore collections states bound to active auth user
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [habits, setHabits] = useState<UserHabit[]>([]);
  const [threats, setThreats] = useState<UserThreat[]>([]);
  const [logs, setLogs] = useState<UserLog[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'arena' | 'stats' | 'shop' | 'mission' | 'log'>('stats');

  // Popup toasts management
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const onNotify = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
  };

  // Test database connection at startup as requested by skill
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Listen to Firestore Dark / Light Mode preference to update body class!
  useEffect(() => {
    if (userProfile?.visualMode === 'light') {
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light');
    } else {
      document.documentElement.classList.add('dark');
      document.body.classList.remove('light');
    }
  }, [userProfile?.visualMode]);

  // Auth changed monitoring
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setCurrentUser(u);
      setLoadingAuth(false);
      if (u) {
        // Bootstrap and load users data
        await bootstrapUserRecord(u);
      } else {
        // Clear states
        setUserProfile(null);
        setHabits([]);
        setThreats([]);
        setLogs([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscriptions to live database collections
  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const habitsCol = collection(db, 'users', currentUser.uid, 'habits');
    const threatsCol = collection(db, 'users', currentUser.uid, 'threats');
    const logsCol = collection(db, 'users', currentUser.uid, 'logs');

    // Profile listener
    const unsubProfile = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile(snapshot.data() as UserProfile);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
    });

    // Habits listener
    const unsubHabits = onSnapshot(habitsCol, (snapshot) => {
      const items: UserHabit[] = [];
      snapshot.forEach((snap) => {
        items.push(snap.data() as UserHabit);
      });
      setHabits(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}/habits`);
    });

    // Threats listener
    const unsubThreats = onSnapshot(threatsCol, (snapshot) => {
      const items: UserThreat[] = [];
      snapshot.forEach((snap) => {
        items.push(snap.data() as UserThreat);
      });
      // Sort threats by target requirements
      items.sort((a, b) => a.xpUnlockRequirement - b.xpUnlockRequirement);
      setThreats(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}/threats`);
    });

    // Logs listener (sorted reverse chronological)
    const unsubLogs = onSnapshot(logsCol, (snapshot) => {
      const items: UserLog[] = [];
      snapshot.forEach((snap) => {
        items.push(snap.data() as UserLog);
      });
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setLogs(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}/logs`);
    });

    return () => {
      unsubProfile();
      unsubHabits();
      unsubThreats();
      unsubLogs();
    };
  }, [currentUser]);

  // Bootstrapping function for brand new user profile to maintain null-safe values
  const bootstrapUserRecord = async (user: User) => {
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        // Create transactional initial entities to prevent runtime crash
        const batch = writeBatch(db);

        const initialProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Operative Commander',
          photoURL: user.photoURL || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRJYmscQRERwAQVhluJUggfF6G3OepWySjsMd3niVk9O14O3XinAvuSIYcP_2fH0gOgrSOkNpj_8NVAlTG0LzILvipge6M9jrZd5ZwjKQxeaAkkzXU4O-VjFrxaWPYjYJefS6M3DbXf1_Im0IpijJspOsOUXi6GxO-cFajuUkSC8m0dvRso2CXt4SNN8AhPV9WCrRoRhfy1iUS8j1CgMWaXsBDqe8gwvGEp-wja4v_3Iqgk-STVC6U6cvIrMU-W10-vy0we3ZfvzY',
          xp: 450,
          crystals: 10,
          perfectDays: 2,
          bestStreak: 5,
          purchasedItems: ['cosmic_radio'],
          visualMode: 'dark',
          neuralComms: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        batch.set(userDocRef, initialProfile);

        // Bootstrap Sector Habits
        const defaultHabits: UserHabit[] = [
          {
            id: 'gratitude_log',
            name: 'Gratitude log',
            category: 'mind',
            difficulty: 'easy',
            streak: 2,
            highStreak: 5,
            completions: 12,
            lastCompletedYMD: '',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'walk_15_mins',
            name: 'Walk 15 mins',
            category: 'health',
            difficulty: 'medium',
            streak: 1,
            highStreak: 4,
            completions: 8,
            lastCompletedYMD: '',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'exercise',
            name: 'Exercise',
            category: 'health',
            difficulty: 'hard',
            streak: 0,
            highStreak: 12,
            completions: 34,
            lastCompletedYMD: '',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'daily_workout',
            name: 'Daily Workout',
            category: 'health',
            difficulty: 'hard',
            streak: 5,
            highStreak: 12,
            completions: 22,
            lastCompletedYMD: '',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'skill_research',
            name: 'Skill Research',
            category: 'skill',
            difficulty: 'medium',
            streak: 3,
            highStreak: 8,
            completions: 15,
            lastCompletedYMD: '',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'mental_sync',
            name: 'Mental Sync',
            category: 'mind',
            difficulty: 'easy',
            streak: 2,
            highStreak: 5,
            completions: 11,
            lastCompletedYMD: '',
            createdAt: new Date().toISOString(),
          },
        ];

        defaultHabits.forEach((habit) => {
          const hbRef = doc(db, 'users', user.uid, 'habits', habit.id);
          batch.set(hbRef, habit);
        });

        // Bootstrap Threats
        const defaultThreats: UserThreat[] = [
          {
            id: 'scavenger_swarm',
            name: 'The Scavenger Swarm',
            level: 4,
            integrity: 75,
            maxIntegrity: 100,
            unlocked: true,
            defeated: false,
            xpUnlockRequirement: 0,
          },
          {
            id: 'void_stalker',
            name: 'The Void Stalker',
            level: 6,
            integrity: 100,
            maxIntegrity: 100,
            unlocked: false,
            defeated: false,
            xpUnlockRequirement: 501,
          },
          {
            id: 'singularity_overlord',
            name: 'The Singularity Overlord',
            level: 9,
            integrity: 150,
            maxIntegrity: 150,
            unlocked: false,
            defeated: false,
            xpUnlockRequirement: 1501,
          },
        ];

        defaultThreats.forEach((th) => {
          const thRef = doc(db, 'users', user.uid, 'threats', th.id);
          batch.set(thRef, th);
        });

        // Create bootstrap system log
        const logId = `log_${Date.now()}`;
        const initLog: UserLog = {
          id: logId,
          type: 'system',
          title: 'Spaceship telemetry online. Operational streak registers connected.',
          xpEarned: 0,
          crystalsChange: 0,
          createdAt: new Date().toISOString(),
        };
        batch.set(doc(db, 'users', user.uid, 'logs', logId), initLog);

        await batch.commit();
        onNotify('Spaceship account bootstrapped. Systems Online!', 'success');
      }
    } catch (error) {
      console.error('Error bootstrapping profile:', error);
      onNotify('Database sync connection lost.', 'error');
    }
  };

  // COMPLETE A HABIT Logic (Checks, Increments Stats, subtracts enemy HP and logs)
  const onCompleteHabit = async (habitId: string) => {
    if (!currentUser || !userProfile) return;
    setLoadingAction('complete_habit');

    const targetHabit = habits.find((h) => h.id === habitId);
    const activeThreat = threats.find((t) => !t.defeated && t.unlocked) || threats[0];

    if (!targetHabit) {
      setLoadingAction(null);
      return;
    }

    const todayYMD = new Date().toISOString().split('T')[0];

    // Determine rewards & battle damage metrics with upgrades & streaks
    const xpReward = targetHabit.difficulty === 'easy' ? 5 : targetHabit.difficulty === 'medium' ? 10 : 15;
    const crystalReward = 2; // grant salvage bonus crystals!

    // Combat Damage Engine: Easy: 15, Medium: 30, Hard: 50. Streaks yield +3 more per scale.
    const baseDmg = targetHabit.difficulty === 'easy' ? 15 : targetHabit.difficulty === 'medium' ? 30 : 50;
    const streakBonus = (targetHabit.streak || 0) * 3;
    
    let multiplier = 1.0;
    if (userProfile.purchasedItems?.includes('quantum_warp_drive')) {
      multiplier += 0.25; // Warp driver overclock: +25%
    }
    if (userProfile.purchasedItems?.includes('deep_space_skin')) {
      multiplier += 0.15; // Stealth sensor matrix: +15%
    }
    if (userProfile.purchasedItems?.includes('atmospheric_shielding')) {
      multiplier += 0.10; // Ion shield feedback routing: +10%
    }

    const activeDmg = Math.floor((baseDmg + streakBonus) * multiplier);

    const nextStreak = targetHabit.streak + 1;
    const nextHighStreak = Math.max(targetHabit.highStreak, nextStreak);

    const habitsPath = `users/${currentUser.uid}/habits/${habitId}`;

    try {
      const batch = writeBatch(db);

      // 1. Update Habit completions
      const hbRef = doc(db, 'users', currentUser.uid, 'habits', habitId);
      batch.update(hbRef, {
        streak: nextStreak,
        highStreak: nextHighStreak,
        completions: targetHabit.completions + 1,
        lastCompletedYMD: todayYMD,
      });

      // 2. Adjust User cumulative Stats / preferences
      const usrRef = doc(db, 'users', currentUser.uid);
      const nextUserXP = userProfile.xp + xpReward;
      const nextUserCrystals = userProfile.crystals + crystalReward;
      const nextUserBestStreak = Math.max(userProfile.bestStreak, nextStreak);

      batch.update(usrRef, {
        xp: nextUserXP,
        crystals: nextUserCrystals,
        bestStreak: nextUserBestStreak,
        updatedAt: new Date().toISOString(),
      });

      // 3. Complete dynamic damage against the engaged boss
      let damageInfo = '';
      if (activeThreat && !activeThreat.defeated) {
        const nextIntegrity = Math.max(0, activeThreat.integrity - activeDmg);
        const isDefeated = nextIntegrity === 0;

        const thRef = doc(db, 'users', currentUser.uid, 'threats', activeThreat.id);
        batch.update(thRef, {
          integrity: nextIntegrity,
          defeated: isDefeated,
        });

        damageInfo = ` Dealt ${activeDmg} DMG to ${activeThreat.name}!`;

        if (isDefeated) {
          damageInfo += ` Threat Neutralized!`;
        }
      }

      // 4. Record chronological log
      const logId = `log_comp_${Date.now()}`;
      const userLog: UserLog = {
        id: logId,
        type: 'completion',
        title: `Completed sector task '${targetHabit.name}'.${damageInfo}`,
        xpEarned: xpReward,
        crystalsChange: crystalReward,
        createdAt: new Date().toISOString(),
      };
      batch.set(doc(db, 'users', currentUser.uid, 'logs', logId), userLog);

      await batch.commit();
      onNotify(`Sector protocol logged! +${xpReward} XP / +${crystalReward} Crystals.${damageInfo}`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, habitsPath);
    } finally {
      setLoadingAction(null);
    }
  };

  // Claim threat defeat scrap reward
  const onClaimDefeatReward = async (threatId: string) => {
    if (!currentUser || !userProfile) return;
    setLoadingAction('claim_reward');

    const threat = threats.find((t) => t.id === threatId);
    if (!threat || !threat.defeated) {
      setLoadingAction(null);
      return;
    }

    try {
      const batch = writeBatch(db);
      
      // Update crystals & perfect cycles metrics
      const userRef = doc(db, 'users', currentUser.uid);
      const rewardCrystals = 15;
      const nextCrystals = userProfile.crystals + rewardCrystals;
      const nextPerfectDays = userProfile.perfectDays + 1; // register perfect sequence metrics

      batch.update(userRef, {
        crystals: nextCrystals,
        perfectDays: nextPerfectDays,
        updatedAt: new Date().toISOString(),
      });

      // Delete/Reset the threat state back to full health to allow re-engaging or loop engagement
      const thRef = doc(db, 'users', currentUser.uid, 'threats', threatId);
      batch.update(thRef, {
        integrity: threat.maxIntegrity,
        defeated: false,
      });

      // Log reward activity to feed
      const logId = `log_rew_${Date.now()}`;
      const logRec: UserLog = {
        id: logId,
        type: 'threat_defeated',
        title: `Claimed debris salvage rewards from neutralizing ${threat.name}. +15 Crystals +1 Perfect Cycle!`,
        xpEarned: 0,
        crystalsChange: rewardCrystals,
        createdAt: new Date().toISOString(),
      };
      batch.set(doc(db, 'users', currentUser.uid, 'logs', logId), logRec);

      await batch.commit();
      onNotify(`Salvage reclaimed: +15 Crystals / +1 Perfect cycle registered!`, 'success');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${currentUser.uid}/threats/${threatId}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // PURCHASE ORBITAL ITEM Logic
  const onPurchaseItem = async (itemId: string, price: number) => {
    if (!currentUser || !userProfile) return;
    setLoadingAction('purchase_item');

    const profilePath = `users/${currentUser.uid}`;
    try {
      const batch = writeBatch(db);

      const nextCrystals = userProfile.crystals - price;
      const nextPurchased = [...(userProfile.purchasedItems || []), itemId];

      // Update user details
      const userRef = doc(db, 'users', currentUser.uid);
      batch.update(userRef, {
        crystals: nextCrystals,
        purchasedItems: nextPurchased,
        updatedAt: new Date().toISOString(),
      });

      // Log purchase
      const logId = `log_pur_${Date.now()}`;
      const itemTitle = itemId.replace(/_/g, ' ');
      const userLog: UserLog = {
        id: logId,
        type: 'purchase',
        title: `Spent ${price} crystals to inspect & equip orbital drop: [${itemTitle}].`,
        xpEarned: 0,
        crystalsChange: -price,
        createdAt: new Date().toISOString(),
      };
      batch.set(doc(db, 'users', currentUser.uid, 'logs', logId), userLog);

      await batch.commit();
      onNotify(`Orbital drop acquisition successful! Equipped [${itemTitle}].`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, profilePath);
    } finally {
      setLoadingAction(null);
    }
  };

  // UNLOCK NEW THREAT MODULE
  const onUnlockThreat = async (threatId: string) => {
    if (!currentUser) return;
    setLoadingAction('unlock_threat');
    try {
      const thRef = doc(db, 'users', currentUser.uid, 'threats', threatId);
      await updateDoc(thRef, { unlocked: true });

      // Log unlock
      const logId = `log_unl_${Date.now()}`;
      const logRec: UserLog = {
        id: logId,
        type: 'system',
        title: `Decrypted operational data link for high hazard sectoral threat. Space tactical radar adjusted.`,
        xpEarned: 0,
        crystalsChange: 0,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', currentUser.uid, 'logs', logId), logRec);

      onNotify('Sector radar upgraded. High hazard threat decrypted!', 'success');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${currentUser.uid}/threats/${threatId}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // ENGAGE/SWITCH THREAT FOCUS
  const onEngageThreat = (threatId: string) => {
    // Simply swap to Arena view to lock transmission
    setActiveTab('arena');
    const matchedThreat = threats.find((t) => t.id === threatId);
    if (matchedThreat) {
      onNotify(`Locked tactical focus to ${matchedThreat.name}. Sector parameters online.`, 'info');
    }
  };

  // TOGGLE PREFERENCE (visualMode or neuralComms)
  const onTogglePreference = async (field: 'visualMode' | 'neuralComms') => {
    if (!currentUser || !userProfile) return;
    setLoadingAction('toggle_pref');

    const nextVal =
      field === 'visualMode'
        ? userProfile.visualMode === 'dark'
          ? 'light'
          : 'dark'
        : !userProfile.neuralComms;

    try {
      const usrRef = doc(db, 'users', currentUser.uid);
      await updateDoc(usrRef, {
        [field]: nextVal,
        updatedAt: new Date().toISOString(),
      });
      onNotify(`Tactical setting updated: [${field}] sync complete.`, 'info');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${currentUser.uid}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // RESET DATABASE / SELF DESTRUCT
  const onResetData = async () => {
    if (!currentUser) return;
    setLoadingAction('reset_data');
    try {
      // Re-trigger bootstrapping setup logic by rewriting profile & subcollections back to baseline
      const batch = writeBatch(db);

      // Baseline values
      const baselineProfile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || 'Operative Commander',
        photoURL: currentUser.photoURL || '',
        xp: 0,
        crystals: 0,
        perfectDays: 0,
        bestStreak: 0,
        purchasedItems: [],
        visualMode: 'dark',
        neuralComms: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      batch.set(doc(db, 'users', currentUser.uid), baselineProfile);

      // Reset habits back to 0 completions
      const baselineHabitsYMD: string = '';
      habits.forEach((h) => {
        const hbRef = doc(db, 'users', currentUser.uid, 'habits', h.id);
        batch.update(hbRef, {
          streak: 0,
          highStreak: 0,
          completions: 0,
          lastCompletedYMD: baselineHabitsYMD,
        });
      });

      // Reset threats subcollection
      const defaultThreatsReset = [
        { id: 'scavenger_swarm', integrity: 75, maxIntegrity: 100, unlocked: true, defeated: false },
        { id: 'void_stalker', integrity: 100, maxIntegrity: 100, unlocked: false, defeated: false },
        { id: 'singularity_overlord', integrity: 150, maxIntegrity: 150, unlocked: false, defeated: false },
      ];
      defaultThreatsReset.forEach((th) => {
        const thRef = doc(db, 'users', currentUser.uid, 'threats', th.id);
        batch.update(thRef, th);
      });

      // Clear historic logs and generate single reset log
      logs.forEach((log) => {
        const logRef = doc(db, 'users', currentUser.uid, 'logs', log.id);
        batch.delete(logRef);
      });

      const resetLogId = `log_rst_${Date.now()}`;
      const systemLog: UserLog = {
        id: resetLogId,
        type: 'system',
        title: 'Full zero-state system self-destruct achieved. Operative reset logging complete.',
        xpEarned: 0,
        crystalsChange: 0,
        createdAt: new Date().toISOString(),
      };
      batch.set(doc(db, 'users', currentUser.uid, 'logs', resetLogId), systemLog);

      await batch.commit();
      setActiveTab('stats');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${currentUser.uid}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // LEVEL UP OVERRIDE Logic
  const onLevelUp = async () => {
    if (!currentUser || !userProfile) return;
    setLoadingAction('level_up');

    // Calculate current level based on 150 XP per level increment
    const currentLevel = Math.max(1, Math.floor(userProfile.xp / 150));
    const nextLevel = currentLevel + 1;
    const targetXP = nextLevel * 150;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const batch = writeBatch(db);

      // Force update user's cumulative XP directly
      batch.update(userRef, {
        xp: targetXP,
        updatedAt: new Date().toISOString(),
      });

      // Record a special log entry
      const logId = `log_lvl_${Date.now()}`;
      const upgradeLog: UserLog = {
        id: logId,
        type: 'system',
        title: `Admiral bypass synchronized. Promoted to Command Level ${nextLevel}!`,
        xpEarned: targetXP - userProfile.xp,
        crystalsChange: 0,
        createdAt: new Date().toISOString(),
      };
      batch.set(doc(db, 'users', currentUser.uid, 'logs', logId), upgradeLog);

      await batch.commit();
      onNotify(`UPLINK SECURED: Command Level upgraded to LVL ${nextLevel}!`, 'success');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${currentUser.uid}`);
    } finally {
      setLoadingAction(null);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#0d0e11] text-[#e3e2e7] flex flex-col items-center justify-center font-mono">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        </div>
        <p className="text-xs uppercase tracking-[0.25em] text-primary/80 animate-pulse">Syncing Space HUD Uplink...</p>
      </div>
    );
  }

  // Not logged in: authenticate through secure popup landing page
  if (!currentUser || !userProfile) {
    return (
      <div className="min-h-screen bg-[#121317]">
        <AuthPage onNotify={onNotify} />
        <AnimatePresence>
          {toastMessage && (
            <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col relative w-full overflow-x-hidden pt-16 pb-24">
      {/* Visual background grain */}
      <div className="grain-overlay"></div>

      {/* Shared Top Fixed App Bar */}
      <header className="bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 fixed top-0 w-full z-45 h-16 flex justify-between items-center px-margin shadow-[0_0_15px_rgba(173,198,255,0.1)]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              alt="Commander Portrait"
              className="w-10 h-10 rounded-full border-2 border-primary bg-primary-container object-cover"
              src={
                Math.max(1, Math.floor(userProfile.xp / 150)) === 1
                  ? 'https://res.cloudinary.com/dtrzwgkjo/image/upload/v1779768444/realistic_painterly_illustration_of_a_level_1_sci_fi_astronaut_avatar._average_hy1y19.png'
                  : Math.max(1, Math.floor(userProfile.xp / 150)) === 2
                  ? 'https://res.cloudinary.com/dtrzwgkjo/image/upload/v1779768446/realistic_painterly_illustration_of_a_level_2_sci_fi_astronaut_avatar._male_tywlho.png'
                  : 'https://res.cloudinary.com/dtrzwgkjo/image/upload/v1779768445/realistic_painterly_illustration_of_a_level_3_sci_fi_astronaut_avatar._male_rt0rwo.png'
              }
            />
            <div className="absolute -bottom-1 -right-1 bg-secondary text-on-secondary-container text-[10px] font-bold px-1.5 rounded-full border border-background">
              LVL {Math.max(1, Math.floor(userProfile.xp / 150))}
            </div>
          </div>
          <div>
            <h1 className="font-display text-base font-bold text-primary tracking-tighter uppercase leading-none">
              Habit Hustle
            </h1>
            <span className="font-mono text-[8px] text-on-surface-variant/40 tracking-wider">COMMAND COCKPIT</span>
          </div>
        </div>

        {/* Currency summary counters */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[15px]">workspace_premium</span>
              <span className="font-mono text-[11px] font-bold">{userProfile.xp} XP</span>
            </div>
            <div className="flex items-center gap-1 text-secondary leading-none">
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>token</span>
              <span className="font-mono text-[11px] font-bold">{userProfile.crystals} Cr</span>
            </div>
          </div>
        </div>
      </header>

      {/* Center Layout Section independently scrollable */}
      <main className="flex-1 w-full max-w-md mx-auto px-margin py-6 relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <StatsView
                user={userProfile}
                habits={habits}
                onNotify={onNotify}
                onLevelUp={onLevelUp}
                loadingAction={loadingAction}
              />
            </motion.div>
          )}

          {activeTab === 'arena' && (
            <motion.div
              key="arena"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <ArenaView
                user={userProfile}
                habits={habits}
                threats={threats}
                onCompleteHabit={onCompleteHabit}
                onClaimDefeatReward={onClaimDefeatReward}
                onNotify={onNotify}
                loadingAction={loadingAction}
              />
            </motion.div>
          )}

          {activeTab === 'shop' && (
            <motion.div
              key="shop"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <ShopView
                user={userProfile}
                onPurchaseItem={onPurchaseItem}
                onNotify={onNotify}
                loadingAction={loadingAction}
              />
            </motion.div>
          )}

          {activeTab === 'mission' && (
            <motion.div
              key="mission"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <MissionView
                user={userProfile}
                threats={threats}
                onUnlockThreat={onUnlockThreat}
                onEngageThreat={onEngageThreat}
                onNotify={onNotify}
                loadingAction={loadingAction}
              />
            </motion.div>
          )}

          {activeTab === 'log' && (
            <motion.div
              key="log"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <LogView
                user={userProfile}
                logs={logs}
                onTogglePreference={onTogglePreference}
                onResetData={onResetData}
                onNotify={onNotify}
                loadingAction={loadingAction}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Fixed Bottom Layout Section Application Navigation Menu */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-surface-container-low/95 z-45 border-t border-outline-variant/15 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.4)] rounded-t-2xl">
        <button
          onClick={() => setActiveTab('arena')}
          className={`flex flex-col items-center justify-center transition-all ${
            activeTab === 'arena'
              ? 'text-secondary drop-shadow-[0_0_8px_#d9bbf1] scale-105 font-bold'
              : 'text-on-surface-variant/60 hover:text-secondary/80'
          }`}
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <span className="material-symbols-outlined text-[23px]">swords</span>
          <span className="font-mono text-[9px] mt-0.5 tracking-tight uppercase">Arena</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center justify-center transition-all ${
            activeTab === 'stats'
              ? 'text-secondary drop-shadow-[0_0_8px_#d9bbf1] scale-105 font-bold'
              : 'text-on-surface-variant/60 hover:text-secondary/80'
          }`}
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <span className="material-symbols-outlined text-[23px]">insights</span>
          <span className="font-mono text-[9px] mt-0.5 tracking-tight uppercase">Stats</span>
        </button>

        <button
          onClick={onLevelUp}
          disabled={loadingAction === 'level_up'}
          className="flex flex-col items-center justify-center transition-all text-secondary-container hover:text-secondary hover:scale-105 active:scale-95 disabled:opacity-50"
          style={{ minWidth: '44px', minHeight: '44px' }}
          title="Fast Level Up Override"
        >
          <span className="material-symbols-outlined text-[24px] text-secondary font-bold animate-bounce filter drop-shadow-[0_0_4px_rgba(217,187,241,0.5)]">upgrade</span>
          <span className="font-mono text-[8px] mt-0.5 tracking-tight uppercase text-secondary font-bold">LVL UP</span>
        </button>

        <button
          onClick={() => setActiveTab('shop')}
          className={`flex flex-col items-center justify-center transition-all ${
            activeTab === 'shop'
              ? 'text-secondary drop-shadow-[0_0_8px_#d9bbf1] scale-105 font-bold'
              : 'text-on-surface-variant/60 hover:text-secondary/80'
          }`}
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <span className="material-symbols-outlined text-[23px]">shopping_bag</span>
          <span className="font-mono text-[9px] mt-0.5 tracking-tight uppercase">Shop</span>
        </button>

        <button
          onClick={() => setActiveTab('mission')}
          className={`flex flex-col items-center justify-center transition-all ${
            activeTab === 'mission'
              ? 'text-secondary drop-shadow-[0_0_8px_#d9bbf1] scale-105 font-bold'
              : 'text-on-surface-variant/60 hover:text-secondary/80'
          }`}
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <span className="material-symbols-outlined text-[23px]">workspace_premium</span>
          <span className="font-mono text-[9px] mt-0.5 tracking-tight uppercase">Mission</span>
        </button>

        <button
          onClick={() => setActiveTab('log')}
          className={`flex flex-col items-center justify-center transition-all ${
            activeTab === 'log'
              ? 'text-secondary drop-shadow-[0_0_8px_#d9bbf1] scale-105 font-bold'
              : 'text-on-surface-variant/60 hover:text-secondary/80'
          }`}
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <span className="material-symbols-outlined text-[23px]">account_circle</span>
          <span className="font-mono text-[9px] mt-0.5 tracking-tight uppercase">Log</span>
        </button>
      </nav>

      {/* Holographic Dynamic Toast alerts */}
      <AnimatePresence>
        {toastMessage && (
          <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
