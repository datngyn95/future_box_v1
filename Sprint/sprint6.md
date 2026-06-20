# Sprint 6 — Post-open Reflection & Create Next Box CTA (F-34, F-35)

> **Implementation Brief cho Agent-Dev**
> Tác giả: Agent-BA · Ngày: 2026-06-20 · Nhánh: `feature/sprint-06-reflection-next-box`
> Nguồn: PRD v1.2 (§3.5, §4 F-34/F-35, §8.7, §8.8, §9.4, §10 Sprint 6)

---

## 0. Tiền kiểm — Sprint trước & ảnh hưởng

### 0.1. Sprint 5 (Opening Ritual — F-33) đã hoàn tất ✅ (merged vào `main`)

Nhánh `feature/sprint-06-reflection-next-box` được tạo từ `main` sau commit merge `f77957d`, đã có đầy đủ thành quả Sprint 1→5. Không có việc dở dang chặn Sprint 6.

Codebase hiện có (liên quan tới luồng sau khi mở hộp):

- **DB version 4**, 5 bảng: `box`, `reflection_question`, `notification_schedule`, `box_teaser`, `box_prediction`.
- `reflection_question` (`src/db/database.ts:54`): quan hệ **1-1** với box (`box_id UNIQUE`, FK `ON DELETE CASCADE`). Cột hiện có: `id`, `box_id`, `question_text` **NOT NULL**, `answer` (`yes`/`no`), `answered_at`.
  ⚠️ **Một row reflection_question chỉ tồn tại khi người dùng có nhập câu hỏi Yes/No lúc tạo hộp.** Hộp không có câu hỏi → **không có row** trong bảng này.
- `answerReflectionQuestion(boxId, answer)` (`src/db/boxRepository.ts:586`): chỉ `UPDATE answer/answered_at` (giả định row đã tồn tại).
- Màn `box/[id]/detail.tsx` — màn nội dung hộp đã mở:
  - **Early-return `null` khi `status !== 'opened'`** (`detail.tsx:343`) → không lộ nội dung hộp khóa.
  - Đã có section: Opening Note (F-16), meta, nội dung gốc, prediction (F-32), ảnh (F-10), câu hỏi reflection Yes/No (F-07).
  - Đã có `ConfettiOverlay` (đáp Yes) và `EmpathyCard` (đáp No). **`EmpathyCard` đã có sẵn nút "Tạo hộp mới" → `router.push('/create-box')`** ⇒ một phần AC-34.4 và F-35 (nhánh "No") đã có nền.
  - Stagger fade-in 4 section khi `isFirstOpen === '1'` (F-14/F-33).
- `getBoxStatus(box)` (`src/store/boxStore.tsx:75`): derived `locked | ready_to_open | opened`.
- Reducer `UPDATE_BOX` (`boxStore.tsx:50`): thay thế nguyên 1 box trong list → dispatch `{...box, ...fieldsMới}` là cách cập nhật chuẩn (đã dùng cho `reflectionAnswer`, `prediction`).
- Luồng tạo hộp đầu vào: `router.push('/create-box')` (Select Box Type Screen `app/create-box/index.tsx`).

### 0.2. Khoảng trống mà F-34 / F-35 cần lấp

| Hiện trạng | Còn thiếu cho Sprint 6 |
|-----------|------------------------|
| Reflection chỉ có Yes/No (F-07). | **F-34**: viết cảm nhận tự do (note) + **rating 1-5 optional** sau khi mở; lưu & hiển thị lại; sửa được sau khi mở. |
| `reflection_question` không có cột `reflection_note`, `rating`, `updated_at`; row chỉ tồn tại khi có câu hỏi. | Migration **v4→v5** thêm 3 cột + cho phép lưu reflection cho **mọi hộp đã mở** kể cả hộp **không có câu hỏi Yes/No**. |
| CTA tạo hộp mới chỉ xuất hiện trong `EmpathyCard` (nhánh đáp "No"). | **F-35**: CTA "Tạo hộp mới cho tương lai" **luôn** hiện ở **cuối** màn detail của hộp đã mở (mọi nhánh, không cản trở đọc). |

### 0.3. Phụ thuộc & rủi ro kế thừa

- F-34 phụ thuộc **F-07** (đã có) + **F-11** (đã có). F-35 phụ thuộc **F-07** (đã có).
- **Cần DB migration** (xem §5) → áp dụng ràng buộc "migration an toàn".
- **Không** đụng F-30 teaser, **không** đụng F-31 notification, **không** đụng F-32 prediction logic, **không** đụng F-33 ritual.

