# Sprint 2 — Mystery Teaser (F-30)

> **Implementation Brief cho Agent-Dev**
> Tác giả: Agent-BA · Ngày: 2026-06-20 · Nhánh: `feature/sprint-02-mystery-teaser`
> Nguồn: PRD v1.2 (§3.5, §4 F-30, §8.3, §9.2, §10 Sprint 2)

---

## 0. Tiền kiểm — Sprint trước & ảnh hưởng

**Sprint 1 (Core Lock & QA) đã hoàn tất.** Codebase hiện có đầy đủ:

- DB version **1** với 3 bảng: `box`, `reflection_question`, `notification_schedule` (`src/db/database.ts`).
- `createBox()` là 1 transaction atomic (`src/db/boxRepository.ts`), validate unlock_date 2 tầng (UI + data).
- Guard mở hộp ở tầng data (`openBox` dùng SQL `unlock_date <= now AND is_opened = 0`).
- Xóa hộp = hard delete + CASCADE + hủy notification + xóa ảnh (AC-08.4 đã đạt).
- Màn Locked (`app/box/[id]/locked.tsx`) chỉ render metadata, **không** lộ content/ảnh (AC-03.1 đã đạt).

**Ảnh hưởng đến Sprint 2:**

| Điểm chạm | Ảnh hưởng |
|-----------|-----------|
| `createBox` transaction | Teaser INSERT phải nằm **trong** cùng `db.withTransactionAsync` để giữ atomic (NFR-R1). |
| `box_teaser` FK CASCADE | Khi `deleteBox` chạy `DELETE FROM box`, teaser tự xóa theo (AC-30.5). Không cần code xóa thủ công, nhưng **phải** bật `PRAGMA foreign_keys = ON` (đã có sẵn trong cả `createBox` lẫn `deleteBox`). |
| Navigation params (`[type].tsx → confirm-lock.tsx`) | Đang truyền tham số dạng string phẳng. Teaser là mảng → cần serialize (JSON) khi truyền qua router. |
| Store `Box` type | Home + Locked đọc từ `state.boxes`. Để render teaser/badge, `Box` cần mang theo dữ liệu teaser khi `getAllBoxes`. |
| `notification_schedule.box_id` đang **UNIQUE** | **KHÔNG đụng tới trong Sprint 2.** Đây là blocker của Sprint 3 (F-31) — ghi nhận ở §11 Rủi ro, không xử lý ở sprint này. |

> ⚠️ **Database đã release ở version 1** → bắt buộc dùng **migration tăng version (1 → 2)**, KHÔNG sửa block migration cũ.

---

## 1. Mục tiêu Sprint

Cho phép người dùng đính kèm **0–3 gợi ý bí ẩn (teaser)** khi tạo hộp. Mỗi teaser được hệ thống tự gán một mốc thời gian `unlockAt` nằm giữa ngày tạo và ngày mở; teaser **chỉ hiển thị khi đã đến `unlockAt`** và hộp vẫn đang khóa, nhằm khơi gợi tò mò và kéo người dùng quay lại app trong thời gian chờ.

**Ngoài phạm vi sprint này (KHÔNG làm):**

- Curiosity Notification (F-31) — Sprint 3.
- System-generated teaser (teaser do hệ thống tự sinh nội dung). Cột `is_system_generated` vẫn tạo theo PRD nhưng F-30 luôn ghi `0`.
- Theo dõi trạng thái "đã xem / chưa xem" teaser (seen tracking) — xem §11.
- Sửa/xóa teaser sau khi hộp đã khóa (nhất quán Q7: không sửa nội dung sau khóa).
- Mọi tính năng V2: account, cloud sync, gửi hộp cho người khác, hộp nhóm, public box.

---

## 2. Feature ID liên quan

- **F-30 — Mystery Teaser** (Should, V1). Phụ thuộc: F-01, F-03, F-13 (đều đã có).
- Tham chiếu AC: **AC-30.1 → AC-30.5** (PRD §4).
- Data model: PRD §9.2 (bảng `box_teaser`).

