# Sprint 4 — Prediction Before Opening (F-32)

> **Implementation Brief cho Agent-Dev**
> Tác giả: Agent-BA · Ngày: 2026-06-20 · Nhánh: `feature/sprint-04-prediction-before-opening`
> Nguồn: PRD v1.2 (§3.5, §4 F-32, §8.5, §9.3, §10 Sprint 4)

---

## 0. Tiền kiểm — Sprint trước & ảnh hưởng

### 0.1. Sprint 3 (Curiosity Notification — F-31) đã hoàn tất ✅ (merged vào `main`)

Codebase hiện có:

- **DB version 3** với 4 bảng: `box`, `reflection_question`, `notification_schedule` (đã có cột `kind`, bỏ `UNIQUE(box_id)`), `box_teaser` (`src/db/database.ts`).
- `createBox()` (`src/db/boxRepository.ts`) là **1 transaction atomic**: INSERT box + reflection + N notification_schedule + teaser. Side-effect ngoài DB (copy ảnh, schedule notification) chạy **trước** transaction; rollback hủy notification + xóa ảnh.
- `deleteBox()` đọc **tất cả** notification của box → hủy từng identifier → `DELETE FROM box` + CASCADE.
- `getBoxStatus()` (`src/store/boxStore.tsx`): derived status `locked | ready_to_open | opened`.
- Màn `box/[id]/locked.tsx` (locked peek + teaser + xóa), `box/[id]/pre-open.tsx` (CTA "Mở hộp", guard chống tua giờ), `box/[id]/detail.tsx` (đã mở, content + reflection + confetti/empathy, **early-return `null` khi `status !== 'opened'`**).

### 0.2. Ảnh hưởng của F-32 lên codebase hiện tại

| Điểm chạm | Ảnh hưởng |
|-----------|-----------|
| `database.ts` | **Thêm migration v3→v4**: `CREATE TABLE box_prediction` (additive, **không** rebuild bảng, không đụng bảng cũ → rủi ro thấp). |
| `box.ts` (types) | Thêm interface `BoxPrediction` + field optional trên `Box`. |
| `boxRepository.ts` | `createBox` **không bắt buộc** tạo prediction (prediction nhập sau, ở màn Locked). Thêm `upsertPrediction()` + `getPrediction` mapping vào `getAllBoxes`/`getBoxById`. `deleteBox` **không cần sửa** — CASCADE tự xóa `box_prediction`. |
| `locked.tsx` | **Thêm UI nhập/sửa prediction** (chỉ khi hộp chưa mở). |
| `detail.tsx` | **Thêm section hiển thị prediction read-only** (đối chiếu với nội dung thật). |
| `boxStore.tsx` | Không đổi reducer (dùng `UPDATE_BOX` sẵn có để cập nhật prediction trên Box trong state). |
| Notification | **KHÔNG liên quan.** F-32 không tạo/sửa/hủy notification. `deleteBox` đã hủy notification đúng từ Sprint 3 — giữ nguyên. |

### 0.3. Không có blocker

Khác với Sprint 3 (phải rebuild bảng vì vướng `UNIQUE`), Sprint 4 chỉ **thêm 1 bảng mới** quan hệ nhiều-1 với `box` (thực chất 0..1). Migration thuần `CREATE TABLE IF NOT EXISTS` → an toàn, không động chạm dữ liệu cũ.

---

## 1. Mục tiêu Sprint

Cho phép người dùng ghi **dự đoán** ("Bạn nghĩ bên trong hộp này là gì?") khi hộp còn **chưa mở**, lưu riêng và **không** ảnh hưởng nội dung gốc. Khi hộp **đã mở**, hiển thị lại prediction cạnh nội dung thật để tạo khoảnh khắc **đối chiếu** "mình đoán" vs "thực tế". Prediction **chỉ sửa được khi hộp chưa mở**; sau khi mở thì **read-only**.

**Ngoài phạm vi sprint này (KHÔNG làm):**

