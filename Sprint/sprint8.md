# Sprint 8 — New Box Types: Secret, Challenge, Letter (F-37)

> **Implementation Brief cho Agent-Dev**
> Tác giả: Agent-BA · Ngày: 2026-06-20 · Nhánh: `feature/sprint-08-new-box-types`
> Nguồn: PRD v1.2 (§3.5 F-37, §4 F-37 AC-37.1→AC-37.4, §8.10, §9.1, §10 Sprint 7)

---

## 0. Tiền kiểm — Sprint trước & ảnh hưởng

### 0.1. Sprint 7 (Personal Stats — F-36) đã hoàn tất ✅

Nhánh `feature/sprint-08-new-box-types` được tạo từ `feature/sprint-07-personal-stats` sau commit `f7434e1` (F-36 Personal Stats). Cây làm việc sạch. Không có việc dở dang chặn Sprint 8.

Codebase hiện có (liên quan tới F-37):

- **DB version 5**, 5 bảng: `box`, `reflection_question`, `notification_schedule`, `box_teaser`, `box_prediction`.
- **`BoxType` (`src/types/box.ts`)** hiện là union 4 giá trị: `'message' | 'goal' | 'memory' | 'decision'`.
- **`BOX_TYPE_CONFIG` (`src/constants/boxTypes.ts`)** giữ icon/màu/label/placeholder/câu hỏi mặc định cho 4 loại. `getBoxTypeConfig(type)` fallback về `message` nếu không khớp.
- **`Colors.boxType` (`src/constants/colors.ts`)** có key `message/goal/memory/decision` (+ `*Bg`); tất cả map về 1 accent cam duy nhất (single-accent theme) — phân biệt loại bằng icon, không bằng màu.
- **Màn chọn loại (`app/create-box/index.tsx`)** hardcode mảng `boxTypes: BoxType[] = ['message','goal','memory','decision']`, `staggerDelays = [0,75,150,225]`, và `BOX_TYPE_DESCRIPTIONS: Record<BoxType, string>`. Lưới 2 cột.
- **Repository (`src/db/boxRepository.ts`)**: `toDbBoxType()` viết hoa chữ cái đầu khi INSERT (`'Secret'`…), `rowToBox()` `.toLowerCase()` khi đọc. → **Hoàn toàn generic theo type, KHÔNG cần sửa nếu union & migration đã đúng.**
- **`BoxIcon.tsx`, `app/box/[id]/locked.tsx`, `detail.tsx`, `pre-open.tsx`, `confirm-lock.tsx`, `success.tsx`, `app/create-box/[type].tsx`** đều dùng `getBoxTypeConfig`/`BoxIcon` chung — **type-agnostic, tự hỗ trợ loại mới** sau khi config được bổ sung.

### 0.2. ⚠️ Khoảng trống quan trọng nhất — CHECK constraint trong DB

**`box.box_type` có ràng buộc cứng:**

```sql
box_type TEXT NOT NULL CHECK (box_type IN ('Message','Goal','Memory','Decision'))
```

(xem `src/db/database.ts` migration v0→v1, dòng ~42; và `design/database/schema.md` dòng ~146/162).

➡️ **Nếu chỉ sửa code TS mà không migrate DB, INSERT box loại Secret/Challenge/Letter sẽ FAIL ngay tại CHECK constraint.** SQLite **không** hỗ trợ `DROP CONSTRAINT` / `ALTER … DROP CHECK`. Cách duy nhất an toàn để nới CHECK là **rebuild bảng `box`** theo đúng pattern đã dùng ở v2→v3 (`notification_schedule`) và v4→v5 (`reflection_question`). → **Sprint này BẮT BUỘC có migration v5→v6.** (PRD §9.1 đã ghi rõ yêu cầu này.)

### 0.3. Khoảng trống còn lại mà F-37 cần lấp

| Hiện trạng | Còn thiếu cho Sprint 8 |
|-----------|------------------------|
| `BoxType` chỉ 4 giá trị. | Mở rộng union thêm `'secret' \| 'challenge' \| 'letter'`. |
| `BOX_TYPE_CONFIG` chỉ 4 loại. | Thêm config Secret/Challenge/Letter (icon, màu, label, placeholder, default question). |
| `Colors.boxType` chỉ 4 cặp key. | Thêm `secret/secretBg`, `challenge/challengeBg`, `letter/letterBg` (đều map accent). |
| Màn chọn loại hardcode 4 type. | Thêm 3 type vào `boxTypes`, `staggerDelays`, `BOX_TYPE_DESCRIPTIONS`; đảm bảo lưới 7 ô hiển thị ổn. |
| DB CHECK chỉ chấp nhận 4 giá trị. | **Migration v5→v6**: rebuild `box` để CHECK chấp nhận 7 giá trị. |
| Tài liệu (CLAUDE.md, schema.md) mô tả 4 loại + DB v5. | Cập nhật lên 7 loại + DB v6. |

