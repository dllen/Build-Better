import { GenerateUglyAvatar } from "ugly-avatar";
import type { UserProfile } from "./types";

const ADJECTIVES = [
  "可爱", "聪明", "快乐", "勇敢", "安静", "活泼", "温柔", "调皮",
  "神秘", "酷炫", "温暖", "阳光", "月亮", "星星", "彩虹", "云朵",
];

const NOUNS = [
  "小猫", "小狗", "小熊", "小兔", "小鹿", "小鱼", "小鸟", "小猪",
  "熊猫", "狐狸", "松鼠", "刺猬", "企鹅", "海豚", "章鱼", "蝴蝶",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateNickname(): string {
  return `${randomItem(ADJECTIVES)}${randomItem(NOUNS)}`;
}

function generateAvatar(): string {
  const avatar = new GenerateUglyAvatar();
  return avatar.generateFace();
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

  // Generate new profile
  cachedProfile = { name: generateNickname(), avatar: generateAvatar() };

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
  const avatar = generateAvatar();
  if (cachedProfile) {
    cachedProfile.avatar = avatar;
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