- Không nhập prediction trong form tạo hộp (`create-box`) — prediction là hành động **trong thời gian chờ**, nhập ở màn Locked (đúng luồng PRD §8.5).
- Không thêm prediction lên màn pre-open / màn Home / màn list (chỉ Locked để nhập, Detail để xem).
- Không có nhiều prediction/hộp, không lịch sử chỉnh sửa, không versioning (PRD §9.3: **tối đa 1 prediction active / hộp**).
- Không notification cho prediction. Không nhắc "bạn chưa đoán".
- Không AI gợi ý prediction.
- Không đụng F-30 teaser / F-31 notification / reflection logic.
- Mọi tính năng V2: account, cloud sync, gửi hộp cho người khác, hộp nhóm, public box.

---

## 2. Feature ID liên quan

- **F-32 — Prediction Before Opening** (Should, V1). Phụ thuộc: **F-03** (khóa & ẩn nội dung), **F-06** (mở hộp), **F-11** (xem chi tiết hộp đã mở) — tất cả đã có.
- Tham chiếu AC: **AC-32.1 → AC-32.4** (PRD §4).
- Data model: PRD §9.3 (bảng `box_prediction`).
- Roadmap: PRD §10 Sprint 4.

---

## 3. User Stories

| ID | Story |
|----|-------|
| US-1 | Là người dùng, khi hộp còn khóa, tôi muốn ghi lại dự đoán "bên trong hộp này là gì" để khoảnh khắc mở hộp bất ngờ hơn. |
| US-2 | Là người dùng, tôi muốn **sửa lại** dự đoán bao nhiêu lần cũng được **chừng nào hộp chưa mở**. |
| US-3 | Là người dùng, sau khi mở hộp, tôi muốn thấy lại dự đoán cũ **cạnh nội dung thật** để tự đối chiếu. |
| US-4 | Là người dùng, sau khi hộp đã mở, tôi **không** muốn (và không thể) sửa dự đoán nữa — nó là một phần ký ức quá khứ. |
| US-5 | Là người dùng, tôi muốn dự đoán là **tùy chọn** — không ghi cũng không sao, không bị ép. |

---

## 4. Business Rules

### 4.1. Vòng đời & ràng buộc prediction (AC-32.1 → AC-32.4, PRD §8.5 / §9.3)

- Prediction **optional**. Hộp không có prediction là hợp lệ.
- **Tối đa 1 prediction active / hộp** (quan hệ thực chất 0..1).
- `prediction_text` **tối đa 500 ký tự** (PRD §8.5). Trim 2 đầu; cắt còn 500 nếu vượt (validate cả UI lẫn data layer).
- **Chỉ ghi/sửa được khi hộp CHƯA mở** (`is_opened = 0`). Sau khi `Opened` → **read-only tuyệt đối** (AC-32.3).
- Prediction **không** thay đổi/ghi đè `content`, `opening_note`, `image_path`, `reflection_*` của hộp (AC-32.1, PRD §8.5 "Prediction được lưu riêng").
- Lưu/sửa prediction **không** đổi trạng thái hộp (vẫn `locked`/`ready_to_open` cho tới khi user chủ động mở).

### 4.2. Quy tắc upsert (1 hàm cho cả tạo mới & sửa)

`upsertPrediction(boxId, text)`:

1. **Guard mở hộp (bắt buộc, tầng data):** kiểm tra box tồn tại, chưa xóa, `is_opened = 0`. Nếu hộp đã mở/đã xóa → **throw** (`BOX_NOT_EDITABLE`), **không** ghi DB. Đây là lớp enforce AC-32.3 ở data layer (không chỉ ẩn nút ở UI).
2. Chuẩn hóa `text`: `trim()` rồi cắt ≤ 500 ký tự.
3. Nếu sau khi trim **rỗng** → **xóa** row prediction của box (nếu có) và trả `null` (cho phép người dùng "xóa dự đoán" bằng cách lưu rỗng — giữ tính optional sạch sẽ). *(Nếu Agent-Dev thấy nên giữ row rỗng thì cũng được, nhưng khuyến nghị xóa cho gọn.)*
4. Nếu đã có prediction cho box → `UPDATE prediction_text`, `updated_at = now`.
5. Nếu chưa có → `INSERT` row mới (`id` UUID, `created_at = updated_at = now`).
6. Trả về `BoxPrediction | null`.

