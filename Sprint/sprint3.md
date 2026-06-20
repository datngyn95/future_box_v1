# Sprint 3 — Curiosity Notification (F-31)

> **Implementation Brief cho Agent-Dev**
> Tác giả: Agent-BA · Ngày: 2026-06-20 · Nhánh: `feature/sprint-03-curiosity-notification`
> Nguồn: PRD v1.2 (§3.5, §4 F-31, §8.4, §9.5, §10 Sprint 3)

---

## 0. Tiền kiểm — Sprint trước & ảnh hưởng

### 0.1. Sprint 2 (Mystery Teaser — F-30) đã hoàn tất ✅

Codebase hiện có:

- **DB version 2** với 4 bảng: `box`, `reflection_question`, `notification_schedule`, `box_teaser` (`src/db/database.ts`).
- `createBox()` (`src/db/boxRepository.ts`) là 1 transaction atomic: INSERT box + reflection + notification_schedule + teaser. Schedule notification **ngoài** transaction, lưu identifier vào DB.
- Teaser hiển thị đúng (chỉ khi `now >= unlock_at` và hộp còn locked) ở `app/box/[id]/locked.tsx`; badge "Có gợi ý mới" ở Home.
- Deep link notification (`app/_layout.tsx`) đọc `boxId` từ payload → điều hướng theo `getBoxStatus` (opened → detail, ready → pre-open, locked → locked). **Đã đúng, robust.**

### 0.2. Trạng thái notification hiện tại (F-08)

| Thành phần | Hành vi hiện tại |
|-----------|------------------|
| `scheduleBoxNotification(boxId, unlockDate)` | Lên lịch **1** notification duy nhất tại `unlockDate`, body "Một hộp thời gian đã sẵn sàng mở! 📦", payload `{ boxId }`. |
| `createBox` | Gọi schedule 1 lần → INSERT **1** row `notification_schedule` (kể cả khi identifier = null). |
| `deleteBox` | Đọc **1** row (`getFirstAsync`) → hủy 1 identifier (AC-08.4). |
| `getAllBoxes` / `getBoxById` | Map `box_id → 1 notif row` (giả định 1-1). |
| Deep link | Đọc `boxId`, điều hướng theo status. |

### 0.3. ⚠️ BLOCKER chính (đã ghi nhận từ Sprint 2 §11 R2)

> **`notification_schedule.box_id` đang có ràng buộc `UNIQUE`** → mỗi hộp chỉ chứa được **1** notification. F-31 cần **nhiều** notification/hộp (tối đa 4: `unlock`, `teaser_30d`, `teaser_7d`, `teaser_1d`).

→ Sprint 3 **bắt buộc** migration **nới** ràng buộc `UNIQUE` + thêm cột `kind`. SQLite **không** hỗ trợ `DROP CONSTRAINT`/sửa `UNIQUE` bằng `ALTER` → phải **rebuild bảng** (tạo bảng mới, copy data, drop, rename). Xem §5.

### 0.4. Ảnh hưởng & điểm chạm

| Điểm chạm | Ảnh hưởng |
|-----------|-----------|
| `notification_schedule` UNIQUE | Phải rebuild bảng (migration v2→v3), gán `kind='unlock'` cho data cũ. |
| `createBox` | Thay 1 schedule → **N schedule** (lọc mốc hợp lệ), INSERT **N row** trong cùng transaction. Giữ atomic. |
| `deleteBox` | Đổi `getFirstAsync` → `getAllAsync`, hủy **tất cả** identifier (AC-31.5). |
| `getAllBoxes` / `getBoxById` | Bảng giờ có nhiều row/hộp → `notifMap` 1-1 sẽ collapse. Phải chọn row `kind='unlock'` cho `box.notificationIdentifier` (hoặc bỏ qua — field này không dùng ở UI). |
| `addNotificationResponseListener` | Giữ điều hướng theo status (đã đúng). Thêm đọc `kind` từ payload là **tùy chọn** (analytics/forward-compat). |
| `box_teaser` (F-30) | **KHÔNG đụng.** Mốc notification F-31 tính **độc lập** với `unlock_at` của teaser (đã thống nhất ở sprint2 §4.2). |

---

## 1. Mục tiêu Sprint