---

## 1. Mục tiêu Sprint

Hoàn thiện **vế cuối của vòng lặp cảm xúc V1**: sau khi mở hộp, người dùng có thể (1) **viết cảm nhận sâu hơn + chấm điểm 1-5** thay vì chỉ Yes/No (F-34), và (2) được **gợi ý tạo hộp tiếp theo** ngay tại màn chi tiết để khép vòng *Tạo hộp → … → Mở hộp → Reflection → Tạo hộp mới* (F-35).

```
… Mở hộp (F-33) → [Yes/No có sẵn] + Reflection Note + Rating (F-34) → Create Next Box CTA (F-35) → Tạo hộp mới
```

**Ngoài phạm vi sprint này (KHÔNG làm):**

- **KHÔNG** làm F-36 Personal Stats (đó là Sprint 7) — kể cả "empty state màn thống kê" nêu trong PRD §8.8 (vì màn Stats chưa tồn tại). CTA của F-35 chỉ đặt ở **cuối màn detail hộp đã mở**.
- **KHÔNG** thêm loại hộp mới F-37 (Sprint 7).
- **KHÔNG** đổi reflection question Yes/No đã có thành thang điểm (đó là F-22 — Could, ngoài V1 sprint này). Rating của F-34 là **trường riêng**, **không** thay thế Yes/No.
- **KHÔNG** cho sửa nội dung gốc / ảnh / opening note / câu hỏi của hộp (giữ read-only — AC-11.2, Q7).
- **KHÔNG** đụng prediction (F-32), teaser (F-30), notification (F-31), ritual (F-33).
- **KHÔNG** thêm notification mới cho reflection.
- Mọi tính năng V2: account, cloud sync, gửi hộp cho người khác, hộp nhóm, public box.

---

## 2. Feature ID liên quan

- **F-34 — Post-open Reflection Note** (Should, V1). Phụ thuộc: F-07, F-11. AC: **AC-34.1 → AC-34.4** (PRD §4). Mô tả: PRD §8.7. Data: PRD §9.4.
- **F-35 — Create Next Box CTA** (Should, V1). Phụ thuộc: F-07. AC: **AC-35.1 → AC-35.3** (PRD §4). Mô tả: PRD §8.8.
- Roadmap: PRD §10 Sprint 6.
- NFR liên quan: **NFR-R1** (ghi DB transaction/atomic an toàn), **NFR-U2/U4** (cảm xúc, chạm ≥ 44pt), **NFR-S1/AC-03.1** (không lộ nội dung hộp khóa — reflection chỉ ở màn opened).

---

## 3. User Stories

| ID | Story |
|----|-------|
| US-1 | Là người dùng, sau khi mở hộp, tôi muốn viết vài dòng cảm nhận hiện tại để lưu lại sự thay đổi của bản thân theo thời gian. |
| US-2 | Là người dùng, tôi muốn chấm điểm 1-5 cho cảm xúc/mức độ hài lòng khi mở hộp, nhưng cũng có thể bỏ qua rating nếu không muốn. |
| US-3 | Là người dùng, tôi muốn viết cảm nhận **kể cả khi hộp không có câu hỏi Yes/No**. |
| US-4 | Là người dùng, khi quay lại xem một hộp đã mở, tôi muốn thấy lại cảm nhận & rating đã viết, và có thể sửa nó. |
| US-5 | Là người dùng, sau khi đọc xong nội dung hộp cũ, tôi muốn một nút dễ thấy để tạo hộp mới cho tương lai mà không bị nó che mất nội dung. |
| US-6 | Là người dùng đáp "Không" ở câu hỏi Yes/No, tôi muốn được an ủi và gợi ý tạo hộp mới (đã có — giữ nguyên). |

---

## 4. Business Rules

### 4.1. Reflection Note & Rating (F-34 — AC-34.1, AC-34.2, AC-34.3)