### 4.3. Hiển thị (không lộ nội dung hộp khóa)

- **Màn Locked** (`status !== 'opened'`): hiển thị **chỉ prediction của chính người dùng** (dữ liệu họ tự nhập) + input để sửa. **TUYỆT ĐỐI không** vì thêm prediction mà render `content`/`image`/`opening_note`/`reflectionQuestion` (giữ nguyên rule F-03/AC-03.1). Prediction là input của user, không phải nội dung hộp → an toàn để hiện.
- **Màn Detail** (chỉ khi `status === 'opened'`, màn này đã early-return `null` nếu chưa opened): hiển thị prediction **read-only**. Vị trí khuyến nghị: **ngay sau section "NỘI DUNG GỐC"** để tạo hiệu ứng đối chiếu (AC-32.4 cho phép trước hoặc sau nội dung thật).

### 4.4. Xóa hộp (toàn vẹn dữ liệu)

- `box_prediction.box_id` có `FOREIGN KEY ... ON DELETE CASCADE`. `deleteBox` hiện đã `DELETE FROM box` với `PRAGMA foreign_keys = ON` → prediction tự bị xóa. **Không cần sửa `deleteBox`.**
- F-32 **không** tạo notification nên không có gì để hủy thêm (ràng buộc "xóa box → hủy notification" đã được Sprint 3 đảm bảo, giữ nguyên).

### 4.5. Atomic / độ bền (NFR-R1)

- `upsertPrediction` là thao tác **đơn** (1 INSERT/UPDATE/DELETE) → không bắt buộc bọc transaction; nhưng nên `PRAGMA foreign_keys = ON` trước khi ghi để an toàn FK.
- Prediction **không** thuộc luồng tạo hộp atomic — nhập sau, độc lập. Lỗi ghi prediction **không** được làm hỏng hộp; UI báo lỗi nhẹ ("Không lưu được dự đoán, thử lại").

---

## 5. Data Model / Migration

### 5.1. Bảng mới `box_prediction` (PRD §9.3)

| Field | Kiểu (SQLite) | Constraint | Mô tả |
|-------|---------------|------------|-------|
| `id` | TEXT | PRIMARY KEY NOT NULL | UUID v4 sinh ở client |
| `box_id` | TEXT | NOT NULL, **UNIQUE**, FK → box(id) ON DELETE CASCADE | 0..1 / hộp (UNIQUE enforce "tối đa 1 prediction") |
| `prediction_text` | TEXT | NOT NULL | Nội dung dự đoán, ≤ 500 ký tự (enforce ở code) |
| `created_at` | TEXT | NOT NULL | ISO8601 UTC |
| `updated_at` | TEXT | NULL | ISO8601 UTC, cập nhật mỗi lần sửa |

> Dùng `UNIQUE(box_id)` để DB tự bảo đảm bất biến "tối đa 1 prediction / hộp" (giống pattern `reflection_question`). `upsertPrediction` vẫn chủ động check tồn tại để chọn INSERT vs UPDATE.

### 5.2. Migration an toàn (version 3 → 4) — ADDITIVE, không rebuild

Trong `src/db/database.ts`:

1. Tăng `const DATABASE_VERSION = 4`.
2. **Append** block `currentVersion === 3` — **KHÔNG** sửa các block `=== 0`, `=== 1`, `=== 2`:

```ts
if (currentVersion === 3) {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS box_prediction (
      id              TEXT PRIMARY KEY NOT NULL,
      box_id          TEXT NOT NULL UNIQUE,
      prediction_text TEXT NOT NULL,
      created_at      TEXT NOT NULL,
      updated_at      TEXT,
      FOREIGN KEY (box_id) REFERENCES box(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_box_prediction_box_id ON box_prediction (box_id);
  `);
  currentVersion = 4;
}
```

3. Dòng cuối `PRAGMA user_version = ${DATABASE_VERSION}` (đã có) tự cập nhật.

**Yêu cầu migration:**
- Chỉ `CREATE TABLE IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS` — **không** DROP/RENAME/ALTER bảng cũ → **không thể mất dữ liệu** hộp/teaser/notification hiện hữu.
- Bật `PRAGMA foreign_keys = ON` để CASCADE hoạt động.
- App version 3 (đã có hộp) nâng lên 4 phải mượt, hộp cũ giữ nguyên, chỉ có thêm bảng rỗng `box_prediction`.

### 5.3. Type DB row & domain type

- `boxRepository.ts`: thêm interface `PredictionRow { id; box_id; prediction_text; created_at; updated_at: string | null }`.
- `src/types/box.ts`: thêm
  ```ts
  export interface BoxPrediction {
    id: string;
    boxId: string;
    predictionText: string;
    createdAt: string;
    updatedAt?: string;
  }
  ```
  và trên `Box`: thêm `prediction?: BoxPrediction;` (optional, undefined nếu chưa có).

---

## 6. Danh sách Task cần code

### Tầng Type (`src/types/box.ts`)
1. Thêm interface `BoxPrediction`.
2. Thêm field optional `prediction?: BoxPrediction` vào `Box`.

### Tầng DB / Migration (`src/db/database.ts`)
3. `DATABASE_VERSION = 4` + block migration `currentVersion === 3` tạo bảng `box_prediction` (§5.2). **Chỉ append**, không sửa block cũ.

### Tầng Data (`src/db/boxRepository.ts`)
4. Thêm `PredictionRow` + helper `rowToPrediction(row): BoxPrediction`.
5. Thêm hàm thuần chuẩn hóa text: `normalizePredictionText(text): string` (trim + cắt ≤ 500).
6. Thêm `export async function upsertPrediction(boxId: string, text: string): Promise<BoxPrediction | null>` theo §4.2:
   - Guard `is_opened = 0` & box tồn tại/chưa xóa → nếu không thỏa → `throw new Error('BOX_NOT_EDITABLE')`.
   - Trim/cắt; rỗng → `DELETE` row + return `null`; có data → UPDATE nếu tồn tại, ngược lại INSERT.
7. `getBoxById`: thêm `getFirstAsync<PredictionRow>('SELECT * FROM box_prediction WHERE box_id = ?', id)` → gắn vào `rowToBox`.
8. `getAllBoxes`: thêm 1 query `getAllAsync<PredictionRow>(... WHERE box_id IN (...))` → build `predictionMap` (1-1) → truyền vào `rowToBox`.
9. `rowToBox`: nhận thêm tham số `prediction: PredictionRow | null`, set `box.prediction`.
10. `deleteBox`: **không sửa** (CASCADE đã xử lý). *(Ghi rõ trong comment để Agent-Dev không thêm code thừa.)*
11. `createBox`: **không bắt buộc** thêm prediction (mặc định không nhập lúc tạo). Không sửa, trừ khi muốn để chỗ — không cần.

### Tầng UI — Locked (`app/box/[id]/locked.tsx`)
12. Thêm section "Dự đoán của bạn" (chỉ render khi hộp **chưa mở**):
    - `TextInput` multiline, `maxLength={500}`, placeholder "Bạn nghĩ bên trong hộp này là gì?" (PRD §8.5), bộ đếm ký tự `x/500`.
    - State khởi tạo từ `box.prediction?.predictionText ?? ''`.
    - Nút "Lưu dự đoán" → gọi `upsertPrediction(box.id, text)` → `dispatch({ type: 'UPDATE_BOX', payload: { ...box, prediction } })`.
    - Sửa lại được tự do (chừng nào còn ở màn này = hộp chưa mở). Hiển thị "Đã lưu" / cho phép sửa tiếp.
    - Bọc input trong `KeyboardAvoidingView` (đã dùng `ScrollView` sẵn) để không che bàn phím.
    - **Không** thêm bất kỳ render `content`/`image`/`openingNote`/`reflectionQuestion` nào.

### Tầng UI — Detail (`app/box/[id]/detail.tsx`)
13. Thêm section read-only "Bạn đã đoán" hiển thị `box.prediction?.predictionText` (chỉ render nếu có prediction), đặt **ngay sau** section "NỘI DUNG GỐC" (AC-32.4). Dùng cùng pattern stagger animation (`s3Style`/`s4Style`) cho nhất quán. **Không** có nút sửa.

### Tài liệu (bắt buộc theo CLAUDE.md)
14. `CLAUDE.md` (mục Kiến trúc): DB version 3→4; thêm bảng `box_prediction`; bổ sung quy ước prediction (optional, ≤500, read-only sau khi mở, nhập ở màn Locked).
15. `design/database/schema.md`: thêm bảng `box_prediction` (DDL + mô tả + ERD `BOX ||--o| BOX_PREDICTION`), cập nhật mục Migration version 4.
16. (Tùy chọn) tạo `design/flows/F32-prediction.md` mô tả luồng nhập/hiển thị.

---

## 7. File/Module cần SỬA

| File | Thay đổi |
|------|----------|
| `src/types/box.ts` | Thêm `BoxPrediction` + `Box.prediction?`. |
| `src/db/database.ts` | `DATABASE_VERSION = 4` + block migration `=== 3` tạo `box_prediction`. |
| `src/db/boxRepository.ts` | `PredictionRow`, `rowToPrediction`, `normalizePredictionText`, `upsertPrediction`, load prediction trong `getAllBoxes`/`getBoxById`, `rowToBox` nhận prediction. |
| `app/box/[id]/locked.tsx` | UI nhập/sửa prediction (chỉ khi hộp chưa mở). |
| `app/box/[id]/detail.tsx` | Section hiển thị prediction read-only sau "NỘI DUNG GỐC". |
| `CLAUDE.md` | Cập nhật kiến trúc DB v4 + bảng + quy ước prediction. |
| `design/database/schema.md` | Thêm schema `box_prediction` + ERD + migration v4. |

## 8. File/Module cần TẠO MỚI

| File | Mục đích | Ghi chú |
|------|----------|---------|
| `design/flows/F32-prediction.md` *(tùy chọn)* | Mô tả luồng F-32 (nhập ở Locked, hiển thị ở Detail, read-only sau khi mở). | Không bắt buộc nếu đã ghi đủ ở schema.md/CLAUDE.md. |

> F-32 **không** thêm màn hình mới, **không** route mới. Chỉ mở rộng 2 màn sẵn có + 1 bảng + service data.

---

## 9. Acceptance Criteria (PRD §4)

| AC | Tiêu chí | Cách đạt |
|----|----------|----------|
| **AC-32.1** | Hộp đang khóa → nhập prediction → được lưu & gắn với hộp. | `upsertPrediction` INSERT row `box_prediction(box_id)`; UI Locked có input + nút Lưu. |
| **AC-32.2** | Sửa được prediction khi hộp còn Locked. | Input ở màn Locked luôn editable khi `is_opened=0`; upsert làm UPDATE khi đã tồn tại. |
| **AC-32.3** | Sau khi Opened → prediction read-only, không sửa. | Màn Detail chỉ hiển thị (không có nút sửa) **và** `upsertPrediction` guard `is_opened=0` ở data layer (chặn cả khi gọi trực tiếp). |
| **AC-32.4** | Màn chi tiết hộp đã mở hiển thị prediction trước/sau nội dung thật để đối chiếu. | Section read-only đặt ngay sau "NỘI DUNG GỐC". |
| (Ngầm, F-03/AC-03.1) | Không lộ nội dung hộp khóa khi thêm UI prediction. | Locked chỉ render prediction (input của user), không render content/image/note/question. |
| (Ngầm, NFR-R1) | Xóa hộp → prediction bị xóa theo. | FK `ON DELETE CASCADE` + `PRAGMA foreign_keys = ON` (deleteBox giữ nguyên). |

---

## 10. Test case thủ công

**A. Tạo & nhập prediction (AC-32.1)**
1. Tạo hộp `unlockDate = +3 ngày` → vào màn Locked → ✔ thấy section nhập dự đoán, input rỗng, đếm `0/500`.
2. Nhập "Chắc là lời nhắn động viên" → Lưu → ✔ DB `box_prediction` có **1** row đúng `box_id`, `prediction_text`, `created_at` set, `updated_at` null hoặc = created.
3. Thoát ra Home → vào lại Locked → ✔ input hiển thị lại đúng nội dung đã lưu.

**B. Sửa prediction (AC-32.2)**
4. Ở màn Locked, sửa thành nội dung khác → Lưu → ✔ DB vẫn **1** row (UPDATE, không thêm row), `prediction_text` mới, `updated_at` được cập nhật.
5. Xóa trắng input rồi Lưu → ✔ row `box_prediction` bị xóa (hoặc rỗng theo lựa chọn), `box.prediction` về undefined.

**C. Giới hạn ký tự**
6. Dán 600 ký tự → ✔ input chặn ở 500 (maxLength) **và** data layer cắt ≤ 500 (kiểm DB ≤ 500).

**D. Read-only sau khi mở (AC-32.3 / AC-32.4)**
7. Hộp `+1 ngày` đã có prediction → đợi đến hạn / chỉnh giờ → mở hộp → vào Detail → ✔ thấy section "Bạn đã đoán" hiển thị đúng prediction, **không** có nút sửa.
8. ✔ Section prediction nằm **ngay sau** "NỘI DUNG GỐC".
9. (Guard data) Giả lập gọi `upsertPrediction(openedBoxId, '...')` → ✔ throw `BOX_NOT_EDITABLE`, DB **không** đổi.
10. Hộp đã mở mà chưa từng nhập prediction → Detail ✔ **không** render section prediction (không hiện section rỗng).

**E. Không lộ nội dung hộp khóa (F-03)**
11. Ở màn Locked có prediction → ✔ chỉ thấy metadata + teaser (nếu có) + prediction của mình; **không** thấy `content`/ảnh/opening note/câu hỏi của hộp.

**F. Migration (version 3 → 4, additive)**
12. Cài bản **version 3** có sẵn hộp/teaser/notification → cập nhật build mới → mở app → ✔ không crash; `PRAGMA user_version = 4`; bảng `box_prediction` tồn tại & rỗng; hộp/teaser/notification cũ **nguyên vẹn**.
13. Sau migration, mở 1 hộp cũ đã đến hạn → ✔ vẫn mở bình thường (không hồi quy F-06/F-07/F-11).

**G. Xóa & toàn vẹn (CASCADE)**
14. Tạo hộp, nhập prediction → xóa hộp ở màn Locked → ✔ `SELECT * FROM box_prediction WHERE box_id=?` trả **0** row; không crash.
15. ✔ Notification của hộp vẫn bị hủy đúng như Sprint 3 (không hồi quy AC-31.5) — F-32 không làm hỏng luồng xóa.

**H. Optional**
16. Tạo hộp, **không** nhập prediction, mở hộp khi đến hạn → ✔ mọi thứ hoạt động bình thường, Detail không có section prediction.

---

## 11. Rủi ro cần lưu ý

| # | Rủi ro | Hướng xử lý |
|---|--------|-------------|
| R1 | **Sửa prediction sau khi hộp đã mở** (vi phạm AC-32.3) nếu chỉ ẩn nút ở UI. | Enforce **2 tầng**: ẩn UI sửa ở Detail + guard `is_opened = 0` trong `upsertPrediction` (throw nếu đã mở). Test D9. |
| R2 | **Lộ nội dung hộp khóa** khi thêm UI vào màn Locked. | Prediction là input của user, **không** phải nội dung hộp. Tuyệt đối không thêm render content/image/note/question. Giữ nguyên rule F-03. Test E11. |
| R3 | **Migration làm hỏng dữ liệu cũ.** | Migration **additive** thuần (`CREATE TABLE/INDEX IF NOT EXISTS`), không DROP/ALTER. Chỉ append block `=== 3`. Test F12/F13. |
| R4 | **Nhiều prediction / hộp** do upsert sai (INSERT thay vì UPDATE). | `UNIQUE(box_id)` ở DB chặn cứng; `upsertPrediction` check tồn tại trước. Test B4 (vẫn 1 row sau khi sửa). |
| R5 | **Prediction quá dài** vượt 500. | Chặn UI `maxLength=500` + cắt ở `normalizePredictionText`. Test C6. |
| R6 | **Lỗi lưu prediction làm hỏng hộp.** | Prediction độc lập, nằm ngoài transaction tạo hộp; lỗi chỉ báo toast, không ảnh hưởng box. |
| R7 | **Quên CASCADE** → row prediction mồ côi sau khi xóa hộp. | FK `ON DELETE CASCADE` + `deleteBox` đã `PRAGMA foreign_keys = ON`. Test G14. |
| R8 | **Đụng nhầm `deleteBox`/notification.** | F-32 KHÔNG sửa `deleteBox`, KHÔNG đụng notification. CASCADE lo phần prediction. Test G15. |
| R9 | **Bàn phím che input** ở màn Locked (ScrollView). | Dùng `KeyboardAvoidingView` + scroll tới input khi focus. |

---

## 12. Prompt giao Agent-Dev

```
Bạn là Agent-Dev (React Native / Expo SDK 54). Triển khai Sprint 4 — Prediction Before Opening (F-32)
theo file Sprint/sprint4.md. Đọc kỹ sprint4.md trước khi code, bám đúng scope, KHÔNG thêm tính năng ngoài PRD.