Ngoài notification "ngày mở" (F-08), lên lịch thêm các notification **gợi tò mò** trước ngày mở tại các mốc **30 ngày / 7 ngày / 1 ngày** trước `unlockDate`, nếu mốc đó còn nằm trong tương lai. Nội dung notification **không** tiết lộ nội dung hộp, chỉ khơi gợi cảm xúc và kéo người dùng quay lại app. Khi nhấn notification → deep link đúng màn. Khi xóa hộp → hủy **toàn bộ** notification của hộp.

**Ngoài phạm vi sprint này (KHÔNG làm):**

- Notification "Hộp đã bắt đầu ngủ yên" (biến thể optional ở AC-31.2) — chọn nhánh **"bỏ qua mốc đã quá hạn"**, không thêm loại notification mới.
- Reschedule lại notification khi mở lại app / khi OS bỏ qua / khi đổi timezone (NFR-R4 mức cao) — giữ hành vi hiện tại (chỉ schedule lúc tạo hộp). Ghi nhận ở §11 R4.
- Track trạng thái "đã đọc/đã nhấn" notification.
- Notification gắn nội dung teaser thật (teaser_30d/7d/1d **không** in `teaser_text` ra notification — chỉ dùng câu mẫu cố định). Tránh lộ nội dung do người dùng tự viết qua màn hình khóa thiết bị.
- Cho phép người dùng bật/tắt từng loại notification (Settings) — không có trong PRD F-31.
- Mọi tính năng V2: account, cloud sync, gửi hộp cho người khác, hộp nhóm, public box.

---

## 2. Feature ID liên quan

- **F-31 — Curiosity Notification** (Should, V1). Phụ thuộc: **F-08** (notification ngày mở) và **F-30** (teaser) — cả hai đã có.
- Tham chiếu AC: **AC-31.1 → AC-31.5** (PRD §4). Không hồi quy **AC-08.1 → AC-08.4**.
- Data model: PRD §9.5 (thêm cột `kind` vào `notification_schedule`).

---

## 3. User Stories

| ID | Story |
|----|-------|
| US-1 | Là người dùng, tôi muốn được nhắc nhẹ khi hộp còn 30/7/1 ngày nữa mở, để cảm thấy hồi hộp và quay lại app. |
| US-2 | Là người dùng, tôi muốn notification **không tiết lộ** nội dung hộp, chỉ gợi tò mò. |
| US-3 | Là người dùng, khi nhấn notification "sắp mở", tôi được đưa vào màn hộp đang khóa (xem countdown/teaser). |
| US-4 | Là người dùng, khi nhấn notification "ngày mở", tôi được đưa vào màn sẵn sàng mở / pre-open. |
| US-5 | Là người dùng, khi xóa hộp, tôi muốn mọi notification đã đặt cho hộp đó biến mất, không bị nhắc về hộp đã xóa. |
| US-6 | Là người dùng từ chối quyền notification, tôi vẫn dùng app bình thường, chỉ không nhận nhắc đẩy. |

---

## 4. Business Rules

### 4.1. Các loại notification (PRD §8.4)

| `kind` | Mốc thời điểm gửi | Nội dung mẫu (body) | Điều hướng khi nhấn |
|--------|-------------------|---------------------|---------------------|
| `teaser_30d` | `unlockDate − 30 ngày` | "Một gợi ý mới vừa được mở trong hộp tương lai của bạn. ✨" | Locked Box Detail |
| `teaser_7d` | `unlockDate − 7 ngày` | "Chỉ còn 7 ngày nữa. Bạn còn nhớ mình đã viết gì không? 🤔" | Locked Box Detail |
| `teaser_1d` | `unlockDate − 1 ngày` | "Ngày mai hộp của bạn sẽ mở. Có hồi hộp không? 🎁" | Locked Box Detail |
| `unlock` | `unlockDate` | "Một hộp thời gian đã sẵn sàng mở! 📦" (giữ nguyên F-08) | Ready To Open / Pre-open |

- `title` mọi notification: `"FutureBoxes"` (nhất quán F-08).
- Mọi notification mang payload `data: { boxId, kind }` (AC-31.3/31.4 + PRD §8.4 "phải có `boxId` và `kind`").
- Câu mẫu **cố định**, **không** chèn `title` hộp, `content`, hay `teaser_text` (xem §0.1 / NFR-U5).

### 4.2. Quy tắc tính mốc & lọc (AC-31.1, AC-31.2)

Hàm thuần `computeNotificationMarks(unlockDate: Date, now: Date): { kind, date }[]`:

1. Sinh 4 ứng viên:
   - `teaser_30d` = `unlockDate − 30 ngày`
   - `teaser_7d`  = `unlockDate − 7 ngày`
   - `teaser_1d`  = `unlockDate − 1 ngày`
   - `unlock`     = `unlockDate`
2. **Chỉ giữ** mốc có `date.getTime() > now.getTime()` (strictly tương lai) → AC-31.2 "chỉ schedule nếu thời điểm gửi nằm trong tương lai".
3. Mốc quá hạn → **bỏ qua** (không chuyển thành loại notification khác).
4. `unlockDate` truyền vào là `unlockDateObj` đã chuẩn hóa **00:00 local** trong `createBox` (giữ nguyên múi giờ khi trừ ngày).

**Hệ quả theo khoảng cách tạo→mở (min = +1 ngày theo Q3):**

| Khoảng cách | Mốc được schedule |
|-------------|-------------------|
| 1 ngày | `unlock` (teaser_1d = ngày tạo → không strictly future → bỏ) |
| 2 ngày | `teaser_1d`, `unlock` |
| 7–29 ngày | `teaser_7d`, `teaser_1d`, `unlock` (teaser_30d quá khứ → bỏ) |
| đúng 30 ngày | `teaser_7d`, `teaser_1d`, `unlock` (teaser_30d = ngày tạo → bỏ) |
| > 30 ngày | cả 4 mốc |

→ Đây chính là minh hoạ AC-31.2 ("hộp mở sau đúng 1 tháng, mốc 30 ngày có thể được bỏ qua").

### 4.3. Quyền & độ bền (AC-31.1, AC-08.3)

- Chỉ schedule notification của hệ thống nếu **đã được cấp quyền**. Xin quyền **1 lần** cho cả lô (tái dùng `requestNotificationPermission`).
- Từ chối quyền → **không** throw, app vẫn tạo hộp bình thường (giữ AC-08.3). Khi đó các row `notification_schedule` vẫn được INSERT với `notification_identifier = NULL` (lưu vết mốc dự kiến, đồng nhất hành vi hiện tại với null identifier).
- Notification **không** phải core → mọi lỗi schedule bị nuốt (try/catch), không block tạo hộp.

### 4.4. Atomic (NFR-R1)

- Schedule notification (gọi OS) chạy **ngoài** `db.withTransactionAsync` (giống hiện tại), thu thập danh sách `{ kind, scheduledFor, identifier }`.
- INSERT **tất cả** row `notification_schedule` **trong** transaction cùng box/reflection/teaser.
- Nếu transaction lỗi → rollback: hủy **mọi** identifier đã schedule (lặp qua danh sách) + xóa ảnh (đã có).

### 4.5. Xóa hộp (AC-31.5)

- `deleteBox` đọc **tất cả** row `notification_schedule` của `box_id` (`getAllAsync`), hủy **từng** `notification_identifier` không null.
- `DELETE FROM box` + CASCADE vẫn xóa các row `notification_schedule` (FK CASCADE giữ nguyên). Phải bật `PRAGMA foreign_keys = ON` (đã có).

### 4.6. Không lộ nội dung hộp khóa

- Notification body là câu mẫu cố định, **không** chứa dữ liệu hộp.
- Deep link `teaser_*` → màn **Locked** (không lộ content). `unlock` → **pre-open** (chưa lộ content, còn CTA "Mở hộp"). Cả hai đều an toàn. Màn detail (đã mở) chỉ tới qua status khi hộp thực sự opened.

---

## 5. Data Model / Migration

### 5.1. Thay đổi `notification_schedule` (PRD §9.5)

| Field | Trước | Sau |
|-------|-------|-----|
| `box_id` | `TEXT NOT NULL UNIQUE` | `TEXT NOT NULL` (**bỏ UNIQUE**) |
| `kind` | — | `TEXT NOT NULL DEFAULT 'unlock'` CHECK in (`unlock`,`teaser_30d`,`teaser_7d`,`teaser_1d`) (**mới**) |
| còn lại | giữ nguyên | giữ nguyên |

### 5.2. Migration an toàn (version 2 → 3) — REBUILD bảng

Trong `src/db/database.ts`:

1. Tăng `const DATABASE_VERSION = 3`.
2. **Append** block `currentVersion === 2` — KHÔNG sửa block `=== 0` và `=== 1`:

```ts
if (currentVersion === 2) {
  await db.execAsync(`
    PRAGMA foreign_keys = OFF;

    CREATE TABLE notification_schedule_new (
      id                      TEXT PRIMARY KEY NOT NULL,
      box_id                  TEXT NOT NULL,
      kind                    TEXT NOT NULL DEFAULT 'unlock'
                                CHECK (kind IN ('unlock','teaser_30d','teaser_7d','teaser_1d')),
      notification_identifier TEXT,
      scheduled_for           TEXT NOT NULL,
      is_cancelled            INTEGER NOT NULL DEFAULT 0 CHECK (is_cancelled IN (0,1)),
      FOREIGN KEY (box_id) REFERENCES box(id) ON DELETE CASCADE
    );

    INSERT INTO notification_schedule_new
      (id, box_id, kind, notification_identifier, scheduled_for, is_cancelled)
    SELECT id, box_id, 'unlock', notification_identifier, scheduled_for, is_cancelled
    FROM notification_schedule;

    DROP TABLE notification_schedule;
    ALTER TABLE notification_schedule_new RENAME TO notification_schedule;

    CREATE INDEX IF NOT EXISTS idx_notif_box      ON notification_schedule (box_id);
    CREATE INDEX IF NOT EXISTS idx_notif_box_kind ON notification_schedule (box_id, kind);

    PRAGMA foreign_keys = ON;
  `);
  currentVersion = 3;
}
```

3. Dòng cuối `PRAGMA user_version = ${DATABASE_VERSION}` tự cập nhật.

**Yêu cầu migration:**
- `PRAGMA foreign_keys = OFF` **trước** khi DROP/RENAME (theo quy trình rebuild bảng chuẩn của SQLite), bật lại `ON` ở cuối block.
- Data cũ được bảo toàn, mọi row hiện hữu gán `kind = 'unlock'`.
- Không đụng `box`, `reflection_question`, `box_teaser`.
- Không có bảng nào tham chiếu tới `notification_schedule` → DROP an toàn (chỉ nó tham chiếu `box`).
- App version 2 (có hộp + notification cũ) nâng lên 3 phải mượt; hộp cũ vẫn có đúng 1 row `kind='unlock'`.

> ⚠️ Vì là rebuild (DROP/RENAME), **bắt buộc** test migration trên DB đã có dữ liệu version 2 (test case D).

### 5.3. Cập nhật type DB row

`NotificationRow` (trong `boxRepository.ts`) thêm `kind: string`.

---

## 6. Danh sách Task cần code

### Tầng Service (`src/services/notificationService.ts`)
1. Thêm `export type NotificationKind = 'unlock' | 'teaser_30d' | 'teaser_7d' | 'teaser_1d';`
2. Thêm map nội dung theo kind (title/body cố định theo bảng §4.1).
3. Thêm hàm thuần `computeNotificationMarks(unlockDate: Date, now: Date): { kind: NotificationKind; date: Date }[]` theo §4.2 (export để test).
4. Thêm `scheduleCuriosityNotifications(boxId: string, unlockDate: Date): Promise<{ kind: NotificationKind; scheduledFor: string; identifier: string | null }[]>`:
   - Xin quyền 1 lần; nếu từ chối → vẫn trả về danh sách mốc hợp lệ với `identifier = null` (để createBox lưu vết). Nếu được cấp → schedule từng mốc, payload `{ boxId, kind }`, body theo map.
   - Bọc try/catch toàn hàm; lỗi → trả `[]` hoặc danh sách identifier null (không throw).
5. (Giữ) `cancelBoxNotification` không đổi. `scheduleBoxNotification` cũ: `createBox` **chuyển sang** dùng hàm mới; có thể giữ hàm cũ (không xóa để tránh refactor lan rộng) hoặc xóa nếu chắc chắn không còn caller (verify bằng grep).
6. (Tùy chọn) `addNotificationResponseListener` đọc thêm `kind` từ payload — **giữ điều hướng theo status** (đã đúng & robust với lệch giờ). Không bắt buộc đổi.

### Tầng Data (`src/db/boxRepository.ts`)
7. `NotificationRow` thêm `kind`.
8. `createBox`:
   - Thay khối schedule 1 notification → gọi `scheduleCuriosityNotifications(boxId, unlockDateObj)` (ngoài transaction), thu `scheduled` list.
   - Trong transaction: thay 1 INSERT `notification_schedule` → **loop INSERT** từng phần tử (`id` UUID mới, `box_id`, `kind`, `notification_identifier`, `scheduled_for`, `is_cancelled=0`).
   - Rollback (catch): hủy **mọi** identifier trong `scheduled` (lặp `cancelBoxNotification`), giữ xóa ảnh.