- Reflection note là **optional**; rating là **optional**, thang **1-5** (số nguyên).
- Reflection chỉ ghi/sửa được khi **hộp đã mở** (`is_opened = 1`). Tầng data phải **guard**: nếu hộp chưa mở/không tồn tại → throw `BOX_NOT_OPENED` (tương tự cách `upsertPrediction` guard `BOX_NOT_EDITABLE`).
- **Reflection note CÓ THỂ sửa sau khi hộp đã mở** (khác prediction — prediction read-only sau mở). Mỗi lần lưu cập nhật `updated_at`.
- Reflection (note + rating) phải lưu được cho **mọi hộp đã mở**, **bất kể có hay không có câu hỏi Yes/No**.
- Lưu trống (note rỗng **và** không rating) → coi như xóa reflection note/rating của hộp (xem §5 để biết cách xử lý row), nhưng **không được** xóa mất `question_text`/`answer` nếu hộp vốn có câu hỏi Yes/No.
- Nội dung gốc của hộp vẫn **read-only** — reflection là trường tách biệt, không sửa `content`/`image_path`/`opening_note`/`reflection_question.question_text`.

### 4.2. Quan hệ với câu hỏi Yes/No có sẵn (không hồi quy F-07)

- Reflection note/rating **độc lập** với answer Yes/No. Cả hai cùng nằm trên 1 hàng `reflection_question` (1-1 với box).
- Đáp Yes vẫn bắn confetti; đáp No vẫn hiện `EmpathyCard` (giữ nguyên). `answerReflectionQuestion` **không** được đụng tới `reflection_note`/`rating`; hàm reflection mới **không** được đụng tới `answer`/`question_text`.

### 4.3. Create Next Box CTA (F-35 — AC-35.1, AC-35.2, AC-35.3)

- CTA **"Tạo hộp mới cho tương lai"** hiển thị sau khi hộp đã mở (status `opened`).
- CTA đặt ở **cuối ScrollView** màn detail, **không che / không cản trở** việc đọc nội dung (AC-35.2). Không dùng modal bắt buộc.
- Nhấn CTA → `router.push('/create-box')` (vào Select Box Type Screen — luồng tạo hộp mới hiện có) (AC-35.3).
- Nút trong `EmpathyCard` (nhánh đáp "No") giữ nguyên — đó là điểm chạm bổ sung của AC-34.4, **không** loại bỏ.
- Nội dung CTA mẫu (chọn 1, PRD §8.8): "Gửi tiếp một điều cho tương lai" / "Tạo hộp mới cho bạn của 1 tháng sau" / "Viết tiếp một lời nhắn cho chính mình".

### 4.4. Không lộ nội dung hộp khóa (F-03 / AC-03.1)

- Reflection input + rating + CTA **chỉ render khi `status === 'opened'`**. Giữ nguyên early-return `null` ở `detail.tsx` khi `status !== 'opened'`.
- Sprint này **không** thêm bất kỳ điểm hiển thị nào ở màn Locked / Pre-open / danh sách.

### 4.5. Notification — không thay đổi

- F-34/F-35 **không** tạo/sửa/hủy notification. Khi xóa hộp, luồng hủy notification + CASCADE hiện có (`deleteBox`, `boxRepository.ts:525`) đã đúng và **được kế thừa nguyên vẹn**; reflection row mới nằm trên `reflection_question` đã có FK `ON DELETE CASCADE` → tự xóa theo box. **Không** cần đụng `deleteBox`.

---

## 5. Data Model / Migration (BẮT BUỘC migration an toàn)

### 5.1. Quyết định thiết kế (BA chốt)

Theo **PRD §9.4**: bổ sung vào bảng `reflection_question` các field `reflection_note TEXT`, `rating INTEGER`, `updated_at TEXT`.

**Vấn đề:** `question_text` hiện là **NOT NULL** và row chỉ tồn tại khi hộp có câu hỏi Yes/No. Để lưu reflection cho hộp **không có câu hỏi**, cần INSERT một row mới mà không có `question_text` → vi phạm NOT NULL. `ALTER TABLE ADD COLUMN` **không** đổi được ràng buộc NOT NULL của cột cũ.

**Giải pháp đã chốt (an toàn, đúng PRD §9.4):** Migration **v4 → v5** rebuild bảng `reflection_question` theo **đúng pattern rebuild đã dùng ở v2→v3** trong dự án, để:
1. Đổi `question_text` thành **nullable** (cho phép row reflection-only của hộp không có câu hỏi).
2. Thêm `reflection_note TEXT`, `rating INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)`, `updated_at TEXT`.
3. Giữ nguyên `box_id UNIQUE`, FK `ON DELETE CASCADE`, các cột cũ (`answer`, `answered_at`) và **toàn bộ dữ liệu cũ**.