### 0.4. Phụ thuộc & ràng buộc kế thừa

- F-37 phụ thuộc **F-12** (Bộ loại hộp với template — đã có). Đã hoàn tất.
- **CÓ DB migration** → ràng buộc "migration an toàn" **ÁP DỤNG** cho sprint này (xem §5).
- Lock rule (AC-03.1/F-03): loại mới **tự kế thừa** vì màn Locked/Detail/List đã ẩn content type-agnostic. Không được phá rule này.
- **KHÔNG** đụng F-30 teaser, F-31 notification, F-32 prediction, F-33 ritual, F-34/F-35 reflection logic.

---

## 1. Mục tiêu Sprint

Bổ sung **3 loại hộp mới — Secret, Challenge, Letter** — để làm phong phú nội dung người dùng có thể tạo, **dùng chung entity `Box`**, không tạo bảng riêng, không thêm logic riêng phức tạp cho từng loại. Mỗi loại mới có **icon, màu, label, placeholder và câu hỏi phản hồi mặc định** riêng (PRD §8.10). Loại mới phải tuân thủ đầy đủ rule khóa: **không lộ nội dung trước ngày mở** (AC-37.4).

```
Tạo hộp → [chọn 1 trong 7 loại: Message/Goal/Memory/Decision/Secret/Challenge/Letter] → Khóa → Countdown → Mở → Reflection
```

**Ngoài phạm vi sprint này (KHÔNG làm):**

- **KHÔNG** tạo bảng DB riêng cho loại mới (AC-37.3 — dùng chung bảng `box`).
- **KHÔNG** thêm logic xử lý riêng theo từng loại (vd luồng đặc biệt cho Secret) — V1 chỉ là biến thể template (PRD §8.10 Business Rules).
- **KHÔNG** đụng notification (không thêm kind mới, không sửa schedule/cancel).
- **KHÔNG** đụng teaser, prediction, ritual, reflection note logic.
- **KHÔNG** mã hóa nội dung Secret (NFR-S1 / Q4: khóa ở tầng UI, không encryption at rest). "Secret" chỉ là một template loại hộp, **không** có cơ chế bảo mật khác biệt với các loại còn lại trong V1.
- **KHÔNG** đổi UI flow tạo hộp ngoài việc thêm 3 thẻ chọn loại.
- Mọi tính năng V2: account, cloud sync, gửi hộp cho người khác, hộp nhóm, public box.

---

## 2. Feature ID liên quan

- **F-37 — New Box Types** (Could, V1). Phụ thuộc: **F-12**. AC: **AC-37.1 → AC-37.4** (PRD §4). Mô tả: PRD §8.10. Data model: PRD §9.1. Roadmap: PRD §10 Sprint 7 (phần "Thêm Secret, Challenge, Letter").
- Liên đới **F-36 AC-36.2**: "Nếu có hộp Goal/**Challenge** … hiển thị số mục tiêu/**thử thách** đã hoàn thành". Sau khi Challenge tồn tại, mở rộng `computeStats` để đếm cả `challenge` (xem §6 Task 7 — tied-off của AC-36.2; đây là hoàn thiện AC sẵn có, không phải tính năng mới).
- NFR liên quan: **NFR-M1** (Box tổng quát theo `boxType`, dễ thêm loại — chính là tinh thần F-37), **NFR-S1/AC-03.1** (không lộ nội dung hộp khóa), **NFR-R1** (migration an toàn, không mất dữ liệu), **NFR-U4** (touch ≥ 44pt, contrast AA), **NFR-U2** (cảm xúc, đồng bộ theme).

---

## 3. User Stories