Phạm vi:
1. Migration DB an toàn version 3 → 4 (src/db/database.ts): ADDITIVE — CREATE TABLE IF NOT EXISTS
   box_prediction (id PK, box_id NOT NULL UNIQUE FK->box ON DELETE CASCADE, prediction_text NOT NULL,
   created_at NOT NULL, updated_at NULL) + CREATE INDEX idx_box_prediction_box_id. CHỈ append block
   currentVersion===3, KHÔNG sửa block cũ, KHÔNG DROP/ALTER/RENAME bảng nào.
2. Types (src/types/box.ts): thêm interface BoxPrediction + field optional Box.prediction?.
3. boxRepository.ts: thêm PredictionRow + rowToPrediction + normalizePredictionText(text -> trim, cắt
   ≤500); upsertPrediction(boxId, text): GUARD is_opened=0 (throw 'BOX_NOT_EDITABLE' nếu hộp đã mở/đã
   xóa) → text rỗng thì xóa row & return null → có data thì UPDATE nếu tồn tại, ngược lại INSERT (UUID,
   created_at/updated_at). Load prediction vào getBoxById + getAllBoxes (map 1-1), rowToBox set
   box.prediction. KHÔNG sửa deleteBox (CASCADE tự xóa), KHÔNG sửa createBox.