> Đây là rebuild **bảo toàn dữ liệu** (copy đủ row), không drop/sửa bảng khác. Nâng `DATABASE_VERSION` từ `4` → `5`.

### 5.2. Nội dung migration (append vào `migrateDbIfNeeded`, KHÔNG sửa block cũ)

```sql
-- if (currentVersion === 4) { ... currentVersion = 5; }
PRAGMA foreign_keys = OFF;

CREATE TABLE reflection_question_new (
  id              TEXT PRIMARY KEY NOT NULL,
  box_id          TEXT NOT NULL UNIQUE,
  question_text   TEXT,                          -- nới NOT NULL → nullable
  answer          TEXT CHECK (answer IN ('yes','no')),
  answered_at     TEXT,
  reflection_note TEXT,
  rating          INTEGER CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
  updated_at      TEXT,
  FOREIGN KEY (box_id) REFERENCES box(id) ON DELETE CASCADE
);

INSERT INTO reflection_question_new
  (id, box_id, question_text, answer, answered_at)
SELECT id, box_id, question_text, answer, answered_at
FROM reflection_question;

DROP TABLE reflection_question;
ALTER TABLE reflection_question_new RENAME TO reflection_question;

PRAGMA foreign_keys = ON;
```

Sau tất cả block: `PRAGMA user_version = 5` (đã có dòng set cuối hàm — chỉ cần đổi `DATABASE_VERSION`).

### 5.3. Ràng buộc migration an toàn (bắt buộc)

- **Chỉ append** block `if (currentVersion === 4)`, **KHÔNG** sửa các block v0/v1/v2/v3 đã release.
- Rebuild phải **copy đủ** cột cũ (`id, box_id, question_text, answer, answered_at`) — **không mất dữ liệu** câu hỏi/đáp án đã có.
- `rating` ràng buộc `NULL OR 1..5`; `question_text` cho phép NULL.
- Thực hiện trong cùng `db.execAsync` (như block v2→v3) để chạy tuần tự; FK OFF trước khi drop, ON sau khi rename.
- Idempotent theo `user_version`: chạy lại app không lặp migration.

### 5.4. Cập nhật `src/types/box.ts`

Thêm vào interface `Box`:

```ts
reflectionNote?: string;
reflectionRating?: number;     // 1..5
reflectionUpdatedAt?: string;  // ISO, tùy chọn dùng để hiển thị "đã cập nhật"
```

---

## 6. Danh sách Task cần code

### Tầng DB / migration
1. `src/db/database.ts`: đổi `DATABASE_VERSION` `4 → 5`; **append** block `if (currentVersion === 4)` rebuild `reflection_question` theo §5.2. Không sửa block cũ.

### Tầng types
2. `src/types/box.ts`: thêm `reflectionNote?`, `reflectionRating?`, `reflectionUpdatedAt?` vào `Box` (§5.4).

### Tầng repository (`src/db/boxRepository.ts`)
3. Cập nhật `interface ReflectionRow`: thêm `reflection_note: string | null`, `rating: number | null`, `updated_at: string | null`.
4. Cập nhật `rowToBox(...)`: map `reflection.reflection_note → reflectionNote`, `reflection.rating → reflectionRating`, `reflection.updated_at → reflectionUpdatedAt`.
   (`getAllBoxes`/`getBoxById` dùng `SELECT *` nên đã lấy cột mới — chỉ cần map.)
5. Thêm hàm mới `upsertReflectionNote(boxId, { note, rating })`:
   - `PRAGMA foreign_keys = ON`.
   - Lấy box: nếu không tồn tại / `is_deleted=1` / `is_opened=0` → throw `BOX_NOT_OPENED` (guard tầng data — không chỉ UI).
   - Chuẩn hóa: `note = text.trim()` (giới hạn độ dài hợp lý, đề xuất tối đa **1000 ký tự** — xem §11 R5; nếu rỗng → NULL). `rating`: nếu không có → NULL; nếu có phải là số nguyên 1-5 (validate, ngoài range → throw hoặc clamp + bỏ qua).
   - Nếu **đã có row** `reflection_question` cho box: `UPDATE reflection_question SET reflection_note=?, rating=?, updated_at=? WHERE box_id=?` (**không** đụng `question_text`/`answer`/`answered_at`).
   - Nếu **chưa có row** (hộp không có câu hỏi): `INSERT INTO reflection_question (id, box_id, question_text, answer, answered_at, reflection_note, rating, updated_at) VALUES (?, ?, NULL, NULL, NULL, ?, ?, ?)`.
   - Trả về `BoxPrediction`-style object hoặc đơn giản trả `Box` đã cập nhật / các field reflection để UI dispatch.
   - **Lưu ý:** `answerReflectionQuestion` hiện chỉ `UPDATE` (giả định row tồn tại — đúng, vì chỉ gọi khi có câu hỏi). **Không cần đổi** hàm này; nhưng nếu Agent-Dev muốn an toàn thì giữ nguyên — ngoài scope.

