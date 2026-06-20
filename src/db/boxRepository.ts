// FutureBoxes — Box Repository
// Toàn bộ CRUD cho box, reflection_question, notification_schedule.
// Schema: xem design/database/schema.md

import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { getDatabase } from './database';
import { cancelBoxNotification, scheduleBoxNotification } from '../services/notificationService';
import { Box, BoxStatus, BoxTeaser, BoxType } from '../types/box';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateBoxInput {
  boxType: BoxType;
  title?: string;
  content: string;
  openingNote?: string;
  reflectionQuestion?: string;
  imagePath?: string;        // URI tạm từ picker; sẽ được copy vào document dir
  unlockDate: string;        // ISO string (từ Date picker / preset)
  teasers?: string[];
}

// DB row shape từ SQLite (snake_case)
interface BoxRow {
  id: string;
  box_type: string;
  title: string | null;
  content: string;
  opening_note: string | null;
  image_path: string | null;
  created_at: string;
  unlock_date: string;
  is_opened: number;
  opened_at: string | null;
  is_deleted: number;
}

interface ReflectionRow {
  id: string;
  box_id: string;
  question_text: string;
  answer: string | null;
  answered_at: string | null;
}

interface NotificationRow {
  id: string;
  box_id: string;
  notification_identifier: string | null;
  scheduled_for: string;
  is_cancelled: number;
}