| ID | Story |
|----|-------|
| US-1 | Là người dùng, tôi muốn tạo một hộp **Secret** để cất một điều mình chưa muốn nói ra, mở lại sau này. |
| US-2 | Là người dùng, tôi muốn tạo một hộp **Challenge** để đặt thử thách cho bản thân và đối chiếu xem đã hoàn thành chưa khi mở. |
| US-3 | Là người dùng, tôi muốn viết một **lá thư (Letter)** dài cho chính mình của tương lai. |
| US-4 | Là người dùng, tôi muốn mỗi loại hộp mới có icon, màu, gợi ý nội dung và câu hỏi mặc định phù hợp để cảm thấy đúng ngữ cảnh. |
| US-5 | Là người dùng, tôi vẫn muốn nội dung hộp loại mới được ẩn hoàn toàn cho đến ngày mở, giống mọi loại hộp khác. |

---

## 4. Business Rules

### 4.1. Cấu hình loại hộp mới (AC-37.1, AC-37.2, PRD §8.10)

Theo bảng PRD §8.10 (giữ nguyên ngữ nghĩa, đặt label/placeholder/câu hỏi bằng tiếng Việt cho đồng bộ app):

| `boxType` (TS, lowercase) | DB value (Title-case) | Label (VN) | Placeholder nội dung | Câu hỏi mặc định |
|---------------------------|------------------------|------------|----------------------|------------------|
| `secret` | `Secret` | Bí mật | "Có một điều mình chưa muốn nói ra..." | "Bí mật này bây giờ còn quan trọng không?" |
| `challenge` | `Challenge` | Thử thách | "Thử thách mình muốn hoàn thành là..." | "Bạn đã hoàn thành thử thách chưa?" |
| `letter` | `Letter` | Lá thư | "Gửi tôi của tương lai..." | "Bạn cảm thấy thế nào khi đọc lại lá thư này?" |

- **Icon**: phải là glyph **Ionicons** hợp lệ (cả `app/create-box/index.tsx` lẫn `BoxIcon.tsx` đang hardcode họ `Ionicons`). Đề xuất: Secret → `lock-closed` hoặc `eye-off`; Challenge → `trophy` hoặc `flame`; Letter → `mail` hoặc `mail-open`. (Tránh icon trùng/khó phân biệt với 4 loại cũ.) `iconFamily: 'Ionicons'`.
- **Màu**: theo theme single-accent hiện tại, `color = T.accent`, `bgColor = T.accentSoft` (giống 4 loại cũ). **Phải thêm key tương ứng vào `Colors.boxType`** để `BOX_TYPE_CONFIG[*].color/bgColor` resolve được (nếu không config sẽ trỏ `undefined`).
- `shortLabel` = label (giống pattern hiện có).

### 4.2. Dùng chung entity Box, không bảng riêng (AC-37.3)

- Loại mới **chỉ là giá trị mới của `box_type`**; **KHÔNG** thêm bảng, **KHÔNG** thêm cột, **KHÔNG** thêm bảng template DB (template vẫn hardcode trong `BOX_TYPE_CONFIG` theo quyết định schema.md §4.5).
- Repository **không cần sửa**: `toDbBoxType()` đã viết hoa chữ đầu (`secret`→`Secret`), `rowToBox()` đã `.toLowerCase()`. Chỉ cần union TS + config + migration đúng.

### 4.3. Tuân thủ rule khóa (AC-37.4 / F-03 / AC-03.1 / NFR-S1)

- Loại mới đi qua **đúng** luồng Locked/Pre-open/Detail hiện hữu → nội dung (`content`, `imagePath`, `openingNote`, `reflectionQuestion`, `prediction`, `teaser`) **không** được render trước ngày mở. Không viết nhánh đặc biệt làm lộ nội dung.
- **Secret KHÔNG** được hiểu là "mã hóa": V1 vẫn khóa ở tầng UI (Q4/NFR-S1). Không thêm PIN riêng cho Secret, không encryption.

### 4.4. Validation tạo hộp — không đổi

- Quy tắc `unlockDate ≥ today + 1 ngày`, content bắt buộc, max ký tự… giữ nguyên cho mọi loại (kể cả loại mới). Không nới/siết riêng cho loại mới.

### 4.5. Reflection question mặc định

- Cả 3 loại mới **đều có** câu hỏi mặc định Yes/No (khác `memory` đang để rỗng). Form `[type].tsx` đã đổ `config.defaultReflectionQuestion` làm placeholder → tự hoạt động. Người dùng vẫn có thể sửa/bỏ trống (AC-04.2). Không cần sửa logic form.

### 4.6. Migration & dữ liệu cũ (NFR-R1)