### Tầng UI — Detail (`app/box/[id]/detail.tsx`) — TRỌNG TÂM
6. Thêm **section "Cảm nhận sau khi mở" (F-34)** — chỉ render khi `status === 'opened'`:
   - Ô nhập đa dòng (`TextInput multiline`) cho reflection note; hiển thị giá trị `box.reflectionNote` nếu có.
   - Bộ chọn **rating 1-5** (5 ngôi sao / chip số), cho phép **bỏ chọn** (optional); hiển thị `box.reflectionRating` nếu có. Touch target ≥ 44pt (NFR-U4).
   - Nút "Lưu cảm nhận" → gọi `upsertReflectionNote` → `dispatch(UPDATE_BOX { ...box, reflectionNote, reflectionRating, reflectionUpdatedAt })` → cho phép sửa lại sau (AC-34.3). Lỗi → `Alert`.
   - Khi đã có note/rating, hiển thị dạng đã lưu + cho phép "Sửa" (giống pattern đổi câu trả lời đã có).
   - Đặt section **sau** câu hỏi Yes/No, **trước** CTA tạo hộp mới.
7. Thêm **Create Next Box CTA (F-35)** ở **cuối ScrollView** (sau reflection):
   - Nút nổi bật "Tạo hộp mới cho tương lai" → `router.push('/create-box')` (AC-35.3).
   - Không che nội dung; nằm trong luồng cuộn (AC-35.2). Có thể thêm vào nhóm stagger `s4Style` cho mượt.
8. Đảm bảo **không** render reflection/CTA khi `status !== 'opened'` (đã có early-return `null` — không phá).
9. (Tùy chọn) tách component nhỏ `ReflectionNoteSection` trong cùng file hoặc `src/components/` nếu thấy file dài; không bắt buộc.

### Tài liệu (bắt buộc theo CLAUDE.md)
10. `CLAUDE.md`:
    - Cập nhật **SQLite hiện là DB version 5**; bảng `reflection_question` thêm `reflection_note`, `rating (1-5)`, `updated_at`, và `question_text` đổi thành nullable; mô tả migration v4→v5 (rebuild bảo toàn dữ liệu, đúng pattern v2→v3).
    - Bảng "schema": cập nhật mô tả `reflection_question`.
    - Quy ước: thêm mục **Post-open Reflection (F-34)** (reflection note + rating optional, chỉ ghi khi `is_opened=1`, guard `BOX_NOT_OPENED`, sửa được sau mở, không đụng `answer`/nội dung gốc) và **Create Next Box CTA (F-35)** (CTA cuối màn detail → `/create-box`).
11. (Tùy chọn) `design/flows/F34-F35-reflection-next-box.md`: mô tả flow PRD §8.7/§8.8. Không bắt buộc nếu CLAUDE.md đã đủ.

---

## 7. File/Module cần SỬA

| File | Thay đổi |
|------|----------|
| `src/db/database.ts` | `DATABASE_VERSION 4→5`; append block migration v4→v5 rebuild `reflection_question` (§5.2). |
| `src/types/box.ts` | Thêm `reflectionNote?`, `reflectionRating?`, `reflectionUpdatedAt?` vào `Box`. |
| `src/db/boxRepository.ts` | Mở rộng `ReflectionRow`; map field mới trong `rowToBox`; thêm hàm `upsertReflectionNote`. |
| `app/box/[id]/detail.tsx` | Thêm section reflection note + rating (F-34) và CTA tạo hộp mới (F-35); chỉ khi `status==='opened'`. |
| `CLAUDE.md` | Cập nhật schema/version + quy ước F-34/F-35. |

## 8. File/Module cần TẠO MỚI

| File | Mục đích | Ghi chú |
|------|----------|---------|
| `src/components/ReflectionNoteSection.tsx` *(tùy chọn)* | Tách UI reflection note + rating cho gọn. | Không bắt buộc; có thể để inline trong `detail.tsx`. |
| `design/flows/F34-F35-reflection-next-box.md` *(tùy chọn)* | Mô tả luồng F-34/F-35. | Không bắt buộc nếu CLAUDE.md đủ. |