9. `deleteBox`:
   - Đổi `getFirstAsync` → `getAllAsync<NotificationRow>('SELECT notification_identifier FROM notification_schedule WHERE box_id = ?', id)`.
   - Lặp hủy từng `notification_identifier` không null.
10. `getAllBoxes` / `getBoxById`:
    - Bảng giờ nhiều row/hộp. Sửa `notifMap` để chọn row `kind='unlock'` (hoặc row đầu) cho `box.notificationIdentifier`; tránh để `new Map(...)` ghi đè sai. (Field này không hiển thị UI — chỉ cần không vỡ.)

### Tài liệu (bắt buộc theo CLAUDE.md)
11. `CLAUDE.md` (mục Kiến trúc): DB version 2→3; `notification_schedule` thêm `kind`, bỏ UNIQUE; nhiều notification/hộp; liệt kê 4 kind.
12. `design/database/schema.md`: cập nhật bảng `notification_schedule` (cột `kind`, bỏ UNIQUE).
13. `design/flows/F08-notification.md`: bổ sung mốc 30/7/1 ngày + deep link theo kind (hoặc tạo ghi chú F-31).

---

## 7. File/Module cần SỬA

| File | Thay đổi |
|------|----------|
| `src/db/database.ts` | `DATABASE_VERSION = 3` + block migration `currentVersion === 2` (rebuild `notification_schedule`). |
| `src/services/notificationService.ts` | `NotificationKind`, content map, `computeNotificationMarks`, `scheduleCuriosityNotifications`; (tùy chọn) đọc `kind` ở listener. |
| `src/db/boxRepository.ts` | `NotificationRow.kind`; `createBox` schedule+insert N notification; `deleteBox` hủy tất cả; `getAllBoxes`/`getBoxById` chọn row `unlock`. |
| `CLAUDE.md` | Cập nhật kiến trúc DB v3 + notification kinds. |
| `design/database/schema.md` | Cập nhật schema `notification_schedule`. |
| `design/flows/F08-notification.md` | Bổ sung mốc curiosity + deep link theo kind. |

## 8. File/Module cần TẠO MỚI

| File | Mục đích | Ghi chú |
|------|----------|---------|
| `src/constants/notifications.ts` *(tùy chọn)* | Tách `NotificationKind` + map nội dung (title/body theo kind) khỏi service cho gọn. | Không bắt buộc; nếu nhỏ có thể để ngay trong `notificationService.ts`. **Không** tạo bảng/màn hình mới. |

> F-31 **không** thêm màn hình. Chỉ mở rộng service + data + (tùy chọn) đọc `kind` ở deep link đã có.

---

## 9. Acceptance Criteria (PRD §4)

| AC | Tiêu chí | Cách đạt |
|----|----------|----------|
| **AC-31.1** | Đến các mốc hợp lệ trước ngày mở → gửi notification gợi tò mò (đã cấp quyền). | `scheduleCuriosityNotifications` schedule mốc 30/7/1 ngày + unlock. |
| **AC-31.2** | Chỉ schedule mốc nằm trong tương lai; hộp mở đúng 1 tháng có thể bỏ mốc 30 ngày. | `computeNotificationMarks` lọc `date > now`; mốc quá hạn bị bỏ. |
| **AC-31.3** | Nhấn notification teaser → màn Locked của hộp. | Deep link theo status: teaser fire khi còn locked → màn locked. Payload mang `kind`. |
| **AC-31.4** | Nhấn notification ngày mở → màn Ready To Open / Pre-open. | `unlock` fire khi `now ≥ unlockDate` → status `ready_to_open` → pre-open. |
| **AC-31.5** | Xóa hộp → hủy **tất cả** notification của hộp. | `deleteBox` getAllAsync + hủy từng identifier + CASCADE xóa row. |
| (Giữ) AC-08.1–08.4 | Không hồi quy notification ngày mở & hủy khi xóa. | `unlock` giữ nội dung & hành vi cũ. |
| (Ngầm, NFR-U5) | Notification không lộ nội dung hộp. | Body là câu mẫu cố định, không chèn dữ liệu hộp. |