- Migration v5→v6 **chỉ nới CHECK constraint**, **giữ nguyên 100% dữ liệu** box hiện có (mọi cột, mọi row, kể cả `is_deleted`).
- Phải **idempotent theo `PRAGMA user_version`** (đã có cơ chế trong `migrateDbIfNeeded`). App cài cũ (DB v5) mở lên phải tự migrate lên v6 không mất dữ liệu; app mới cài (DB v0) chạy thẳng tới v6.

### 4.7. Notification — không thay đổi

- F-37 **không** thêm `kind` notification, **không** sửa `scheduleCuriosityNotifications`/`cancelBoxNotification`/`deleteBox`. Hộp loại mới dùng đúng pipeline notification hiện có (unlock + teaser nếu có teaser). Khi xóa hộp loại mới, notification vẫn bị hủy qua `deleteBox` hiện hữu (đã đúng) — **không cần sửa**, nhưng phải **test** lại (xem §10 G).

---

## 5. Data Model / Migration

### 5.1. Thay đổi schema

- Bảng/cột: **KHÔNG thêm bảng, KHÔNG thêm cột.** Chỉ **nới CHECK** của `box.box_type`:

```
CHECK (box_type IN ('Message','Goal','Memory','Decision'))
   → CHECK (box_type IN ('Message','Goal','Memory','Decision','Secret','Challenge','Letter'))
```

### 5.2. Migration v5→v6 (an toàn, bắt buộc)

Trong `src/db/database.ts`:

1. **Tăng `DATABASE_VERSION` từ 5 → 6.**
2. **Append** block `if (currentVersion === 5) { … currentVersion = 6; }` **sau** block v4→v5. **TUYỆT ĐỐI KHÔNG sửa** các block migration cũ đã release (v0→v5).
3. Dùng **pattern rebuild bảng an toàn** (12-step SQLite redefine) — giống v2→v3 và v4→v5:
   - `PRAGMA foreign_keys = OFF;`
   - `CREATE TABLE box_new ( … )` — **copy y nguyên** toàn bộ định nghĩa cột & index-able shape của `box`, **chỉ đổi** CHECK của `box_type` thành 7 giá trị; giữ nguyên `id PRIMARY KEY`, `content NOT NULL`, `is_opened`/`is_deleted` CHECK (0,1), v.v.
   - `INSERT INTO box_new (…tất cả cột…) SELECT …tất cả cột… FROM box;`
   - `DROP TABLE box;`
   - `ALTER TABLE box_new RENAME TO box;`
   - **Tạo lại toàn bộ index của `box`**: `idx_box_unlock_date`, `idx_box_is_opened`, `idx_box_type`, `idx_box_list` (dùng `CREATE INDEX IF NOT EXISTS`).
   - `PRAGMA foreign_keys = ON;`
4. **FK của 4 bảng con** (`reflection_question`, `notification_schedule`, `box_teaser`, `box_prediction`) tham chiếu `box(id)` **theo tên bảng** → sau `RENAME … TO box`, tham chiếu vẫn hợp lệ, **không** cần đụng bảng con. (Khuyến nghị) chạy `PRAGMA foreign_key_check;` sau migration trong môi trường dev để xác nhận không gãy FK.
5. Cuối hàm vẫn `PRAGMA user_version = DATABASE_VERSION;` (đã có sẵn).

> ⚠️ Lưu ý kỹ thuật: vì `box` là **bảng cha** của 4 FK `ON DELETE CASCADE`, **bắt buộc** `PRAGMA foreign_keys = OFF` trong suốt quá trình DROP/RENAME để tránh cascade xóa nhầm dữ liệu con. Đây chính là lý do dùng pattern rebuild đã được kiểm chứng ở các migration trước.

> Nếu phát sinh nhu cầu thêm cột/bảng mới → **vượt scope**: DỪNG và báo lại Agent-BA.

---

## 6. Danh sách Task cần code

1. **`src/types/box.ts`** — mở rộng union:
   `export type BoxType = 'message' | 'goal' | 'memory' | 'decision' | 'secret' | 'challenge' | 'letter';`