> Sprint 6 **không** thêm route/màn mới. Reflection + CTA nằm trong màn `detail.tsx` đã có.

---

## 9. Acceptance Criteria (PRD §4)

| AC | Tiêu chí | Cách đạt |
|----|----------|----------|
| **AC-34.1** | Hộp đã mở → viết cảm nhận → reflection note được lưu cùng hộp. | `upsertReflectionNote` ghi `reflection_note` vào `reflection_question` (row tạo mới nếu cần); dispatch `UPDATE_BOX`. |
| **AC-34.2** | Người dùng có thể chọn rating 1-5 **hoặc bỏ qua** rating. | Rating optional, lưu NULL khi không chọn; CHECK `NULL OR 1..5`. |
| **AC-34.3** | Reflection note hiển thị lại khi xem chi tiết hộp đã mở (và sửa được sau mở). | `rowToBox` map `reflectionNote/reflectionRating`; UI hiển thị + cho "Sửa"; `upsertReflectionNote` cập nhật `updated_at`. |
| **AC-34.4** | Đáp "Không" ở Yes/No → hiện thông điệp đồng cảm + gợi ý tạo hộp mới. | `EmpathyCard` đã có (giữ nguyên) + CTA F-35 ở cuối màn. |
| **AC-35.1** | Sau khi mở hộp thành công → hiện CTA "Tạo hộp mới…". | CTA render khi `status==='opened'` ở cuối ScrollView. |
| **AC-35.2** | CTA không cản trở đọc nội dung; ưu tiên cuối màn / sau reflection. | CTA đặt cuối ScrollView, không modal chặn. |
| **AC-35.3** | Nhấn CTA → điều hướng sang luồng tạo hộp mới. | `router.push('/create-box')`. |
| (Ngầm, AC-03.1) | Không lộ nội dung hộp khóa. | Reflection/CTA chỉ render khi `status==='opened'`; giữ early-return `null`. |
| (Ngầm, AC-11.2) | Nội dung gốc read-only. | Reflection là trường riêng; không sửa `content`/ảnh/note/question. |
| (Ngầm, AC-08.4) | Xóa hộp hủy notification + xóa reflection. | `deleteBox` không đổi; reflection row CASCADE theo box. |

---

## 10. Test case thủ công

**A. Reflection note + rating cơ bản (AC-34.1, AC-34.2, AC-34.3)**
1. Mở một hộp **có câu hỏi Yes/No** → cuộn xuống thấy section "Cảm nhận sau khi mở" → nhập note + chọn rating 4 → "Lưu" → ✔ lưu thành công.
2. Thoát ra Home rồi vào lại detail hộp đó → ✔ note + rating 4 hiển thị lại đúng.
3. Bấm "Sửa" → đổi note + đổi rating sang 2 → lưu → vào lại → ✔ giá trị mới hiển thị; (DB) `updated_at` thay đổi.
4. Lưu reflection **không chọn rating** (chỉ note) → ✔ lưu ok, `rating = NULL`; hiển thị lại không có sao nào được chọn.
5. Lưu reflection **chỉ rating, note rỗng** → ✔ lưu ok.

**B. Hộp KHÔNG có câu hỏi Yes/No (AC-34.1 — case quan trọng)**
6. Tạo hộp **không nhập câu hỏi**, mở khi tới hạn → vào detail → ✔ **không** có section câu hỏi Yes/No nhưng **vẫn có** section reflection note.
7. Viết note + rating → lưu → vào lại → ✔ hiển thị đúng. (DB) ✔ có **1 row** `reflection_question` với `question_text IS NULL`, `answer IS NULL`, `reflection_note` có giá trị.

**C. Không hồi quy câu hỏi Yes/No (F-07)**
8. Hộp có câu hỏi: đáp "Có" → ✔ confetti vẫn chạy; đáp "Không" → ✔ `EmpathyCard` vẫn hiện kèm nút "Tạo hộp mới".
9. Sau khi đã có note/rating, đổi câu trả lời Yes/No → ✔ note/rating **không** bị mất; (DB) `answer` đổi nhưng `reflection_note`/`rating` giữ nguyên.
10. Sau khi đáp Yes/No, lưu reflection note → ✔ `answer`/`answered_at` **không** bị ghi đè.

