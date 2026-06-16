// FutureBoxes — Auth Service
// PIN hash (SHA-256 + salt) → expo-secure-store
// Biometric → expo-local-authentication

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';

const PIN_KEY = 'fb_pin_hash';
const SALT = 'futureboxes_salt_v1_2026';

async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin + SALT,
  );
}

export async function setPIN(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, await hashPin(pin));
}

export async function verifyPIN(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  if (!stored) return false;
  return stored === (await hashPin(pin));
}

export async function clearPIN(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY).catch(() => {});
}

export async function hasPIN(): Promise<boolean> {
  return !!(await SecureStore.getItemAsync(PIN_KEY));
}

export async function isBiometricAvailable(): Promise<boolean> {
  const hw = await LocalAuthentication.hasHardwareAsync();
  if (!hw) return false;
  return LocalAuthentication.isEnrolledAsync();
}

export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Xác thực để mở FutureBoxes',
      cancelLabel: 'Dùng PIN',
      disableDeviceFallback: true,
    });
    return result.success;
  } catch {
    return false;
  }
}