2. **`src/constants/colors.ts`** — thêm vào `Colors.boxType`: `secret: T.accent, secretBg: T.accentSoft, challenge: T.accent, challengeBg: T.accentSoft, letter: T.accent, letterBg: T.accentSoft`.
3. **`src/constants/boxTypes.ts`** — thêm 3 entry `secret`, `challenge`, `letter` vào `BOX_TYPE_CONFIG` theo bảng §4.1 (icon Ionicons hợp lệ, color/bgColor từ `Colors.boxType.*`, placeholder + defaultReflectionQuestion + label/shortLabel).
4. **`app/create-box/index.tsx`**:
   - Thêm 3 type vào `boxTypes: BoxType[]` (sau `decision`).
   - Mở rộng `staggerDelays` đủ 7 phần tử (vd `[0,75,150,225,300,375,450]`).
   - Thêm mô tả 3 loại vào `BOX_TYPE_DESCRIPTIONS: Record<BoxType, string>` (vd Secret: "Cất giữ một bí mật"; Challenge: "Đặt thử thách cho bản thân"; Letter: "Viết thư cho tương lai").
   - Kiểm tra lưới 2 cột hiển thị 7 thẻ ổn (3 hàng + 1 thẻ lẻ ở hàng cuối) — chấp nhận được; nếu thẻ lẻ trông lệch, để full-width hoặc giữ nguyên (không bắt buộc redesign lưới).
5. **`src/db/database.ts`** — migration v5→v6 theo §5.2; bump `DATABASE_VERSION = 6`.
6. **Tài liệu (bắt buộc theo CLAUDE.md):**
   - `CLAUDE.md`: cập nhật **DB version 5→6**; bảng "Trạng thái hộp"/schema ghi `box_type` chấp nhận 7 giá trị; Tech-stack/Data-layer note migration v5→v6 (nới CHECK `box_type`, rebuild bảng `box` an toàn, không mất dữ liệu); mục **Quy ước quan trọng** thêm dòng **New Box Types (F-37)**: 3 loại Secret/Challenge/Letter dùng chung bảng `box`, chỉ là template (config), tuân thủ rule khóa, không bảng/logic riêng, không encryption cho Secret.
   - `design/database/schema.md`: cập nhật mọi chỗ liệt kê `box_type` (dòng ~89, ~128, ~146, ~162) sang 7 giá trị; thêm migration v5→v6 vào phần migration; (tùy chọn) thêm 3 dòng vào bảng template §4.5.
7. **(Hoàn thiện AC-36.2 — khuyến nghị, PRD-backed)** `src/utils/stats.ts`: trong `computeStats`, mở rộng điều kiện đếm "mục tiêu/thử thách hoàn thành" để bao gồm cả `box.boxType === 'challenge'` bên cạnh `'goal'` (tử số: đã mở & `reflectionAnswer==='yes'`; mẫu số: đã mở & có trả lời). Cập nhật nhãn UI ở `app/stats.tsx` nếu cần cho đúng ngữ nghĩa "mục tiêu/thử thách". Đây là **đóng nốt AC-36.2** vốn đã đề cập Challenge — không phải tính năng mới. *Nếu Agent-Dev muốn giữ Sprint 8 tối giản (chỉ F-37), có thể tách Task 7 ra; nhưng vì Challenge giờ đã tồn tại, nên hoàn thiện ngay để AC-36.2 đúng.*

---

## 7. File/Module cần SỬA

| File | Thay đổi |
|------|----------|
| `src/types/box.ts` | Mở rộng union `BoxType` thêm `secret \| challenge \| letter`. |
| `src/constants/colors.ts` | Thêm 6 key màu (`secret/secretBg/challenge/challengeBg/letter/letterBg`) → accent. |
| `src/constants/boxTypes.ts` | Thêm 3 entry config (icon/màu/label/placeholder/default question). |
| `app/create-box/index.tsx` | Thêm 3 type vào `boxTypes`, mở rộng `staggerDelays` (7), `BOX_TYPE_DESCRIPTIONS`. |
| `src/db/database.ts` | Migration v5→v6 (rebuild `box`, nới CHECK), `DATABASE_VERSION = 6`. |
| `src/utils/stats.ts` *(khuyến nghị, Task 7)* | Đếm thêm `challenge` cho "mục tiêu/thử thách hoàn thành" (AC-36.2). |
| `app/stats.tsx` *(nếu sửa stats)* | Chỉnh nhãn "mục tiêu/thử thách" cho đúng. |
| `CLAUDE.md` | DB v6 + quy ước F-37. |
| `design/database/schema.md` | `box_type` 7 giá trị + migration v5→v6. |