**D. Create Next Box CTA (F-35)**
11. Mở bất kỳ hộp đã mở → cuộn xuống cuối → ✔ thấy CTA "Tạo hộp mới…"; CTA **không** che nội dung khi mới vào màn.
12. Nhấn CTA → ✔ điều hướng sang màn Select Box Type (`/create-box`).
13. Nút "Tạo hộp mới" trong `EmpathyCard` (đáp No) → ✔ vẫn hoạt động.

**E. Guard / không lộ nội dung (AC-03.1, AC-11.2)**
14. Hộp đang **Locked** / **ReadyToOpen** → ✔ **không** thấy section reflection/CTA (màn redirect/early-return đúng).
15. (Dev test) Gọi `upsertReflectionNote` trên hộp **chưa mở** → ✔ throw `BOX_NOT_OPENED`, không ghi DB.
16. ✔ Không có chỗ nào sửa được `content`/ảnh/opening note/câu hỏi gốc.

**F. Migration an toàn (NFR-R1)**
17. Cập nhật app trên thiết bị **đã có dữ liệu cũ (version 4)** với hộp có câu hỏi đã đáp Yes/No → mở app → ✔ migrate lên v5 không crash; ✔ câu hỏi & đáp án cũ **còn nguyên**; ✔ `PRAGMA user_version = 5`.
18. (DB) `PRAGMA table_info(reflection_question)` → ✔ có `reflection_note`, `rating`, `updated_at`; `question_text` nullable; `box_id` vẫn UNIQUE.
19. Khởi động lại app lần nữa → ✔ không chạy lại migration (idempotent), dữ liệu reflection vẫn còn.

**G. Xóa hộp (AC-08.4 — không hồi quy)**
20. Xóa một hộp đã có reflection note → ✔ row reflection_question bị xóa theo (CASCADE); notification (nếu có) vẫn bị hủy như cũ.

**H. NFR**
21. ✔ Lưu reflection nhanh, không giật; touch target sao/nút ≥ 44pt; nhập note dài vẫn cuộn mượt.

---

## 11. Rủi ro cần lưu ý

| # | Rủi ro | Hướng xử lý |
|---|--------|-------------|
| R1 | **Mất dữ liệu câu hỏi/đáp án cũ khi rebuild bảng.** | Migration copy đủ cột cũ (`INSERT … SELECT`), test F17/F18. Chỉ append block, không sửa migration cũ. |
| R2 | **Hộp không có câu hỏi không lưu được reflection** do `question_text NOT NULL`. | Migration nới `question_text` thành nullable; `upsertReflectionNote` INSERT row với `question_text NULL`. Test B6/B7. |
| R3 | **Reflection ghi đè answer/câu hỏi Yes/No** (hoặc ngược lại). | `upsertReflectionNote` chỉ set `reflection_note/rating/updated_at`; `answerReflectionQuestion` chỉ set `answer/answered_at`. Test C9/C10. |
| R4 | **Ghi reflection cho hộp chưa mở** (lộ/sai vòng đời). | Guard tầng data `is_opened=1` → throw `BOX_NOT_OPENED`; UI chỉ render khi `status==='opened'`. Test E14/E15. |
| R5 | **Rating ngoài 1-5 / note quá dài.** | CHECK `rating NULL OR 1..5` ở DB; UI giới hạn note (đề xuất ≤ 1000 ký tự) + clamp rating. |
| R6 | **CTA che nội dung / gây khó đọc** (AC-35.2). | Đặt CTA trong ScrollView ở cuối, không modal; test D11. |
| R7 | **Lộ nội dung hộp khóa** nếu vô tình render reflection/CTA ngoài trạng thái opened. | Chỉ render khi `status==='opened'`; giữ early-return `null`. Test E14. |
| R8 | **Đụng nhầm F-30/F-31/F-32/F-33.** | Sprint chỉ thêm cột reflection + UI detail; không sửa teaser/notification/prediction/ritual. |
| R9 | **Migration chạy lặp / version sai.** | Dùng `PRAGMA user_version`; chỉ set `=5` ở cuối; idempotent. Test F19. |
| R10 | **Notification không bị ảnh hưởng nhưng quên kiểm tra xóa.** | `deleteBox` giữ nguyên; reflection CASCADE theo box. Test G20. |

---

## 12. Prompt giao Agent-Dev