---

## 10. Test case thủ công

> Mẹo test mốc xa: đổi đồng hồ thiết bị, hoặc tạm tạo hộp `unlockDate` gần (ví dụ +2 ngày để thấy `teaser_1d` + `unlock`). Vì notification nền khó test tức thì, ưu tiên kiểm DB + log số mốc đã schedule.

**A. Schedule đúng số mốc**
1. Tạo hộp `unlockDate = +1 ngày` → ✔ DB `notification_schedule` có **1** row `kind='unlock'`.
2. Tạo hộp `+2 ngày` → ✔ **2** row: `teaser_1d`, `unlock`.
3. Tạo hộp `+10 ngày` → ✔ **3** row: `teaser_7d`, `teaser_1d`, `unlock`.
4. Tạo hộp `+60 ngày` → ✔ **4** row: `teaser_30d`, `teaser_7d`, `teaser_1d`, `unlock`.
5. Tạo hộp `+30 ngày` chẵn → ✔ **3** row (teaser_30d bị bỏ vì = ngày tạo, không strictly future).

**B. Quyền**
6. Từ chối quyền notification → tạo hộp → ✔ hộp tạo thành công, không crash; row `notification_schedule` vẫn có nhưng `notification_identifier = NULL`.
7. Cấp quyền → tạo hộp → ✔ row có `notification_identifier` không null cho mốc tương lai.

**C. Deep link**
8. (Giả lập) nhấn notification `unlock` của hộp đã đến hạn → ✔ mở **pre-open** (AC-31.4).
9. (Giả lập) nhấn notification `teaser_*` khi hộp còn khóa → ✔ mở màn **locked** (AC-31.3).
10. Nhấn notification của hộp đã bị xóa → ✔ không crash, fallback về Home.

**D. Migration (BẮT BUỘC — rebuild bảng)**
11. Cài bản **version 2** có sẵn hộp + notification → cập nhật build mới → mở app → ✔ không crash; `PRAGMA user_version = 3`; mỗi hộp cũ có đúng 1 row `kind='unlock'`, `notification_identifier` cũ giữ nguyên.
12. Sau migration, mở 1 hộp cũ đã đến hạn → ✔ vẫn mở bình thường (không hồi quy F-06/F-08).

**E. Xóa & toàn vẹn (AC-31.5)**
13. Tạo hộp `+60 ngày` (4 mốc) → xóa hộp → ✔ `SELECT * FROM notification_schedule WHERE box_id=?` trả **0** row; **tất cả** identifier đã được gọi hủy.
14. Xóa hộp khi đã cấp quyền & có notification thật đã đặt → ✔ không còn notification nào của hộp đó được OS giữ lại (kiểm bằng `getAllScheduledNotificationsAsync` nếu cần).

**F. Atomic**
15. (Nếu giả lập được lỗi DB giữa transaction) → ✔ không có hộp "mồ côi"; mọi notification đã schedule cho hộp lỗi đều bị hủy (rollback).

**G. Không lộ nội dung**
16. Đọc body mọi notification đã đặt → ✔ chỉ là câu mẫu cố định, không chứa `title`/`content`/`teaser_text` của hộp.

---

## 11. Rủi ro cần lưu ý

| # | Rủi ro | Hướng xử lý |
|---|--------|-------------|
| R1 | **Rebuild bảng trên DB version 2 có dữ liệu** (DROP/RENAME). Sai → mất notification_schedule cũ. | Theo đúng SQL §5.2 (FK OFF → copy → drop → rename → index → FK ON). Test D11/D12 bắt buộc. Chỉ append block `=== 2`, KHÔNG sửa block cũ. |
| R2 | **Giới hạn notification của OS.** iOS giữ tối đa ~64 pending; nhiều hộp × tối đa 4 notification có thể chạm trần. | Ghi nhận; V1 chưa cần dồn/ưu tiên. Nếu cần sau: ưu tiên mốc gần nhất. Ngoài scope sprint này. |
| R3 | **Notification nửa đêm.** Mốc tính từ `unlockDate` 00:00 local → notification bắn ~00:00. | Nhất quán với F-08 hiện tại (unlock cũng 00:00). Không đổi ở sprint này; nếu muốn dời sang khung giờ "đẹp" → đề xuất sprint sau. |
| R4 | **Mốc lệch khi đổi timezone / OS bỏ notification / cài lại app** (NFR-R4). | Sprint 3 chỉ schedule lúc tạo (như F-08). Reschedule-on-reopen để dành sprint sau; ghi nhận, không làm. |
| R5 | **`box.notificationIdentifier` (single) không còn 1-1** sau khi có nhiều row. | Field này chỉ dùng nội bộ (grep: không có ở `app/`). Map từ row `kind='unlock'`; `deleteBox` hủy bằng query DB trực tiếp (không phụ thuộc field này). |
| R6 | **Từ chối quyền** giữa lô schedule. | Xin quyền 1 lần đầu hàm; từ chối → identifier null toàn bộ, không throw, hộp vẫn tạo (AC-08.3). |
| R7 | **Lộ nội dung qua notification.** | Body cố định, không chèn dữ liệu hộp; teaser_* dẫn về màn locked. Test G16. |
| R8 | **Đụng nhầm `box_teaser`.** | Mốc F-31 tính độc lập bằng `computeNotificationMarks`, KHÔNG đọc `box_teaser.unlock_at`. |

