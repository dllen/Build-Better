import type { UserProfile } from "./types";

const FIRST_NAMES = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery",
  "Blake", "Cameron", "Charlie", "Dakota", "Drew", "Ellis", "Finley", "Harper",
  "Jamie", "Jesse", "Kelly", "Logan", "Madison", "Max", "Nico", "Parker",
  "Reese", "Robin", "Sam", "Sydney", "Tatum", "Skyler",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Brown", "Jones", "Miller", "Davis", "Garcia", "Wilson",
  "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Martin", "Lee", "Thompson",
  "White", "Harris", "Clark", "Lewis", "Walker", "Hall", "Young", "King", "Wright",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateNickname(): string {
  return `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`;
}

function generateAvatar(seed: string): string {
  // DiceBear Adventurer style - consistent avatar based on seed
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
}

function generateSeed(): string {
  return crypto.randomUUID();
}

let cachedProfile: UserProfile | null = null;

export function getLocalProfile(): UserProfile {
  if (cachedProfile) return cachedProfile;

  const storageKey = "webchat:profile";
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      cachedProfile = JSON.parse(stored) as UserProfile;
      return cachedProfile;
    }
  } catch {
    // ignore parse errors
  }

  // Generate new profile with unique seed for avatar
  const seed = generateSeed();
  cachedProfile = {
    name: generateNickname(),
    avatar: generateAvatar(seed),
    avatarSeed: seed,
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(cachedProfile));
  } catch {
    // ignore storage errors
  }

  return cachedProfile;
}

export function updateProfile(profile: UserProfile): void {
  cachedProfile = profile;
  const storageKey = "webchat:profile";
  try {
    localStorage.setItem(storageKey, JSON.stringify(profile));
  } catch {
    // ignore storage errors
  }
}

export function refreshAvatar(): string {
  const seed = generateSeed();
  const avatar = generateAvatar(seed);
  if (cachedProfile) {
    cachedProfile.avatar = avatar;
    cachedProfile.avatarSeed = seed;
    updateProfile(cachedProfile);
  }
  return avatar;
}

export function refreshNickname(): string {
  const name = generateNickname();
  if (cachedProfile) {
    cachedProfile.name = name;
    updateProfile(cachedProfile);
  }
  return name;
}