```
Bạn là Agent-Dev (React Native / Expo SDK 54, chạy Expo Go). Triển khai Sprint 6 — Post-open Reflection
& Create Next Box CTA (F-34, F-35) theo file Sprint/sprint6.md. Đọc kỹ sprint6.md trước khi code, bám đúng
scope, KHÔNG thêm tính năng ngoài PRD.

Bối cảnh: DB hiện version 4. Bảng reflection_question (1-1 với box, box_id UNIQUE, FK CASCADE) có cột
question_text NOT NULL, answer, answered_at — và row CHỈ tồn tại khi hộp có câu hỏi Yes/No. detail.tsx đã
early-return null khi status!=='opened', đã có confetti (Yes) + EmpathyCard (No, đã có nút "Tạo hộp mới").
Reducer UPDATE_BOX thay nguyên 1 box. router.push('/create-box') vào luồng tạo hộp.

Phạm vi:
1. DB migration v4→v5 (src/db/database.ts): đổi DATABASE_VERSION 4→5; APPEND block if(currentVersion===4)
   rebuild reflection_question theo pattern v2→v3: tạo bảng _new với question_text NULLABLE + thêm
   reflection_note TEXT, rating INTEGER CHECK(rating IS NULL OR rating BETWEEN 1 AND 5), updated_at TEXT;
   INSERT…SELECT copy đủ cột cũ (id,box_id,question_text,answer,answered_at); drop+rename; FK OFF→ON.
   KHÔNG sửa block migration cũ. Giữ box_id UNIQUE + FK CASCADE.
2. Types (src/types/box.ts): thêm reflectionNote?, reflectionRating?, reflectionUpdatedAt? vào Box.
3. Repository (src/db/boxRepository.ts): mở rộng ReflectionRow (reflection_note, rating, updated_at);
   map trong rowToBox; thêm upsertReflectionNote(boxId,{note,rating}): guard is_opened=1 else throw
   BOX_NOT_OPENED; UPDATE nếu row tồn tại / INSERT row (question_text NULL) nếu chưa; CHỈ đụng
   reflection_note/rating/updated_at, KHÔNG đụng answer/question_text. KHÔNG đổi answerReflectionQuestion.
4. UI detail.tsx (app/box/[id]/detail.tsx), chỉ khi status==='opened':
   - Section "Cảm nhận sau khi mở" (F-34): TextInput multiline + chọn rating 1-5 optional (bỏ chọn được),
     nút Lưu → upsertReflectionNote → dispatch(UPDATE_BOX). Hiển thị lại note/rating đã lưu + cho "Sửa".
     Đặt sau câu hỏi Yes/No, trước CTA. Touch target ≥44pt.
   - CTA "Tạo hộp mới cho tương lai" (F-35) ở CUỐI ScrollView → router.push('/create-box'). Không modal
     chặn, không che nội dung.
5. Cập nhật CLAUDE.md: DB version 5, reflection_question thêm reflection_note/rating/updated_at +
   question_text nullable + mô tả migration v4→v5; quy ước F-34 (reflection optional, chỉ ghi khi opened,
   guard BOX_NOT_OPENED, sửa được sau mở, không đụng answer/nội dung gốc) và F-35 (CTA cuối detail).

Ràng buộc bắt buộc:
- Migration AN TOÀN: chỉ append block v4→v5, copy đủ dữ liệu cũ (không mất câu hỏi/đáp án), idempotent qua
  user_version, set =5 ở cuối. Test với DB cũ có dữ liệu.
- Reflection chỉ ghi/sửa khi hộp đã mở (guard tầng data). Reflection độc lập với Yes/No — không ghi đè nhau.
- Reflection/CTA chỉ render khi status==='opened'; KHÔNG lộ content/image/opening_note/reflection_question/
  prediction ở Locked/Pre-open/list. Nội dung gốc vẫn read-only.
- KHÔNG đụng notification (deleteBox giữ nguyên; reflection CASCADE theo box). KHÔNG đụng teaser/prediction/
  ritual. KHÔNG làm F-36/F-37. KHÔNG V2.

Sau khi code: chạy app, làm theo Test case thủ công §10 (đặc biệt A1-A5 note+rating, B6/B7 hộp không câu hỏi,
C8-C10 không hồi quy Yes/No, D11-D13 CTA, E14/E15 guard, F17-F19 migration an toàn, G20 xóa hộp), báo lại
kết quả từng case.
```

---

*Hết Implementation Brief Sprint 6 — F-34 Post-open Reflection Note & F-35 Create Next Box CTA.*
