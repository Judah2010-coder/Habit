export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  xp: number;
  crystals: number;
  perfectDays: number;
  bestStreak: number;
  purchasedItems: string[];
  visualMode: 'dark' | 'light';
  neuralComms: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserHabit {
  id: string;
  name: string;
  category: 'mind' | 'health' | 'skill';
  difficulty: 'easy' | 'medium' | 'hard';
  streak: number;
  highStreak: number;
  completions: number;
  lastCompletedYMD: string; // YYYY-MM-DD
  createdAt: string;
}

export interface UserThreat {
  id: string;
  name: string;
  level: number;
  integrity: number;
  maxIntegrity: number;
  unlocked: boolean;
  defeated: boolean;
  xpUnlockRequirement: number;
}

export interface UserLog {
  id: string;
  type: 'completion' | 'purchase' | 'system' | 'threat_defeated';
  title: string;
  xpEarned: number;
  crystalsChange: number;
  createdAt: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: 'ship' | 'avatar' | 'community';
  price: number;
  priceType: 'crystals' | 'free';
  icon: string;
  detailText: string;
  imageAlt: string;
  imageUrl: string;
}