> **KHÔNG** sửa `src/db/boxRepository.ts` (đã generic theo type), `src/services/notificationService.ts`, `app/box/[id]/*`, `app/create-box/[type].tsx`, `BoxIcon.tsx` — tất cả tự hỗ trợ loại mới. Nếu thấy "phải" sửa các file này để loại mới chạy → dừng lại kiểm tra, nhiều khả năng đang làm sai/thừa.

## 8. File/Module cần TẠO MỚI

| File | Mục đích | Ghi chú |
|------|----------|---------|
| *(không bắt buộc)* `design/flows/F37-new-box-types.md` | Mô tả luồng/cấu hình F-37 theo PRD §8.10. | Tùy chọn; bỏ qua nếu CLAUDE.md + schema.md đã đủ. |

> F-37 **không** cần file code mới — chỉ mở rộng cấu hình + migration trên file sẵn có.

---

## 9. Acceptance Criteria (PRD §4)

| AC | Tiêu chí | Cách đạt |
|----|----------|----------|
| **AC-37.1** | Màn chọn loại hộp hiển thị thêm Secret, Challenge, Letter. | Thêm 3 type vào `boxTypes` ở `app/create-box/index.tsx`; lưới hiển thị 7 thẻ. |
| **AC-37.2** | Mỗi loại mới có icon, màu, placeholder nội dung và câu hỏi mặc định riêng. | 3 entry trong `BOX_TYPE_CONFIG` (§4.1) + key màu trong `Colors.boxType`. |
| **AC-37.3** | Loại mới dùng chung entity `Box`, không tạo bảng riêng. | Chỉ mở rộng union + nới CHECK; repository generic; không thêm bảng/cột. |
| **AC-37.4** | Loại mới tuân thủ rule khóa: không hiển thị content trước ngày mở. | Đi qua luồng Locked/Detail type-agnostic hiện có; không viết nhánh lộ nội dung; không encryption đặc biệt cho Secret. |
| (Liên đới AC-36.2) | Hộp Goal/**Challenge** đã hoàn thành được đếm. | `computeStats` đếm thêm `challenge` (Task 7). |
| (Ngầm, NFR-R1) | Migration không mất dữ liệu, app DB cũ vẫn chạy. | Rebuild `box` an toàn, copy toàn bộ row/cột; idempotent theo `user_version`. |

---

## 10. Test case thủ công

**A. Chọn & tạo loại mới (AC-37.1, AC-37.2)**
1. Mở "Tạo hộp" → ✔ thấy đủ 7 thẻ: Message, Goal, Memory, Decision, **Secret, Challenge, Letter**; mỗi thẻ mới có icon + màu + label riêng, animation stagger không lỗi/không crash.
2. Chọn **Secret** → ✔ form hiển thị placeholder nội dung "Có một điều mình chưa muốn nói ra..." và câu hỏi mặc định "Bí mật này bây giờ còn quan trọng không?".
3. Lặp lại cho **Challenge** (placeholder + "Bạn đã hoàn thành thử thách chưa?") và **Letter** (placeholder + "Bạn cảm thấy thế nào khi đọc lại lá thư này?").
4. Tạo & khóa 1 hộp mỗi loại mới (unlock ≥ ngày mai) → ✔ tạo thành công, không lỗi CHECK constraint, hộp xuất hiện ở Home với icon/label đúng.

**B. Migration an toàn (NFR-R1, AC-37.3)**
5. (Quan trọng) Trên thiết bị/emulator **đã có dữ liệu DB v5 cũ** (vài hộp Message/Goal/Memory/Decision, kèm reflection/teaser/prediction/notification) → cài bản mới → mở app → ✔ app khởi động bình thường; ✔ **toàn bộ hộp cũ còn nguyên** (nội dung, ảnh, câu hỏi, teaser, prediction, trạng thái); ✔ `PRAGMA user_version` = 6.
6. Cài mới hoàn toàn (DB v0) → ✔ chạy thẳng tới v6, tạo được cả 7 loại.
7. (Dev) Chạy `PRAGMA foreign_key_check;` sau migration → ✔ không có vi phạm FK.

**C. Rule khóa cho loại mới (AC-37.4 / AC-03.1 / NFR-S1)**
8. Hộp Secret/Challenge/Letter còn **Locked** → mở màn Locked + xem ở Home → ✔ **không** hiển thị content/ảnh/opening note/câu hỏi/prediction/teaser chưa đến hạn; chỉ metadata (tiêu đề/loại/ngày mở/đếm ngược).
9. ✔ Secret **không** có cơ chế bảo mật/PIN riêng khác các loại (đúng V1: khóa tầng UI).
10. Chỉnh ngày để hộp loại mới đến hạn → mở hộp → ✔ hiển thị đúng nội dung gốc + câu hỏi; trả lời Yes/No hoạt động; confetti khi Yes (F-07) vẫn chạy.

**D. Reflection & Detail (kế thừa)**
11. Mở hộp Challenge, đáp "Có" → ✔ lưu đúng; mở Detail xem lại → ✔ icon/label "Thử thách" đúng, nội dung read-only.
12. Viết reflection note cho hộp Letter đã mở (F-34) → ✔ lưu & hiển thị lại đúng.

**E. Personal Stats (AC-36.2, Task 7 nếu làm)**
13. Tạo & mở vài hộp **Challenge**, đáp "Có"/"Không" → vào màn Thống kê → ✔ số "mục tiêu/thử thách hoàn thành" cộng cả goal + challenge đúng; guard chia 0 vẫn ổn.

**F. Xóa & notification (AC-08.4 — không hồi quy)**
14. Tạo hộp loại mới (có schedule notification) rồi xóa → ✔ hộp biến mất, notification liên quan bị hủy, không crash; ✔ CASCADE xóa reflection/teaser/prediction của hộp đó.

**G. Không hồi quy**
15. ✔ 4 loại cũ tạo/mở/đếm ngược/notification/teaser/prediction/ritual/reflection/stats vẫn hoạt động như trước.
16. ✔ App Lock, search/filter Home (F-17), Personal Stats (F-36) chạy bình thường; cold start ổn.
17. ✔ `getBoxTypeConfig` fallback (`message`) vẫn an toàn nếu gặp type lạ.

---

## 11. Rủi ro cần lưu ý

| # | Rủi ro | Hướng xử lý |
|---|--------|-------------|
| R1 | **Quên migration → INSERT loại mới fail tại CHECK constraint.** | BẮT BUỘC migration v5→v6 nới CHECK (§5.2). Test A4 + B5. |
| R2 | **Migration làm mất/hỏng dữ liệu** (vì rebuild bảng cha có 4 FK CASCADE). | Dùng pattern rebuild đã kiểm chứng, `foreign_keys=OFF` trong DROP/RENAME, copy đủ cột/row, tạo lại index, `foreign_key_check`. Test B5/B7. KHÔNG sửa migration cũ. |
| R3 | **Config thiếu key màu** → `BOX_TYPE_CONFIG[*].color/bgColor` = undefined → UI lỗi. | Thêm đủ 6 key vào `Colors.boxType` (Task 2) trước khi thêm config. |
| R4 | **Icon không phải glyph Ionicons hợp lệ** → ô vuông/cảnh báo. | Chọn tên Ionicons có thật (§4.1); thử render trên cả màn chọn loại lẫn `BoxIcon`. |
| R5 | **Lộ nội dung hộp loại mới khi Locked** nếu vô tình thêm nhánh đặc biệt. | KHÔNG viết logic riêng; đi qua luồng chung. Test C8. |
| R6 | **Hiểu sai "Secret" = mã hóa** → tự thêm PIN/encryption (vượt scope, trái Q4/NFR-S1). | Secret chỉ là template loại hộp; KHÔNG encryption, KHÔNG PIN riêng. Test C9. |
| R7 | **`BoxType` union mở rộng làm vỡ `Record<BoxType,…>`** (TS báo thiếu key). | Bổ sung đủ key ở `BOX_TYPE_DESCRIPTIONS` và mọi `Record<BoxType,…>` (compile sẽ chỉ ra). |
| R8 | **Vượt scope** (thêm bảng/cột, logic riêng từng loại, đụng notification/teaser/prediction). | Bám AC-37.3 / §1 "ngoài phạm vi". Nếu thấy cần đổi schema ngoài CHECK → DỪNG, báo BA. |
| R9 | **Lưới 7 thẻ lệch** ở màn chọn loại (thẻ lẻ). | Chấp nhận thẻ lẻ ở hàng cuối; không bắt buộc redesign. Đảm bảo touch ≥ 44pt, scroll nếu tràn. |
| R10 | **Quên cập nhật tài liệu** (CLAUDE.md/schema.md) sau khi đổi DB version. | Task 6 bắt buộc — đồng bộ trong cùng phiên (quy tắc CLAUDE.md). |

---

## 12. Prompt giao Agent-Dev

```
Bạn là Agent-Dev (React Native / Expo SDK 54, chạy Expo Go). Triển khai Sprint 8 — New Box Types:
Secret, Challenge, Letter (F-37) theo file Sprint/sprint8.md. Đọc kỹ sprint8.md trước khi code, bám đúng
scope, KHÔNG thêm tính năng ngoài PRD.

Bối cảnh: Box dùng chung 1 entity; BoxType hiện là 'message'|'goal'|'memory'|'decision'. CẢNH BÁO QUAN
TRỌNG: bảng box có CHECK constraint box_type IN ('Message','Goal','Memory','Decision') → phải migration
nới CHECK, nếu không INSERT loại mới sẽ fail. Repository (toDbBoxType/rowToBox) đã generic theo type; màn
Locked/Detail/BoxIcon type-agnostic, tự hỗ trợ loại mới sau khi thêm config + migration.

Phạm vi (CHỈ F-37 + đóng nốt AC-36.2):
1. src/types/box.ts: BoxType += 'secret'|'challenge'|'letter'.
2. src/constants/colors.ts: thêm Colors.boxType.{secret,secretBg,challenge,challengeBg,letter,letterBg}
   = accent/accentSoft.
3. src/constants/boxTypes.ts: thêm 3 config (icon Ionicons HỢP LỆ, color/bgColor từ Colors.boxType,
   label/shortLabel, placeholder, defaultReflectionQuestion) theo bảng §4.1:
   - secret  → "Bí mật"   / "Có một điều mình chưa muốn nói ra..." / "Bí mật này bây giờ còn quan trọng không?"
   - challenge→ "Thử thách"/ "Thử thách mình muốn hoàn thành là..." / "Bạn đã hoàn thành thử thách chưa?"
   - letter  → "Lá thư"   / "Gửi tôi của tương lai..."            / "Bạn cảm thấy thế nào khi đọc lại lá thư này?"
4. app/create-box/index.tsx: thêm 3 type vào boxTypes, mở rộng staggerDelays đủ 7, thêm BOX_TYPE_DESCRIPTIONS
   cho 3 loại. Đảm bảo lưới 7 thẻ hiển thị ổn (thẻ lẻ ở hàng cuối chấp nhận được).
5. src/db/database.ts: DATABASE_VERSION = 6; APPEND block if(currentVersion===5){...currentVersion=6}
   sau v4→v5 (KHÔNG sửa migration cũ). Rebuild bảng box an toàn (PRAGMA foreign_keys=OFF → CREATE box_new
   với CHECK 7 giá trị, copy ĐỦ cột/row, DROP box, RENAME box_new→box, tạo lại idx_box_unlock_date/
   idx_box_is_opened/idx_box_type/idx_box_list → foreign_keys=ON). Giữ nguyên mọi cột (kể cả is_deleted).
6. (Đóng nốt AC-36.2) src/utils/stats.ts: đếm "mục tiêu/thử thách hoàn thành" gồm cả boxType==='challenge'
   bên cạnh 'goal'; chỉnh nhãn ở app/stats.tsx nếu cần.
7. Cập nhật CLAUDE.md (DB v5→v6, quy ước F-37) + design/database/schema.md (box_type 7 giá trị + migration v5→v6).

Ràng buộc bắt buộc:
- Migration AN TOÀN: không mất dữ liệu, idempotent theo user_version, không sửa migration cũ; app DB v5 cũ
  mở lên phải còn nguyên dữ liệu.
- KHÔNG thêm bảng/cột (AC-37.3), KHÔNG logic riêng từng loại, KHÔNG đụng notification/teaser/prediction/
  ritual/reflection logic, KHÔNG sửa boxRepository.ts/BoxIcon.tsx/app/box/*/app/create-box/[type].tsx.
- Secret KHÔNG mã hóa / KHÔNG PIN riêng (Q4/NFR-S1: khóa tầng UI). Loại mới phải ẩn nội dung khi Locked.
- KHÔNG V2 (account/cloud/gửi cho người khác/hộp nhóm/public box).

Sau khi code: chạy app, làm theo Test case thủ công §10 (A tạo 7 loại, B migration giữ dữ liệu + user_version=6
+ foreign_key_check, C rule khóa + Secret không bảo mật riêng, D reflection/detail, E stats challenge,
F xóa+hủy notification, G không hồi quy), báo lại kết quả từng case.
```

---

*Hết Implementation Brief Sprint 8 — F-37 New Box Types (Secret, Challenge, Letter).*