---

## 3. User Stories

| ID | Story |
|----|-------|
| US-1 | Là người dùng, khi tạo hộp tôi muốn thêm tối đa 3 gợi ý ngắn để sau này nhận được "mảnh ghép" tò mò trước ngày mở. |
| US-2 | Là người dùng, tôi muốn các gợi ý **lần lượt** xuất hiện theo thời gian chứ không hiện hết ngay, để cảm giác hồi hộp kéo dài. |
| US-3 | Là người dùng xem hộp đang khóa, tôi muốn thấy gợi ý nào đã được mở khóa và biết còn gợi ý đang chờ. |
| US-4 | Là người dùng ở màn danh sách, tôi muốn thấy dấu hiệu "có gợi ý mới" trên hộp để biết nên mở xem. |
| US-5 | Là người dùng, khi xóa hộp tôi muốn mọi gợi ý liên quan biến mất hoàn toàn. |

---

## 4. Business Rules

### 4.1. Nhập liệu teaser
- Teaser là **optional**; mỗi hộp **tối đa 3** teaser.
- Mỗi teaser **tối đa 160 ký tự**; teaser rỗng (sau `trim()`) bị **loại bỏ**, không lưu.
- Số teaser hợp lệ = số ô có nội dung (1, 2 hoặc 3). Không bắt buộc điền tuần tự.
- Không cho sửa/xóa teaser sau khi hộp đã khóa (chỉ nhập lúc tạo).

### 4.2. Quy tắc tính `unlockAt` — **CHIA ĐỀU KHOẢNG** *(đã chốt)*
Với hộp có `N` teaser hợp lệ (`N` = 1..3), sắp theo thứ tự nhập (teaser 1 → N):

```
unlockAt_i = createdAt + (unlockDate − createdAt) × i / (N + 1)      với i = 1..N
```

- `createdAt`, `unlockDate` lấy đúng giá trị đã chuẩn hóa trong `createBox` (`createdAt` = `now` ISO; `unlockDate` = 00:00 local của ngày mở, đã có sẵn biến `unlockDateObj` / `unlockDateStr`).
- Kết quả luôn **strictly** nằm trong khoảng `(createdAt, unlockDate)` → mọi teaser luôn có mốc hợp lệ, không bao giờ bị bỏ, không bao giờ hiện ngay lúc tạo.
- Lưu `unlockAt` dưới dạng **ISO8601 UTC** (nhất quán với `created_at`).
- Ví dụ hộp 30 ngày, 3 teaser → `+7.5d`, `+15d`, `+22.5d`. Hộp 1 ngày, 2 teaser → `+8h`, `+16h`.

> Ghi chú forward-compat: PRD §8.4 (F-31) đặt tên mốc `teaser_30d/7d/1d`. Quy tắc chia đều **không** trùng các mốc cố định đó → Sprint 3 sẽ tự tính mốc notification riêng, **không** phụ thuộc `unlockAt` của teaser. Đã thống nhất ở §11.

### 4.3. Hiển thị teaser (tầng UI — nhất quán Q4)
- Teaser **chỉ hiển thị khi** `now >= unlockAt` **và** hộp đang ở trạng thái `locked` (chưa mở).
- Teaser **chưa tới `unlockAt`**: không render text ở bất kỳ đâu (Locked, Home, search). Chỉ được phép báo "còn gợi ý đang chờ" dạng đếm số, **không lộ nội dung**.
- Teaser **không thay thế** nội dung chính; teaser không phải content/opening_note/reflection.
- Khi hộp đã `opened`: teaser không còn là trọng tâm — màn detail (đã mở) **không** thuộc scope sprint này; không thêm teaser vào màn detail.

### 4.4. Badge "Có gợi ý mới" (Home — AC-30.4)
- Một hộp **locked** hiển thị badge nếu **có ≥ 1 teaser với `unlockAt <= now`**.
- Badge chỉ là chỉ dấu trực quan, **không** in nội dung teaser ra card Home.
- (Diễn giải "mới/unseen" — xem §11; Sprint 2 dùng định nghĩa "đã tới mốc mở khóa", không track seen.)

