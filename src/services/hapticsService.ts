import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export async function hapticImpactLight(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics are optional; unsupported devices should continue silently.
  }
}

export async function hapticImpactMedium(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Haptics are optional; unsupported devices should continue silently.
  }
}

export async function hapticSuccess(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Haptics are optional; unsupported devices should continue silently.
  }
}
