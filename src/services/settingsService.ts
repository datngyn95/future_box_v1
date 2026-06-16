// FutureBoxes — App Settings Service
// Lưu cài đặt vào AsyncStorage: App Lock, Biometric, Onboarding, Background timestamp

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  APP_LOCK: 'fb_app_lock',
  BIOMETRIC: 'fb_biometric',
  ONBOARDING_DONE: 'fb_onboarding',
  BACKGROUNDED_AT: 'fb_bg_at',
} as const;

export const LOCK_TIMEOUT_MS = 30_000; // 30 giây

export async function isAppLockEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.APP_LOCK)) === 'true';
}

export async function setAppLockEnabled(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.APP_LOCK, String(value));
}

export async function isBiometricEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.BIOMETRIC)) === 'true';
}

export async function setBiometricEnabled(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.BIOMETRIC, String(value));
}

export async function isOnboardingDone(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.ONBOARDING_DONE)) === 'true';
}

export async function markOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, 'true');
}

export async function getBackgroundedAt(): Promise<number | null> {
  const v = await AsyncStorage.getItem(KEYS.BACKGROUNDED_AT);
  return v ? parseInt(v, 10) : null;
}

export async function setBackgroundedAt(ts: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.BACKGROUNDED_AT, String(ts));
}

export async function clearBackgroundedAt(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.BACKGROUNDED_AT);
}