### 4.5. Xóa hộp (AC-30.5)
- `deleteBox` giữ nguyên logic hiện tại. FK `ON DELETE CASCADE` của `box_teaser` đảm bảo teaser bị xóa. Dev **phải xác nhận** `PRAGMA foreign_keys = ON` được bật trong session trước `DELETE` (hiện đã có).

---

## 5. Data Model / Migration

### 5.1. Bảng mới `box_teaser` (theo PRD §9.2)

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `id` | TEXT PK | Yes | UUID v4 (expo-crypto) |
| `box_id` | TEXT | Yes | FK → `box(id)` **ON DELETE CASCADE** |
| `teaser_text` | TEXT | Yes | Nội dung gợi ý (≤160 ký tự) |
| `unlock_at` | TEXT (ISO8601 UTC) | Yes | Thời điểm teaser được phép hiển thị |
| `is_system_generated` | INTEGER (0/1) | Yes | F-30 luôn ghi `0` |
| `created_at` | TEXT (ISO8601 UTC) | Yes | Ngày tạo teaser (= `createdAt` của hộp) |

### 5.2. Migration an toàn (version 1 → 2)

Trong `src/db/database.ts`:

1. Tăng `const DATABASE_VERSION = 2`.
2. **Append** block mới — KHÔNG sửa block `currentVersion === 0`:

```ts
if (currentVersion === 1) {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS box_teaser (
      id                   TEXT PRIMARY KEY NOT NULL,
      box_id               TEXT NOT NULL,
      teaser_text          TEXT NOT NULL,
      unlock_at            TEXT NOT NULL,
      is_system_generated  INTEGER NOT NULL DEFAULT 0 CHECK (is_system_generated IN (0,1)),
      created_at           TEXT NOT NULL,
      FOREIGN KEY (box_id) REFERENCES box(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_box_teaser_box_id   ON box_teaser (box_id);
    CREATE INDEX IF NOT EXISTS idx_box_teaser_unlock_at ON box_teaser (unlock_at);
  `);
  currentVersion = 2;
}
```

3. Dòng cuối `PRAGMA user_version = ${DATABASE_VERSION}` đã tự cập nhật.

**Yêu cầu migration:**
- Idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).
- Không drop/alter bảng cũ. Không đụng dữ liệu hộp hiện có.
- App đang cài bản version 1 nâng cấp lên 2 phải chạy mượt, hộp cũ không có teaser vẫn hoạt động bình thường (teaser list rỗng).

---

## 6. Danh sách Task cần code

### Tầng Data
1. **Migration v2**: thêm bảng `box_teaser` + index (§5.2).
2. **Types** (`src/types/box.ts`):
   - Thêm `interface BoxTeaser { id; boxId; teaserText; unlockAt; isSystemGenerated; createdAt }`.
   - Thêm `teasers?: BoxTeaser[]` vào `interface Box` (mặc định `[]` khi load).
3. **Repository** (`src/db/boxRepository.ts` hoặc file mới `src/db/teaserRepository.ts` — xem §8):
   - `CreateBoxInput` thêm `teasers?: string[]` (mảng text thô từ form).
   - Helper `computeTeaserUnlockAts(createdAtISO, unlockDateISO, count): string[]` theo công thức §4.2.
   - Trong `createBox` transaction: sau khi INSERT box, lọc teaser hợp lệ (`trim`, bỏ rỗng, cắt còn tối đa 3, enforce ≤160), tính `unlockAt`, INSERT từng teaser.
   - `rowToBox` / `getAllBoxes` / `getBoxById`: load teaser theo `box_id`, map vào `box.teasers` (sắp `ORDER BY unlock_at ASC`).
   - (Tùy chọn) `getTeasersByBoxId(boxId): Promise<BoxTeaser[]>` để màn Locked gọi trực tiếp nếu không muốn phụ thuộc store.
4. **deleteBox**: không đổi logic; thêm comment xác nhận CASCADE xử lý teaser. Verify `foreign_keys = ON`.

### Tầng UI
5. **Create Box Form** (`app/create-box/[type].tsx`):
   - Thêm `AccordionSection` "GỢI Ý BÍ ẨN" (thu gọn được, mặc định collapsed để form không dài) với helper text *"Những gợi ý nhỏ sẽ xuất hiện trước ngày mở hộp."*
   - 3 ô input teaser, mỗi ô `maxLength={160}`, có counter.
   - State `teasers: string[]` (length 3). Đưa vào params khi `router.push` sang confirm-lock (JSON-encode).
6. **Confirm Lock** (`app/create-box/confirm-lock.tsx`):
   - Nhận param teaser (JSON-decode an toàn, fallback `[]`), truyền vào `createBox({ ..., teasers })` ở **cả 2** nhánh gọi createBox (nhánh chính + nhánh "Khóa không ảnh").
7. **Locked Box Peek** (`app/box/[id]/locked.tsx`):
   - Section "Gợi ý đã mở khóa": render các teaser có `unlockAt <= now` (card list).
   - Nếu có teaser nhưng chưa cái nào mở: hiển thị *"Một vài gợi ý sẽ xuất hiện khi gần đến ngày mở..."* + (tùy chọn) đếm "còn N gợi ý đang chờ".
   - Nếu hộp không có teaser: không render section.
8. **Home / Box List** (`app/(tabs)/index.tsx`):
   - `LockedCard`: thêm badge nhỏ "Có gợi ý mới" (hoặc icon ✨) khi `box.teasers?.some(t => new Date(t.unlockAt) <= now)`. Không in text teaser.

### Tài liệu (bắt buộc theo quy tắc CLAUDE.md)
9. Cập nhật `CLAUDE.md` (mục Kiến trúc): DB version 1→2, bảng `box_teaser`, file/màn liên quan teaser.
10. Cập nhật `design/database/schema.md`: thêm bảng `box_teaser`.

---

## 7. File/Module cần SỬA

| File | Thay đổi |
|------|----------|
| `src/db/database.ts` | `DATABASE_VERSION = 2` + block migration `currentVersion === 1`. |
| `src/types/box.ts` | `BoxTeaser` interface; `teasers?: BoxTeaser[]` trong `Box`. |
| `src/db/boxRepository.ts` | `CreateBoxInput.teasers`; insert teaser trong transaction; load teaser ở `rowToBox`/`getAllBoxes`/`getBoxById`; helper tính `unlockAt`. |
| `app/create-box/[type].tsx` | Accordion + 3 input teaser; truyền teaser sang confirm-lock. |
| `app/create-box/confirm-lock.tsx` | Nhận & truyền teaser vào `createBox` (2 nhánh). |
| `app/box/[id]/locked.tsx` | Section "Gợi ý đã mở khóa" + empty hint. |
| `app/(tabs)/index.tsx` | Badge "Có gợi ý mới" trên `LockedCard`. |
| `CLAUDE.md` | Cập nhật kiến trúc. |
| `design/database/schema.md` | Cập nhật schema. |

## 8. File/Module cần TẠO MỚI

| File | Mục đích | Ghi chú |
|------|----------|---------|
| `src/db/teaserRepository.ts` *(khuyến nghị, tùy chọn)* | Tách query teaser: `getTeasersByBoxId`, `insertTeasers(db, boxId, createdAt, unlockDate, texts)`, `computeTeaserUnlockAts`. | PRD §10 ("Thêm repository/service cho teaser") gợi ý tách file. **Ràng buộc:** `insertTeasers` nhận sẵn `db` và **không** mở transaction riêng — phải chạy bên trong `db.withTransactionAsync` của `createBox`. Nếu thấy phình, có thể gộp vào `boxRepository.ts` — không bắt buộc tạo file mới. |

> Không cần tạo màn hình mới. F-30 chỉ mở rộng các màn đã có.

---

## 9. Acceptance Criteria (PRD §4)

| AC | Tiêu chí | Cách đạt |
|----|----------|----------|
| **AC-30.1** | Thêm tối đa 3 teaser, mỗi teaser ≤160 ký tự. | Form 3 ô `maxLength=160`; data layer cắt ≤3 + enforce ≤160. |
| **AC-30.2** | Teaser có `unlockAt > now` → **chưa hiển thị** ở màn Locked. | Locked filter `unlockAt <= now`. |
| **AC-30.3** | Teaser đã tới `unlockAt` → hiển thị trong khu "Gợi ý đã mở khóa". | Section render danh sách teaser đã mở. |
| **AC-30.4** | Màn danh sách không hiển thị teaser chưa tới mốc; chỉ badge "Có gợi ý mới" khi có teaser vừa mở. | Home chỉ render badge boolean, không in text. |
| **AC-30.5** | Xóa hộp → toàn bộ teaser liên quan bị xóa. | FK CASCADE + `foreign_keys = ON`. |
| (Ngầm) | Teaser không lộ content chính; không hiển thị khi `now < unlockAt`. | Lọc thời gian ở UI; teaser tách bảng riêng. |

---

## 10. Test case thủ công

**A. Tạo hộp có teaser**
1. Tạo hộp, mở accordion "Gợi ý bí ẩn", nhập 3 teaser → khóa hộp. ✔ Hộp tạo thành công, không lỗi.
2. Nhập 1 teaser dài >160 → ✔ bị chặn ở 160 ký tự.
3. Để trống cả 3 ô teaser → khóa → ✔ hộp tạo bình thường, DB không có row teaser nào cho hộp đó.
4. Nhập teaser ô 1 và ô 3, bỏ ô 2 → ✔ lưu đúng 2 teaser (ô rỗng bị loại).

**B. Hiển thị theo thời gian**
5. Hộp mới tạo (chưa tới mốc nào) → mở màn Locked → ✔ không thấy text teaser, thấy hint "sẽ xuất hiện khi gần đến ngày mở".
6. (Giả lập) chỉnh ngày máy vượt qua `unlockAt` của teaser 1 → mở lại Locked → ✔ teaser 1 hiện trong "Gợi ý đã mở khóa", teaser 2/3 vẫn ẩn.
7. Quay lại Home → ✔ card hộp locked có badge "Có gợi ý mới".
8. Tìm kiếm/lọc ở Home → ✔ không nơi nào in nội dung teaser chưa mở.

**C. Xóa & toàn vẹn**
9. Xóa hộp có teaser → kiểm tra DB → ✔ `SELECT * FROM box_teaser WHERE box_id = ?` trả về 0 row.
10. Xóa hộp đang có notification đã lên lịch → ✔ notification vẫn bị hủy (không hồi quy AC-08.4).

**D. Migration**
11. Cài bản version 1 (có sẵn hộp cũ) → cập nhật lên build mới → mở app → ✔ không crash, hộp cũ hiển thị bình thường (teaser rỗng), `PRAGMA user_version` = 2.
12. Tạo hộp không teaser sau migration → ✔ hoạt động như cũ.

**E. Atomic**
13. (Nếu giả lập được lỗi DB giữa transaction) → ✔ không có hộp "mồ côi" và không có teaser rớt lại.

---

## 11. Rủi ro cần lưu ý

| # | Rủi ro | Hướng xử lý |
|---|--------|-------------|
| R1 | **Migration trên máy đã có dữ liệu version 1.** Sửa nhầm block migration cũ sẽ hỏng DB. | Chỉ **append** block `=== 1`; test case D11/D12 bắt buộc. |
| R2 | **`notification_schedule.box_id` đang UNIQUE** → không thể thêm nhiều notification/hộp. | **Ngoài scope Sprint 2.** Ghi chú để Sprint 3 (F-31) xử lý migration nới ràng buộc + thêm cột `kind`. Không đụng ở sprint này. |
| R3 | **"Có gợi ý mới" (unseen) vs "đã tới mốc mở".** PRD §9.2 không có cột seen → track unseen sẽ vượt schema PRD. | Sprint 2 dùng định nghĩa "có teaser `unlockAt <= now`". Việc track "đã xem" để tắt badge đề xuất gộp vào F-31/sau, cần quyết định trước khi mở rộng. |
| R4 | **Truyền mảng teaser qua expo-router params.** Router serialize string. | JSON-encode khi push, JSON-decode an toàn (try/catch → `[]`) ở confirm-lock. Lưu ý truyền vào **cả 2** nhánh gọi `createBox`. |
| R5 | **Lộ nội dung teaser chưa tới mốc.** Nếu load cả teaser chưa mở vào `state.boxes`, text vẫn nằm trong JS memory. | Chấp nhận theo Q4 (khóa tầng UI, teaser là hint do user tự viết, không phải content). Tuyệt đối **không render** teaser chưa tới `unlockAt` ra UI. Nếu muốn chặt hơn: dùng `getTeasersByBoxId` lọc `unlock_at <= now` ngay ở SQL cho màn Locked. |
| R6 | **Đồng hồ thiết bị / timezone.** `unlockAt` so với `now` của máy. | Nhất quán với cơ chế status hiện tại (AC-03.3, A6). Lưu `unlockAt` ISO UTC; so sánh bằng `Date`. Không phát sinh yêu cầu mới. |
| R7 | **Form dài thêm.** Thêm 3 input có thể làm form tạo hộp rối. | Bọc trong `AccordionSection` collapsed mặc định (đã có sẵn component). |

---

## 12. Prompt giao Agent-Dev

```
Bạn là Agent-Dev (React Native / Expo SDK 54). Triển khai Sprint 2 — Mystery Teaser (F-30)
theo file sprint2.md. Đọc kỹ sprint2.md trước khi code và bám đúng scope, KHÔNG thêm tính năng ngoài PRD.

