// Sound service — hiệu ứng âm thanh khi mở hộp (knock/creak/wind/bell).
//
// Khung phát âm thanh đã dựng sẵn bằng expo-audio (imperative API). Hiện CHƯA có
// file .mp3/.wav nên mọi hàm tự no-op an toàn. Khi bạn thêm file vào
// `assets/sounds/`, chỉ cần bỏ comment dòng require tương ứng trong SOUND_SOURCES
// bên dưới là âm thanh chạy ngay — không cần sửa chỗ gọi.

import { Platform } from 'react-native';
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from 'expo-audio';

export type SoundName = 'knock' | 'creak' | 'wind';

// 👉 Thêm file âm thanh tại đây (bỏ comment khi đã đặt file vào assets/sounds/):
const SOUND_SOURCES: Partial<Record<SoundName, number>> = {
  knock: require('../../assets/sounds/knock.mp3'),  // GĐ1: tiếng gõ cốc cốc
  creak: require('../../assets/sounds/creak.mp3'),  // GĐ2: tiếng kẹt cửa gỗ
  wind:  require('../../assets/sounds/wind.mp3'),   // GĐ3: gió rít nền (loop)
};

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let audioModeReady = false;

function ensureAudioMode(): void {
  if (audioModeReady || Platform.OS === 'web') return;
  audioModeReady = true;
  // Cho phép phát cả khi máy đang ở chế độ im lặng; lỗi thì bỏ qua (optional).
  void setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
}

function getPlayer(name: SoundName): AudioPlayer | null {
  const source = SOUND_SOURCES[name];
  if (source == null) return null;
  if (!players[name]) {
    try {
      players[name] = createAudioPlayer(source);
    } catch {
      return null;
    }
  }
  return players[name] ?? null;
}

/** Phát một âm một lần (từ đầu). Optional/silent nếu chưa có file. */
export function playSound(name: SoundName, opts?: { volume?: number }): void {
  if (Platform.OS === 'web') return;
  try {
    ensureAudioMode();
    const player = getPlayer(name);
    if (!player) return;
    if (opts?.volume != null) player.volume = opts.volume;
    player.seekTo(0);
    player.play();
  } catch {
    // Âm thanh là tùy chọn; thiết bị/lib không hỗ trợ thì im lặng bỏ qua.
  }
}

/** Bật một âm lặp vô hạn (vd: gió nền). */
export function startLoop(name: SoundName, opts?: { volume?: number }): void {
  if (Platform.OS === 'web') return;
  try {
    ensureAudioMode();
    const player = getPlayer(name);
    if (!player) return;
    player.loop = true;
    if (opts?.volume != null) player.volume = opts.volume;
    player.seekTo(0);
    player.play();
  } catch {
    // optional
  }
}

/** Dừng (tạm) một âm đang lặp. */
export function stopSound(name: SoundName): void {
  try {
    players[name]?.pause();
  } catch {
    // optional
  }
}

/** Giải phóng toàn bộ player (gọi khi rời màn nếu cần). */
export function releaseSounds(): void {
  (Object.keys(players) as SoundName[]).forEach((name) => {
    try {
      players[name]?.remove();
    } catch {
      // optional
    }
    delete players[name];
  });
}