4. UI Locked (app/box/[id]/locked.tsx): thêm section nhập/sửa prediction CHỈ khi hộp chưa mở — TextInput
   multiline maxLength=500, placeholder "Bạn nghĩ bên trong hộp này là gì?", đếm ký tự, nút Lưu gọi
   upsertPrediction rồi dispatch UPDATE_BOX. KeyboardAvoidingView. TUYỆT ĐỐI không render
   content/image/opening_note/reflection của hộp.
5. UI Detail (app/box/[id]/detail.tsx): thêm section read-only hiển thị box.prediction.predictionText
   NGAY SAU section "NỘI DUNG GỐC" (chỉ render nếu có prediction). Không có nút sửa.
6. Cập nhật CLAUDE.md, design/database/schema.md (bảng box_prediction + ERD + migration v4).

Ràng buộc bắt buộc:
- Prediction read-only sau khi hộp đã mở: enforce 2 tầng (ẩn UI sửa ở Detail + guard is_opened=0 trong
  upsertPrediction). Sửa được tự do khi hộp chưa mở.
- KHÔNG lộ nội dung hộp khóa: màn Locked chỉ hiện prediction của user, không render nội dung hộp.
- Migration ADDITIVE, không mất dữ liệu version 3 (hộp/teaser/notification giữ nguyên).
- box_prediction CASCADE theo box; KHÔNG sửa luồng xóa hộp / notification của Sprint 3.
- prediction tối đa 500 ký tự, optional, tối đa 1/hộp (UNIQUE box_id).
- KHÔNG thêm màn hình/route mới, KHÔNG nhập prediction ở form tạo hộp, KHÔNG tính năng V2.

Sau khi code: chạy app, làm theo Test case thủ công §10 (đặc biệt F12/F13 migration, D9 guard data
read-only, E11 không lộ nội dung, G14 CASCADE xóa), báo lại kết quả từng case.
```

---

*Hết Implementation Brief Sprint 4 — F-32 Prediction Before Opening.*