interface TeaserRow {
  id: string;
  box_id: string;
  teaser_text: string;
  unlock_at: string;
  is_system_generated: number;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateUUID(): string {
  return Crypto.randomUUID();
}

/**
 * Chuyển DB row sang Box domain object.
 * Không tính status ở đây vì status là derived (cần thời gian thực).
 */
function rowToBox(
  row: BoxRow,
  reflection: ReflectionRow | null,
  notification: NotificationRow | null,
  teasers: BoxTeaser[] = [],
): Box {
  // Status placeholder — sẽ được tính lại bởi getBoxStatus() trong store
  const status: BoxStatus = row.is_opened === 1 ? 'opened' : 'locked';

  return {
    id: row.id,
    boxType: row.box_type.toLowerCase() as BoxType,
    title: row.title ?? undefined,
    content: row.content,
    openingNote: row.opening_note ?? undefined,
    imagePath: row.image_path ?? undefined,
    createdAt: row.created_at,
    unlockDate: row.unlock_date,
    openedAt: row.opened_at ?? undefined,
    notificationIdentifier: notification?.notification_identifier ?? undefined,
    reflectionQuestion: reflection?.question_text ?? undefined,
    reflectionAnswer: (reflection?.answer as 'yes' | 'no' | null) ?? undefined,
    teasers,
    status,
  };
}

function rowToTeaser(row: TeaserRow): BoxTeaser {
  return {
    id: row.id,
    boxId: row.box_id,
    teaserText: row.teaser_text,
    unlockAt: row.unlock_at,
    isSystemGenerated: row.is_system_generated === 1,
    createdAt: row.created_at,
  };
}

function normalizeTeaserTexts(teasers?: string[]): string[] {
  return (teasers ?? [])
    .map((text) => text.trim())
    .filter((text) => text.length > 0)
    .slice(0, 3)
    .map((text) => text.slice(0, 160));
}

export function computeTeaserUnlockAts(
  createdAtISO: string,
  unlockDateISO: string,
  count: number,
): string[] {
  if (count <= 0) return [];

  const createdAtMs = new Date(createdAtISO).getTime();
  const unlockDateMs = new Date(unlockDateISO).getTime();
  const rangeMs = unlockDateMs - createdAtMs;

  if (rangeMs <= 0) return [];

  return Array.from({ length: count }, (_, index) => {
    const step = index + 1;
    return new Date(createdAtMs + (rangeMs * step) / (count + 1)).toISOString();
  });
}

/**
 * Chuẩn hóa BoxType về dạng Title-case cho DB CHECK constraint.
 * DB dùng 'Message','Goal','Memory','Decision'; types.ts dùng lowercase.
 */
function toDbBoxType(type: BoxType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Copy ảnh từ URI tạm (picker) vào documentDirectory/box_images/<boxId>.<ext>
 * Trả về path đã copy, throw khi copy lỗi.
 */
async function copyImageToDocumentDir(
  sourceUri: string,
  boxId: string,
): Promise<string> {
  const imageDir = `${FileSystem.documentDirectory}box_images/`;
  const dirInfo = await FileSystem.getInfoAsync(imageDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(imageDir, { intermediates: true });
  }

  // Lấy extension từ URI (fallback về jpg)
  const ext = sourceUri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const destPath = `${imageDir}${boxId}.${ext}`;

  await FileSystem.copyAsync({ from: sourceUri, to: destPath });
  return destPath;
}

/**
 * Xóa file ảnh cục bộ; bỏ qua lỗi nếu không tồn tại.
 */
async function deleteImageFile(imagePath: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(imagePath);
    if (info.exists) {
      await FileSystem.deleteAsync(imagePath, { idempotent: true });
    }
  } catch {
    // Bỏ qua — không để lỗi ảnh chặn luồng chính
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Kiểm tra unlockDate >= today + 1 ngày (AC-02.1, Q3).
 * Tính theo ngày local, không phải millisecond chính xác.
 */
function validateUnlockDate(unlockDate: string): void {
  const unlock = new Date(unlockDate);
  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);
  minDate.setDate(minDate.getDate() + 1);
  unlock.setHours(0, 0, 0, 0);

  if (unlock < minDate) {
    throw new Error('Ngày mở phải tối thiểu 1 ngày kể từ hôm nay');
  }
}

// ─── Repository API ───────────────────────────────────────────────────────────

/**
 * Tạo hộp mới với atomic transaction (NFR-R1).
 * Thứ tự: copy ảnh → schedule notification → INSERT DB
 * Rollback: hủy notification + xóa ảnh nếu DB lỗi
 */
export async function createBox(input: CreateBoxInput): Promise<Box> {
  // Validate ở business logic layer (thêm lớp bảo vệ dưới UI)
  if (!input.content.trim()) {
    throw new Error('Nội dung hộp không được để trống');
  }
  validateUnlockDate(input.unlockDate);

  const db = await getDatabase();
  const boxId = generateUUID();
  const now = new Date().toISOString();

  // Chuẩn hóa unlockDate về 00:00 local của ngày đó
  const unlockDateObj = new Date(input.unlockDate);
  unlockDateObj.setHours(0, 0, 0, 0);
  const unlockDateStr = unlockDateObj.toISOString();
  const teaserTexts = normalizeTeaserTexts(input.teasers);
  const teaserUnlockAts = computeTeaserUnlockAts(now, unlockDateStr, teaserTexts.length);

  // Step 1: Copy ảnh (nếu có) — ngoài transaction, rollback thủ công nếu cần
  let copiedImagePath: string | null = null;
  if (input.imagePath) {
    try {
      copiedImagePath = await copyImageToDocumentDir(input.imagePath, boxId);
    } catch (imageError) {
      // Caller sẽ xử lý edge case này (toast "Không lưu được ảnh")
      throw Object.assign(
        new Error('IMAGE_COPY_FAILED'),
        { cause: imageError },
      );
    }
  }

  // Step 2: Schedule notification — ngoài transaction, lưu identifier vào DB
  let notificationIdentifier: string | null = null;
  try {
    notificationIdentifier = await scheduleBoxNotification(boxId, unlockDateObj);
  } catch {
    // Notification lỗi không block tạo hộp (AC-08.3)
    notificationIdentifier = null;
  }

  // Step 3: DB transaction — INSERT box + reflection + notification_schedule
  try {
    await db.withTransactionAsync(async () => {
      // Bật foreign_keys cho session này
      await db.execAsync('PRAGMA foreign_keys = ON');

      // INSERT box
      await db.runAsync(
        `INSERT INTO box
           (id, box_type, title, content, opening_note, image_path,
            created_at, unlock_date, is_opened, opened_at, is_deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, 0)`,
        boxId,
        toDbBoxType(input.boxType),
        input.title?.trim() || null,
        input.content.trim(),
        input.openingNote?.trim() || null,
        copiedImagePath,
        now,
        unlockDateStr,
      );

      // INSERT reflection_question (nếu có và không rỗng)
      const questionText = input.reflectionQuestion?.trim();
      if (questionText) {
        await db.runAsync(
          `INSERT INTO reflection_question (id, box_id, question_text, answer, answered_at)
           VALUES (?, ?, ?, NULL, NULL)`,
          generateUUID(),
          boxId,
          questionText,
        );
      }

      // INSERT notification_schedule
      await db.runAsync(
        `INSERT INTO notification_schedule
           (id, box_id, notification_identifier, scheduled_for, is_cancelled)
         VALUES (?, ?, ?, ?, 0)`,
        generateUUID(),
        boxId,
        notificationIdentifier,
        unlockDateStr,
      );

      for (let i = 0; i < teaserTexts.length; i += 1) {
        await db.runAsync(
          `INSERT INTO box_teaser
             (id, box_id, teaser_text, unlock_at, is_system_generated, created_at)
           VALUES (?, ?, ?, ?, 0, ?)`,
          generateUUID(),
          boxId,
          teaserTexts[i],
          teaserUnlockAts[i],
          now,
        );
      }
    });
  } catch (dbError) {
    // Rollback side effects ngoài DB
    if (notificationIdentifier) {
      await cancelBoxNotification(notificationIdentifier).catch(() => {});
    }
    if (copiedImagePath) {
      await deleteImageFile(copiedImagePath).catch(() => {});
    }
    throw dbError;
  }

  // Trả về Box object đầy đủ
  const box = await getBoxById(boxId);
  if (!box) throw new Error('Tạo hộp thất bại — không tìm thấy sau khi lưu');
  return box;
}

/**
 * Lấy tất cả hộp chưa xóa, sắp theo: chưa mở trước, rồi theo unlock_date tăng dần.
 */
export async function getAllBoxes(): Promise<Box[]> {
  const db = await getDatabase();

  const boxRows = await db.getAllAsync<BoxRow>(
    `SELECT * FROM box WHERE is_deleted = 0
     ORDER BY
       CASE WHEN is_opened = 0 THEN 0 ELSE 1 END,
       unlock_date ASC`,
  );

  if (boxRows.length === 0) return [];

  const boxIds = boxRows.map((r) => r.id);
  const placeholders = boxIds.map(() => '?').join(',');

  const reflectionRows = await db.getAllAsync<ReflectionRow>(
    `SELECT * FROM reflection_question WHERE box_id IN (${placeholders})`,
    ...boxIds,
  );

  const notifRows = await db.getAllAsync<NotificationRow>(
    `SELECT * FROM notification_schedule WHERE box_id IN (${placeholders})`,
    ...boxIds,
  );

  const teaserRows = await db.getAllAsync<TeaserRow>(
    `SELECT * FROM box_teaser
     WHERE box_id IN (${placeholders})
     ORDER BY unlock_at ASC`,
    ...boxIds,
  );

  const reflectionMap = new Map(reflectionRows.map((r) => [r.box_id, r]));
  const notifMap = new Map(notifRows.map((r) => [r.box_id, r]));
  const teaserMap = new Map<string, BoxTeaser[]>();
  teaserRows.forEach((row) => {
    const teaser = rowToTeaser(row);
    const current = teaserMap.get(row.box_id) ?? [];
    current.push(teaser);
    teaserMap.set(row.box_id, current);
  });

  return boxRows.map((row) =>
    rowToBox(
      row,
      reflectionMap.get(row.id) ?? null,
      notifMap.get(row.id) ?? null,
      teaserMap.get(row.id) ?? [],
    ),
  );
}

/**
 * Lấy một hộp theo id.
 */
export async function getBoxById(id: string): Promise<Box | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<BoxRow>(
    'SELECT * FROM box WHERE id = ? AND is_deleted = 0',
    id,
  );
  if (!row) return null;

  const reflection = await db.getFirstAsync<ReflectionRow>(
    'SELECT * FROM reflection_question WHERE box_id = ?',
    id,
  );

  const notif = await db.getFirstAsync<NotificationRow>(
    'SELECT * FROM notification_schedule WHERE box_id = ?',
    id,
  );

  const teaserRows = await db.getAllAsync<TeaserRow>(
    'SELECT * FROM box_teaser WHERE box_id = ? ORDER BY unlock_at ASC',
    id,
  );

  return rowToBox(row, reflection ?? null, notif ?? null, teaserRows.map(rowToTeaser));
}

/**
 * Xóa hộp: hard delete — CASCADE xóa reflection + notification_schedule,
 * hủy notification, xóa file ảnh.
 */
export async function deleteBox(id: string): Promise<void> {
  const db = await getDatabase();

  // Lấy thông tin cần thiết trước khi xóa
  const row = await db.getFirstAsync<BoxRow>(
    'SELECT image_path FROM box WHERE id = ?',
    id,
  );
  const notif = await db.getFirstAsync<NotificationRow>(
    'SELECT notification_identifier FROM notification_schedule WHERE box_id = ?',
    id,
  );

  await db.execAsync('PRAGMA foreign_keys = ON');

  // Hard delete — CASCADE xử lý reflection + notification_schedule + box_teaser
  await db.runAsync('DELETE FROM box WHERE id = ?', id);

  // Hủy notification (AC-08.4)
  if (notif?.notification_identifier) {
    await cancelBoxNotification(notif.notification_identifier).catch(() => {});
  }

  // Xóa ảnh
  if (row?.image_path) {
    await deleteImageFile(row.image_path).catch(() => {});
  }
}

/**
 * Cập nhật trạng thái hộp sang opened (F-06).
 * Chỉ cho phép chuyển từ chưa mở → đã mở.
 */
export async function openBox(id: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `UPDATE box
     SET is_opened = 1, opened_at = ?
     WHERE id = ?
       AND is_deleted = 0
       AND is_opened = 0
       AND unlock_date <= ?`,
    now,
    id,
    now,
  );

  if (result.changes === 0) {
    const box = await getBoxById(id);
    if (!box) throw new Error('BOX_NOT_FOUND');
    if (box.openedAt) return;
    throw new Error('BOX_NOT_READY');
  }
}

/**
 * Lưu câu trả lời reflection question (F-07).
 */
export async function answerReflectionQuestion(
  boxId: string,
  answer: 'yes' | 'no',
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE reflection_question
     SET answer = ?, answered_at = ?
     WHERE box_id = ?`,
    answer,
    now,
    boxId,
  );
}
