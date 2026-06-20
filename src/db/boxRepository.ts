// FutureBoxes — Box Repository
// Toàn bộ CRUD cho box, reflection_question, notification_schedule.
// Schema: xem design/database/schema.md

import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { getDatabase } from './database';
import {
  cancelBoxNotification,
  scheduleCuriosityNotifications,
} from '../services/notificationService';
import { Box, BoxPrediction, BoxStatus, BoxTeaser, BoxType } from '../types/box';

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
  question_text: string | null;
  answer: string | null;
  answered_at: string | null;
  reflection_note: string | null;
  rating: number | null;
  updated_at: string | null;
}

interface NotificationRow {
  id: string;
  box_id: string;
  kind: string;
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

interface PredictionRow {
  id: string;
  box_id: string;
  prediction_text: string;
  created_at: string;
  updated_at: string | null;
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
  prediction: PredictionRow | null,
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
    reflectionNote: reflection?.reflection_note ?? undefined,
    reflectionRating: reflection?.rating ?? undefined,
    reflectionUpdatedAt: reflection?.updated_at ?? undefined,
    prediction: prediction ? rowToPrediction(prediction) : undefined,
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

function rowToPrediction(row: PredictionRow): BoxPrediction {
  return {
    id: row.id,
    boxId: row.box_id,
    predictionText: row.prediction_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

function normalizeTeaserTexts(teasers?: string[]): string[] {
  return (teasers ?? [])
    .map((text) => text.trim())
    .filter((text) => text.length > 0)
    .slice(0, 3)
    .map((text) => text.slice(0, 160));
}

function normalizePredictionText(text: string): string {
  return text.trim().slice(0, 500);
}

function normalizeReflectionNote(text?: string): string {
  return (text ?? '').trim().slice(0, 1000);
}

function normalizeReflectionRating(rating?: number | null): number | null {
  if (rating === undefined || rating === null) return null;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('INVALID_REFLECTION_RATING');
  }
  return rating;
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
  const scheduledNotifications = await scheduleCuriosityNotifications(boxId, unlockDateObj);

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
      for (const notification of scheduledNotifications) {
        await db.runAsync(
          `INSERT INTO notification_schedule
             (id, box_id, kind, notification_identifier, scheduled_for, is_cancelled)
           VALUES (?, ?, ?, ?, ?, 0)`,
          generateUUID(),
          boxId,
          notification.kind,
          notification.identifier,
          notification.scheduledFor,
        );
      }

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
    for (const notification of scheduledNotifications) {
      if (notification.identifier) {
        await cancelBoxNotification(notification.identifier).catch(() => {});
      }
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

  const predictionRows = await db.getAllAsync<PredictionRow>(
    `SELECT * FROM box_prediction WHERE box_id IN (${placeholders})`,
    ...boxIds,
  );

  const reflectionMap = new Map(reflectionRows.map((r) => [r.box_id, r]));
  const predictionMap = new Map(predictionRows.map((r) => [r.box_id, r]));
  const notifMap = new Map<string, NotificationRow>();
  notifRows.forEach((row) => {
    if (row.kind === 'unlock' && !notifMap.has(row.box_id)) {
      notifMap.set(row.box_id, row);
    }
  });
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
      predictionMap.get(row.id) ?? null,
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
    "SELECT * FROM notification_schedule WHERE box_id = ? AND kind = 'unlock' LIMIT 1",
    id,
  );

  const teaserRows = await db.getAllAsync<TeaserRow>(
    'SELECT * FROM box_teaser WHERE box_id = ? ORDER BY unlock_at ASC',
    id,
  );

  const prediction = await db.getFirstAsync<PredictionRow>(
    'SELECT * FROM box_prediction WHERE box_id = ?',
    id,
  );

  return rowToBox(
    row,
    reflection ?? null,
    notif ?? null,
    prediction ?? null,
    teaserRows.map(rowToTeaser),
  );
}

/**
 * Create, update, or delete a prediction while the box is still unopened.
 */
export async function upsertPrediction(
  boxId: string,
  text: string,
): Promise<BoxPrediction | null> {
  const db = await getDatabase();
  await db.execAsync('PRAGMA foreign_keys = ON');

  const box = await db.getFirstAsync<{ id: string; is_opened: number }>(
    'SELECT id, is_opened FROM box WHERE id = ? AND is_deleted = 0',
    boxId,
  );

  if (!box || box.is_opened === 1) {
    throw new Error('BOX_NOT_EDITABLE');
  }

  const predictionText = normalizePredictionText(text);

  if (!predictionText) {
    await db.runAsync('DELETE FROM box_prediction WHERE box_id = ?', boxId);
    return null;
  }

  const existing = await db.getFirstAsync<PredictionRow>(
    'SELECT * FROM box_prediction WHERE box_id = ?',
    boxId,
  );
  const now = new Date().toISOString();

  if (existing) {
    await db.runAsync(
      `UPDATE box_prediction
       SET prediction_text = ?, updated_at = ?
       WHERE box_id = ?`,
      predictionText,
      now,
      boxId,
    );
  } else {
    await db.runAsync(
      `INSERT INTO box_prediction
         (id, box_id, prediction_text, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      generateUUID(),
      boxId,
      predictionText,
      now,
      now,
    );
  }

  const saved = await db.getFirstAsync<PredictionRow>(
    'SELECT * FROM box_prediction WHERE box_id = ?',
    boxId,
  );

  return saved ? rowToPrediction(saved) : null;
}

export async function upsertReflectionNote(
  boxId: string,
  input: { note?: string; rating?: number | null },
): Promise<Pick<Box, 'reflectionNote' | 'reflectionRating' | 'reflectionUpdatedAt'>> {
  const db = await getDatabase();
  await db.execAsync('PRAGMA foreign_keys = ON');

  const box = await db.getFirstAsync<{ id: string; is_opened: number }>(
    'SELECT id, is_opened FROM box WHERE id = ? AND is_deleted = 0',
    boxId,
  );

  if (!box || box.is_opened !== 1) {
    throw new Error('BOX_NOT_OPENED');
  }

  const normalizedNote = normalizeReflectionNote(input.note);
  const reflectionNote = normalizedNote.length > 0 ? normalizedNote : null;
  const reflectionRating = normalizeReflectionRating(input.rating);
  const now = new Date().toISOString();

  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM reflection_question WHERE box_id = ?',
    boxId,
  );

  if (existing) {
    await db.runAsync(
      `UPDATE reflection_question
       SET reflection_note = ?, rating = ?, updated_at = ?
       WHERE box_id = ?`,
      reflectionNote,
      reflectionRating,
      now,
      boxId,
    );
  } else {
    await db.runAsync(
      `INSERT INTO reflection_question
         (id, box_id, question_text, answer, answered_at, reflection_note, rating, updated_at)
       VALUES (?, ?, NULL, NULL, NULL, ?, ?, ?)`,
      generateUUID(),
      boxId,
      reflectionNote,
      reflectionRating,
      now,
    );
  }

  return {
    reflectionNote: reflectionNote ?? undefined,
    reflectionRating: reflectionRating ?? undefined,
    reflectionUpdatedAt: now,
  };
}

/**
 * Xóa hộp: hard delete — CASCADE xóa reflection + notification_schedule +
 * box_prediction, hủy notification, xóa file ảnh.
 */
export async function deleteBox(id: string): Promise<void> {
  const db = await getDatabase();

  // Lấy thông tin cần thiết trước khi xóa
  const row = await db.getFirstAsync<BoxRow>(
    'SELECT image_path FROM box WHERE id = ?',
    id,
  );
  const notifications = await db.getAllAsync<{ notification_identifier: string | null }>(
    'SELECT notification_identifier FROM notification_schedule WHERE box_id = ?',
    id,
  );

  await db.execAsync('PRAGMA foreign_keys = ON');

  // Hard delete — CASCADE xử lý reflection + notification_schedule + box_teaser
  await db.runAsync('DELETE FROM box WHERE id = ?', id);

  // Hủy notification (AC-08.4)
  for (const notification of notifications) {
    if (notification.notification_identifier) {
      await cancelBoxNotification(notification.notification_identifier).catch(() => {});
    }
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