---

## 12. Prompt giao Agent-Dev

```
Bạn là Agent-Dev (React Native / Expo SDK 54). Triển khai Sprint 3 — Curiosity Notification (F-31)
theo file Sprint/sprint3.md. Đọc kỹ sprint3.md trước khi code, bám đúng scope, KHÔNG thêm tính năng ngoài PRD.

Phạm vi:
1. Migration DB an toàn version 2 → 3 (src/db/database.ts): REBUILD bảng notification_schedule để
   BỎ ràng buộc UNIQUE(box_id) và THÊM cột kind TEXT NOT NULL DEFAULT 'unlock'
   CHECK in ('unlock','teaser_30d','teaser_7d','teaser_1d'). Quy trình: PRAGMA foreign_keys=OFF →
   tạo bảng _new → INSERT...SELECT (gán kind='unlock' cho data cũ) → DROP cũ → RENAME → tạo lại
   index idx_notif_box + idx_notif_box_kind → foreign_keys=ON. CHỈ append block currentVersion===2,
   KHÔNG sửa block cũ.
2. notificationService.ts: thêm NotificationKind; map title/body cố định theo kind (bảng §4.1);
   computeNotificationMarks(unlockDate, now) -> mốc 30/7/1 ngày + unlock, CHỈ giữ mốc strictly > now;
   scheduleCuriosityNotifications(boxId, unlockDate) -> xin quyền 1 lần, schedule từng mốc với
   payload { boxId, kind }, trả danh sách { kind, scheduledFor, identifier|null }; không throw.
3. boxRepository.ts: NotificationRow thêm kind; createBox gọi scheduleCuriosityNotifications (ngoài
   transaction) rồi loop INSERT N row notification_schedule TRONG transaction; rollback hủy mọi
   identifier; deleteBox đổi sang getAllAsync + hủy TẤT CẢ identifier; getAllBoxes/getBoxById chọn
   row kind='unlock' cho notificationIdentifier (không vỡ khi nhiều row/hộp).
4. Deep link (app/_layout.tsx): GIỮ điều hướng theo status (đã đúng). Đọc thêm kind từ payload là tùy chọn.
5. Cập nhật CLAUDE.md, design/database/schema.md, design/flows/F08-notification.md.

Ràng buộc bắt buộc:
- Notification body là câu mẫu CỐ ĐỊNH, TUYỆT ĐỐI không chèn title/content/teaser_text của hộp.
- Xóa hộp phải hủy TẤT CẢ notification của hộp (AC-31.5) + dựa CASCADE (PRAGMA foreign_keys=ON).
- Chỉ schedule mốc nằm trong tương lai (AC-31.2). Từ chối quyền vẫn tạo hộp bình thường (AC-08.3).
- Giữ createBox atomic (INSERT notification nằm trong db.withTransactionAsync).
- KHÔNG hồi quy notification ngày mở (kind='unlock' giữ nội dung & hành vi F-08).
- KHÔNG đụng box_teaser; mốc F-31 tính độc lập. KHÔNG thêm màn hình, KHÔNG tính năng V2.

Sau khi code: chạy app, làm theo Test case thủ công §10 (đặc biệt D11/D12 migration rebuild và
E13 xóa hộp hủy hết notification), báo lại kết quả từng case.
```

---

*Hết Implementation Brief Sprint 3 — F-31 Curiosity Notification.*