Phạm vi:
1. Migration DB an toàn version 1 → 2: thêm bảng box_teaser + 2 index, FK ON DELETE CASCADE.
   CHỈ append block migration mới trong src/db/database.ts, KHÔNG sửa block cũ.
2. Types: thêm BoxTeaser + Box.teasers (src/types/box.ts).
3. Repository: CreateBoxInput.teasers (string[]); insert teaser TRONG transaction createBox;
   tính unlockAt theo công thức CHIA ĐỀU: unlockAt_i = createdAt + (unlockDate−createdAt)×i/(N+1);
   load teaser vào box.teasers ở getAllBoxes/getBoxById.
4. UI: Create Box Form (accordion 3 ô teaser ≤160 ký tự) → truyền JSON qua confirm-lock →
   createBox (cả 2 nhánh, kể cả nhánh "Khóa không ảnh"); Locked screen hiển thị "Gợi ý đã mở khóa"
   chỉ với teaser unlockAt <= now; Home thêm badge "Có gợi ý mới" trên LockedCard.
5. Cập nhật CLAUDE.md và design/database/schema.md.

Ràng buộc bắt buộc:
- Teaser chưa tới unlockAt: TUYỆT ĐỐI không render text ở bất kỳ màn nào.
- Xóa hộp phải xóa hết teaser (dựa CASCADE, bật PRAGMA foreign_keys = ON).
- KHÔNG đụng notification_schedule (UNIQUE box_id) — để dành Sprint 3.
- KHÔNG sửa nội dung hộp sau khóa; teaser chỉ nhập lúc tạo.
- Giữ createBox atomic (teaser insert nằm trong db.withTransactionAsync).

Sau khi code: chạy app, làm theo Test case thủ công §10 (đặc biệt D11/D12 migration và C9 xóa hộp),
báo lại kết quả từng case.
```

---

*Hết Implementation Brief Sprint 2 — F-30 Mystery Teaser.*
