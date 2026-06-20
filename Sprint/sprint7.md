# Sprint 7 — Personal Stats (F-36)

> **Implementation Brief cho Agent-Dev**
> Tác giả: Agent-BA · Ngày: 2026-06-20 · Nhánh: `feature/sprint-07-personal-stats`
> Nguồn: PRD v1.2 (§3.5 F-36, §4 F-36 AC-36.1→AC-36.3, §8.9, §10 Sprint 7)

---

## 0. Tiền kiểm — Sprint trước & ảnh hưởng

### 0.1. Sprint 6 (Post-open Reflection & Next Box CTA — F-34, F-35) đã hoàn tất ✅ (merged vào `main`)

Nhánh `feature/sprint-07-personal-stats` được tạo từ `main` sau commit merge `869b4c9` (gồm `ee8819f` F-34/F-35). Đã có đầy đủ thành quả Sprint 1→6. Cây làm việc sạch. Không có việc dở dang chặn Sprint 7.

Codebase hiện có (liên quan tới F-36):

- **DB version 5**, 5 bảng: `box`, `reflection_question`, `notification_schedule`, `box_teaser`, `box_prediction`.
- **`Box` (`src/types/box.ts`) đã có đủ field F-36 cần để tính số liệu — KHÔNG cần thêm field, KHÔNG cần migration:**
  - `boxType` (`message | goal | memory | decision`), `unlockDate`, `createdAt`, `openedAt`, `title`.
  - `reflectionAnswer?: 'yes' | 'no' | null` (F-07) → dùng cho "tỷ lệ Goal hoàn thành".
  - `reflectionNote?`, `reflectionRating?` (F-34) → dùng cho "số reflection note đã viết".
- **`getAllBoxes()` (`src/db/boxRepository.ts`) đã map đủ các field trên** vào `state.boxes`. Stats lấy 100% từ store, **không cần query DB mới**.
- `getBoxStatus(box)` (`src/store/boxStore.tsx:75`): derived `locked | ready_to_open | opened` theo đồng hồ thiết bị. Stats dùng lại hàm này (single source of truth).
- `useBoxStore()` cung cấp `state.boxes` + `getBoxesByStatus(status)`.
- **Navigation:** route mới đăng ký bằng `Stack.Screen` trong `app/_layout.tsx` (pattern giống `settings`). Home (`app/(tabs)/index.tsx`) đã có cụm nút header (search + settings, dòng ~657–672) → thêm 1 nút "Thống kê" tại đây.
- `BOX_TYPE_CONFIG` (`src/constants/boxTypes.ts`) cung cấp icon/màu/label theo loại hộp — tái dùng để vẽ breakdown.
- Pattern AppState force re-render đã có ở Home (dòng ~559–575) để recompute status khi app trở lại foreground.

### 0.2. Khoảng trống mà F-36 cần lấp

| Hiện trạng | Còn thiếu cho Sprint 7 |
|-----------|------------------------|
| Chưa có màn thống kê nào. | **F-36**: 1 màn Stats hiển thị tổng số hộp, số khóa / sẵn sàng mở / đã mở, tỷ lệ mục tiêu hoàn thành, hộp sắp mở gần nhất, số reflection note. |
| Chưa có điểm vào màn Stats. | Thêm 1 nút ở header Home → điều hướng sang màn Stats. |
| Chưa có empty state cho màn Stats. | **AC-36.3**: khi chưa có hộp → empty state + CTA tạo hộp đầu tiên (`/create-box`). |

### 0.3. Phụ thuộc & rủi ro kế thừa

- F-36 phụ thuộc **F-05** (danh sách/trạng thái — đã có), **F-07** (câu trả lời Yes/No — đã có), **F-34** (reflection note — đã có). Tất cả đã hoàn tất.
- **KHÔNG cần DB migration** (đây là màn read-only tính từ dữ liệu đã có). → Ràng buộc "migration an toàn" **không áp dụng** cho sprint này; nếu Agent-Dev thấy cần đổi schema thì DỪNG và báo lại BA (dấu hiệu vượt scope).
- **KHÔNG** đụng F-30 teaser, F-31 notification, F-32 prediction, F-33 ritual, F-34/F-35 logic.
- **KHÔNG** làm F-37 (New Box Types) — xem §11 R1.

---

## 1. Mục tiêu Sprint

Cho người dùng một **màn thống kê cá nhân** đơn giản, phản ánh hành trình dùng app và tăng động lực quay lại (đóng vòng lặp engagement V1). Màn Stats là **read-only**, tính toán **hoàn toàn từ dữ liệu local** đã có trong store, **không** thêm bảng/cột, **không** notification, **không** lộ nội dung hộp.

```
Tạo hộp → Khóa → Countdown → Mở hộp → Reflection → [Personal Stats: nhìn lại hành trình] → Tạo hộp mới
```

**Ngoài phạm vi sprint này (KHÔNG làm):**

- **KHÔNG** làm **F-37 New Box Types** (Secret/Challenge/Letter). PRD §10 gộp F-36+F-37 vào "Sprint 7", nhưng yêu cầu lần này **chỉ F-36**. Không thêm loại hộp, không sửa `BoxType`, không sửa màn chọn loại hộp.
- **KHÔNG** biểu đồ phức tạp / chart library (PRD §8.9: "Không hiển thị biểu đồ phức tạp ở bản đầu của V1"). Chỉ số dạng số + thanh tiến độ đơn giản nếu muốn.
- **KHÔNG** thêm bảng/cột/migration DB; **KHÔNG** thêm analytics server (PRD §8.9: stats tính từ local, không cần analytics server).
- **KHÔNG** đụng notification (không tạo/sửa/hủy).
- **KHÔNG** hiển thị bất kỳ nội dung hộp khóa nào (content/image/opening_note/reflection/prediction text). Chỉ số đếm + metadata công khai (tiêu đề, loại, ngày mở, countdown).
- **KHÔNG** cho sửa dữ liệu từ màn Stats (read-only thuần).
- Mọi tính năng V2: account, cloud sync, gửi hộp cho người khác, hộp nhóm, public box.

---

## 2. Feature ID liên quan

- **F-36 — Personal Stats** (Could, V1). Phụ thuộc: **F-05, F-07, F-34**. AC: **AC-36.1 → AC-36.3** (PRD §4). Mô tả: PRD §8.9. Roadmap: PRD §10 Sprint 7.
- NFR liên quan: **NFR-P1/P2** (cold start, cuộn mượt), **NFR-U2/U4** (cảm xúc, touch ≥ 44pt, font scaling, contrast AA), **NFR-S1/AC-03.1** (không lộ nội dung hộp khóa), **NFR-R3** (tính trạng thái theo thời gian thiết bị nhất quán).

---

## 3. User Stories

| ID | Story |
|----|-------|
| US-1 | Là người dùng, tôi muốn thấy tổng số hộp tôi đã tạo để cảm nhận hành trình của mình. |
| US-2 | Là người dùng, tôi muốn thấy nhanh có bao nhiêu hộp đang khóa, sẵn sàng mở và đã mở. |
| US-3 | Là người dùng, tôi muốn biết tỷ lệ mục tiêu tôi đã hoàn thành (đáp "Có") để có động lực. |
| US-4 | Là người dùng, tôi muốn biết hộp nào sắp mở gần nhất để mong chờ. |
| US-5 | Là người dùng, tôi muốn thấy mình đã viết bao nhiêu cảm nhận (reflection) để thấy sự gắn bó. |
| US-6 | Là người dùng mới chưa có hộp nào, tôi muốn màn thống kê khuyến khích tôi tạo hộp đầu tiên thay vì hiển thị toàn số 0 vô hồn. |

---

## 4. Business Rules

### 4.1. Nguồn dữ liệu & cách tính (AC-36.1, AC-36.2)

- **Mọi chỉ số tính từ `state.boxes` trong store** (đã load qua `getAllBoxes`). **Không** query DB mới, **không** analytics server.
- Trạng thái mỗi hộp tính bằng **`getBoxStatus(box)`** (đã có) — KHÔNG tự định nghĩa lại logic trạng thái, để nhất quán với Home (NFR-R3).
- Các chỉ số bắt buộc (AC-36.1):
  - **Tổng số hộp** = `state.boxes.length`.
  - **Đang khóa** = số hộp `getBoxStatus === 'locked'`.
  - **Sẵn sàng mở** = số hộp `getBoxStatus === 'ready_to_open'`.
  - **Đã mở** = số hộp `getBoxStatus === 'opened'`.
- Chỉ số mục tiêu hoàn thành (AC-36.2):
  - **Mục tiêu hoàn thành** = số hộp `boxType === 'goal'` **đã mở** có `reflectionAnswer === 'yes'`.
  - **Tổng mục tiêu** = số hộp `boxType === 'goal'` **đã mở** có câu trả lời (`reflectionAnswer === 'yes' || 'no'`). (Mẫu số chỉ tính hộp goal đã mở & đã trả lời, để tỷ lệ có ý nghĩa.)
  - Hiển thị dạng "Đã đạt X/Y mục tiêu" (PRD §8.9 ví dụ "Bạn đã đạt 7/10 mục tiêu"). Nếu `Y === 0` → ẩn dòng này hoặc hiển thị "Chưa có mục tiêu nào để đối chiếu".
  - ⚠️ **Challenge chưa tồn tại** (F-37 ngoài scope) → hiện chỉ tính `goal`. Xem §11 R1.
- Chỉ số gợi ý thêm (PRD §8.9, **nên có** nếu không phát sinh phức tạp):
  - **Hộp sắp mở gần nhất**: trong các hộp `locked`, chọn hộp có `unlockDate` nhỏ nhất (gần hiện tại nhất); hiển thị tiêu đề + loại + countdown "còn X ngày" + ngày mở. Nếu không có hộp locked → ẩn.
  - **Số reflection note đã viết** = số hộp có `reflectionNote` không rỗng (sau `trim()`).

### 4.2. Không lộ nội dung hộp khóa (F-03 / AC-03.1 / NFR-S1)

- Màn Stats **CHỈ** hiển thị: số đếm, tỷ lệ, và **metadata công khai** của "hộp sắp mở gần nhất" (tiêu đề, loại hộp, ngày mở, countdown) — đúng tập metadata mà màn Locked/Home đã được phép hiển thị (AC-03.1).
- **TUYỆT ĐỐI KHÔNG** render ở màn Stats: `content`, `imagePath`/ảnh, `openingNote`, `reflectionQuestion`/`reflectionAnswer` dạng chi tiết của hộp khóa, `reflectionNote` text, `prediction` text, hay teaser text.
- "Số reflection note đã viết" chỉ là **con số đếm**, không in nội dung note.
- Tỷ lệ mục tiêu chỉ tính trên hộp **đã mở** → không suy ra nội dung hộp còn khóa.

### 4.3. Empty state (AC-36.3)

- Khi `state.boxes.length === 0` → màn Stats **không** hiển thị lưới toàn số 0; thay vào đó hiển thị **empty state truyền cảm hứng** + CTA "Tạo hộp đầu tiên" → `router.push('/create-box')`.
- (Khuyến nghị) Khi có hộp nhưng chưa hộp nào đã mở → vẫn hiển thị các số đếm; các dòng phụ thuộc dữ liệu mở (tỷ lệ mục tiêu, reflection note) hiển thị trạng thái "chưa có" gọn gàng, không gây hiểu nhầm.

### 4.4. Cập nhật theo thời gian thiết bị (NFR-R3, AC-05.4)

- Khi app trở lại foreground hoặc khi vào lại màn Stats, **recompute** trạng thái (vì hộp có thể vừa đến hạn → chuyển locked→ready). Dùng lại pattern AppState force re-render như Home (`app/(tabs)/index.tsx` ~559–575), hoặc tính lại mỗi lần render (getBoxStatus là pure).

### 4.5. Notification — không thay đổi

- F-36 **không** tạo/sửa/hủy notification, **không** đụng `deleteBox`. Màn Stats là read-only.

---

## 5. Data Model / Migration

**KHÔNG có thay đổi schema, KHÔNG migration.** F-36 đọc 100% từ dữ liệu đã có (`Box` trong store). `DATABASE_VERSION` giữ nguyên **5**.

> Nếu trong quá trình code phát sinh nhu cầu đổi schema/migration → đó là dấu hiệu **vượt scope**: DỪNG và báo lại Agent-BA, không tự ý migrate.

---

## 6. Danh sách Task cần code

### Tầng tính toán (logic thuần, dễ test)
1. Tạo helper tính stats (đề xuất `src/utils/stats.ts` hoặc inline trong màn Stats nếu nhỏ): hàm `computeStats(boxes: Box[]): PersonalStats` trả về:
   - `total`, `lockedCount`, `readyCount`, `openedCount`.
   - `goalCompleted`, `goalTotal` (goal đã mở & đã trả lời).
   - `nextBox?: Box` (hộp locked có `unlockDate` nhỏ nhất).
   - `reflectionNoteCount`.
   - Dùng `getBoxStatus` từ store cho trạng thái (import lại, không nhân bản logic).

### Tầng UI — màn Stats (mới)
2. Tạo màn `app/stats.tsx` (Stack screen, ngoài `(tabs)`), theme tối / glassmorphism đồng bộ Home (`ThemeColors`, `Colors`, `Spacing`, `FontSize`, `BlurView` nếu muốn):
   - Header có nút back (← về Home), tiêu đề "Thống kê" / "Hành trình của bạn".
   - Thẻ tổng quan: 4 ô số (Tổng / Đang khóa / Sẵn sàng mở / Đã mở) — touch không bắt buộc, chỉ đọc.
   - Khối "Mục tiêu hoàn thành": "X/Y" + (tùy chọn) thanh tiến độ đơn giản (View, không cần chart lib).
   - Khối "Hộp sắp mở gần nhất" (nếu có): tiêu đề + icon loại + countdown + ngày mở (metadata, không content). Có thể bấm để điều hướng `/box/:id/locked` (tùy chọn, không bắt buộc).
   - Khối "Reflection đã viết": con số.
   - **Empty state** khi `boxes.length === 0` (AC-36.3): minh hoạ + CTA "Tạo hộp đầu tiên" → `/create-box`.
3. Đăng ký route trong `app/_layout.tsx`: thêm `<Stack.Screen name="stats" options={{ headerShown: false, animation: 'slide_from_right' }} />` (giống `settings`).
4. Thêm **điểm vào** ở Home (`app/(tabs)/index.tsx`): thêm 1 nút trong cụm `headerActions` (cạnh nút search/settings, ~657–672), icon ví dụ `stats-chart-outline` / `bar-chart-outline`, `onPress={() => router.push('/stats')}`. Touch target ≥ 44pt (NFR-U4).
5. Recompute trạng thái khi foreground/vào lại màn (xem §4.4).

### Tài liệu (bắt buộc theo CLAUDE.md)
6. `CLAUDE.md`:
   - Mục **Cấu trúc thư mục**: thêm `app/stats.tsx` (Personal Stats Screen F-36).
   - **Navigation Flow**: thêm `stats → Personal Stats` và điểm vào từ header Home.
   - **Quy ước quan trọng**: thêm mục **Personal Stats (F-36)**: màn read-only, tính từ `state.boxes` qua `getBoxStatus`, không migration/notification, không lộ nội dung hộp khóa (chỉ số đếm + metadata công khai của hộp sắp mở), empty state → `/create-box`.
   - Nếu tạo `src/utils/stats.ts`: ghi vào cấu trúc thư mục.
7. (Tùy chọn) `design/flows/F36-personal-stats.md`: mô tả luồng PRD §8.9. Không bắt buộc nếu CLAUDE.md đã đủ.

---

## 7. File/Module cần SỬA

| File | Thay đổi |
|------|----------|
| `app/_layout.tsx` | Đăng ký `Stack.Screen name="stats"` (animation `slide_from_right`). |
| `app/(tabs)/index.tsx` | Thêm nút "Thống kê" trong `headerActions` → `router.push('/stats')`. Không đổi logic danh sách. |
| `CLAUDE.md` | Cập nhật cấu trúc thư mục + navigation flow + quy ước F-36. |

> **KHÔNG** sửa `src/db/*` (không migration), `src/services/notificationService.ts`, `src/types/box.ts` (đủ field rồi), `BOX_TYPE_CONFIG` (không thêm loại hộp).

## 8. File/Module cần TẠO MỚI

| File | Mục đích | Ghi chú |
|------|----------|---------|
| `app/stats.tsx` | Màn Personal Stats (F-36), read-only. | Route mới, đăng ký ở `_layout.tsx`. |
| `src/utils/stats.ts` *(khuyến nghị)* | `computeStats(boxes)` thuần — tách logic để test/đọc dễ. | Có thể inline trong `stats.tsx` nếu nhỏ; tách ra sẽ gọn hơn. |
| `design/flows/F36-personal-stats.md` *(tùy chọn)* | Mô tả luồng F-36. | Không bắt buộc nếu CLAUDE.md đủ. |

---

## 9. Acceptance Criteria (PRD §4)

| AC | Tiêu chí | Cách đạt |
|----|----------|----------|
| **AC-36.1** | Màn thống kê hiển thị tổng số hộp, số đang khóa, số sẵn sàng mở và số đã mở. | `computeStats` đếm theo `getBoxStatus`; render 4 ô số ở màn `stats.tsx`. |
| **AC-36.2** | Nếu có hộp Goal (/Challenge), hiển thị số mục tiêu/thử thách hoàn thành dựa trên câu trả lời tích cực. | Đếm `goal` đã mở có `reflectionAnswer==='yes'` / tổng `goal` đã mở có trả lời → "X/Y". Challenge thêm sau khi F-37 hoàn tất. |
| **AC-36.3** | Khi chưa có dữ liệu, hiển thị empty state và gợi ý tạo hộp đầu tiên. | `boxes.length===0` → empty state + CTA `/create-box`. |
| (Ngầm, AC-03.1/NFR-S1) | Không lộ nội dung hộp khóa. | Chỉ render số đếm + metadata công khai; không render content/ảnh/opening note/reflection/prediction/teaser text. |
| (Ngầm, NFR-R3/AC-05.4) | Trạng thái tính nhất quán theo thời gian thiết bị. | Dùng `getBoxStatus`; recompute khi foreground/vào lại màn. |
| (Ngầm, NFR-U4) | Chạm ≥ 44pt, đọc được, tương phản AA. | Nút header & CTA đủ lớn; dùng token màu/typography sẵn có. |

---

## 10. Test case thủ công

**A. Số đếm trạng thái (AC-36.1)**
1. Có sẵn vài hộp đủ 3 trạng thái → mở màn Stats → ✔ Tổng = đúng tổng số hộp; Đang khóa / Sẵn sàng mở / Đã mở khớp với Home.
2. So sánh từng nhóm với màn Home (cùng filter) → ✔ số liệu trùng khớp.
3. Để một hộp locked đến đúng/qua hạn (hoặc chỉnh ngày), rời app rồi quay lại Stats → ✔ hộp chuyển từ "Đang khóa" sang "Sẵn sàng mở", số đếm cập nhật.

**B. Tỷ lệ mục tiêu (AC-36.2)**
4. Tạo & mở vài hộp loại **Mục tiêu (goal)**, đáp "Có" ở một số, "Không" ở số khác → ✔ hiển thị "X/Y" đúng (X = số đáp Có, Y = số goal đã mở có trả lời).
5. Hộp goal đã mở nhưng **chưa trả lời** (skip) → ✔ không tính vào mẫu số Y (hoặc theo quy ước đã chốt §4.1) — kiểm tra nhất quán.
6. Không có hộp goal nào đã mở → ✔ dòng tỷ lệ ẩn hoặc hiển thị "Chưa có mục tiêu nào để đối chiếu", không chia cho 0 / không NaN.

**C. Hộp sắp mở gần nhất & reflection (PRD §8.9)**
7. Có ≥ 2 hộp locked với ngày mở khác nhau → ✔ "Hộp sắp mở gần nhất" đúng là hộp có ngày mở gần hiện tại nhất; hiển thị countdown + ngày mở + tiêu đề/loại.
8. Không có hộp locked nào → ✔ khối "Hộp sắp mở gần nhất" ẩn, không lỗi.
9. Viết reflection note cho vài hộp đã mở → ✔ "Số reflection note đã viết" tăng đúng; ✔ **không** in nội dung note ra màn Stats.

**D. Empty state (AC-36.3)**
10. App chưa có hộp nào (hoặc xóa hết) → mở Stats → ✔ hiển thị empty state truyền cảm hứng + CTA "Tạo hộp đầu tiên".
11. Nhấn CTA → ✔ điều hướng sang `/create-box`.

**E. Không lộ nội dung hộp khóa (AC-03.1 / NFR-S1)**
12. Có hộp locked có content/ảnh/opening note/prediction/teaser → mở Stats → ✔ **không** thấy bất kỳ nội dung/ảnh nào của hộp khóa; chỉ thấy số đếm + metadata công khai của hộp sắp mở.
13. Rà UI: không có chỗ nào in `reflectionNote` text / `prediction` text / `content`.

**F. Điều hướng & UX**
14. Từ Home nhấn nút "Thống kê" ở header → ✔ vào màn Stats; nút back → ✔ về Home.
15. (Nếu làm) Bấm "Hộp sắp mở gần nhất" → ✔ vào `/box/:id/locked` đúng hộp.
16. ✔ Touch target nút header/CTA ≥ 44pt; chữ đọc rõ, tương phản ổn; cuộn mượt (NFR-U4/P2).

**G. Không hồi quy**
17. ✔ Home, tạo hộp, mở hộp, reflection (F-34), CTA (F-35), notification, App Lock vẫn hoạt động như cũ.
18. ✔ `DATABASE_VERSION` vẫn = 5, không phát sinh migration; app khởi động bình thường trên DB cũ.

---

## 11. Rủi ro cần lưu ý

| # | Rủi ro | Hướng xử lý |
|---|--------|-------------|
| R1 | **Lẫn F-37 vào sprint** (PRD §10 gộp Sprint 7 = F-36 + F-37). | Sprint này **chỉ F-36**. KHÔNG thêm Secret/Challenge/Letter, KHÔNG sửa `BoxType`/`BOX_TYPE_CONFIG`/màn chọn loại. AC-36.2 hiện chỉ tính `goal`; Challenge sẽ cộng vào khi F-37 hoàn tất (giữ code dễ mở rộng nhưng không thêm type). |
| R2 | **Lệch số liệu so với Home** do tự định nghĩa lại logic trạng thái. | Dùng lại `getBoxStatus` từ store, không nhân bản. Test A2. |
| R3 | **Lộ nội dung hộp khóa** nếu vô tình render content/note/prediction. | Chỉ render số đếm + metadata công khai; rà UI (Test E12/E13). |
| R4 | **Chia cho 0 / NaN** ở tỷ lệ mục tiêu khi chưa có goal đã mở. | Guard `goalTotal===0` → ẩn hoặc text thay thế. Test B6. |
| R5 | **Số liệu không cập nhật** khi hộp vừa đến hạn. | Recompute khi foreground/vào lại màn (pattern AppState như Home). Test A3. |
| R6 | **Tự ý thêm migration / chart library** (vượt scope). | KHÔNG đổi schema (giữ version 5), KHÔNG thêm thư viện chart. Nếu thấy cần → DỪNG, báo BA. |
| R7 | **Đụng nhầm notification / deleteBox / reflection logic.** | F-36 read-only; không sửa service notification, không sửa `deleteBox`, không sửa `upsertReflectionNote`/`answerReflectionQuestion`. |
| R8 | **Định nghĩa "mục tiêu hoàn thành" mơ hồ.** | Chốt theo §4.1: tử số = goal đã mở `reflectionAnswer==='yes'`; mẫu số = goal đã mở có trả lời. Ghi rõ trong UI ("X/Y mục tiêu"). |

---

## 12. Prompt giao Agent-Dev

```
Bạn là Agent-Dev (React Native / Expo SDK 54, chạy Expo Go). Triển khai Sprint 7 — Personal Stats (F-36)
theo file Sprint/sprint7.md. Đọc kỹ sprint7.md trước khi code, bám đúng scope, KHÔNG thêm tính năng ngoài PRD.

Bối cảnh: DB version 5 (GIỮ NGUYÊN — F-36 KHÔNG migration). Box trong store đã có đủ field: boxType, unlockDate,
createdAt, openedAt, title, reflectionAnswer, reflectionNote, reflectionRating. getAllBoxes đã map sẵn. Trạng
thái hộp tính bằng getBoxStatus(box) trong src/store/boxStore.tsx (locked|ready_to_open|opened). Home
app/(tabs)/index.tsx có cụm header (search+settings) và pattern AppState force re-render. Route mới đăng ký
bằng Stack.Screen trong app/_layout.tsx (giống "settings"). Theme: ThemeColors/Colors/Spacing/FontSize, glass.

Phạm vi (CHỈ F-36, KHÔNG làm F-37 New Box Types):
1. Logic: computeStats(boxes) -> { total, lockedCount, readyCount, openedCount, goalCompleted, goalTotal,
   nextBox?, reflectionNoteCount }. Dùng getBoxStatus cho trạng thái (không nhân bản logic). goalCompleted =
   số hộp boxType==='goal' đã mở có reflectionAnswer==='yes'; goalTotal = số goal đã mở có trả lời
   (yes||no); nextBox = hộp locked có unlockDate nhỏ nhất; reflectionNoteCount = số hộp có reflectionNote
   không rỗng. (Đề xuất tách src/utils/stats.ts.)
2. Màn mới app/stats.tsx (read-only, theme tối đồng bộ Home): header + back; 4 ô số (Tổng/Đang khóa/Sẵn
   sàng mở/Đã mở); khối "Mục tiêu hoàn thành" X/Y (guard Y===0); khối "Hộp sắp mở gần nhất" chỉ metadata
   (tiêu đề/loại/countdown/ngày mở, KHÔNG content); "Reflection đã viết" = số đếm; empty state khi
   boxes.length===0 -> CTA "Tạo hộp đầu tiên" -> router.push('/create-box'). Recompute khi foreground.
3. Đăng ký route: app/_layout.tsx thêm <Stack.Screen name="stats" options={{headerShown:false,
   animation:'slide_from_right'}} />.
4. Điểm vào: app/(tabs)/index.tsx thêm nút "Thống kê" (icon bar-chart) trong headerActions ->
   router.push('/stats'); touch >=44pt.
5. Cập nhật CLAUDE.md: thêm app/stats.tsx vào cấu trúc + navigation flow + quy ước F-36 (read-only, tính từ
   state.boxes qua getBoxStatus, không migration/notification, không lộ nội dung hộp khóa, empty state ->
   /create-box). Nếu tạo src/utils/stats.ts thì ghi vào cấu trúc.

Ràng buộc bắt buộc:
- KHÔNG migration/đổi schema (giữ DATABASE_VERSION=5). Nếu thấy cần đổi DB -> DỪNG, báo lại (vượt scope).
- KHÔNG đụng notification, deleteBox, reflection/prediction/teaser/ritual logic. Read-only thuần.
- KHÔNG lộ content/image/opening_note/reflection note text/prediction text/teaser text ở màn Stats; chỉ số
  đếm + metadata công khai (tiêu đề/loại/ngày mở/countdown) của hộp sắp mở.
- KHÔNG làm F-37 (không thêm loại hộp/đổi BoxType/BOX_TYPE_CONFIG). KHÔNG chart library. KHÔNG V2.
- Số liệu phải khớp Home (dùng chung getBoxStatus). Guard chia 0 ở tỷ lệ mục tiêu.

Sau khi code: chạy app, làm theo Test case thủ công §10 (A số đếm, B tỷ lệ mục tiêu, C hộp sắp mở+reflection
count, D empty state, E không lộ nội dung, F điều hướng, G không hồi quy + version=5 không migration), báo lại
kết quả từng case.
```

---

*Hết Implementation Brief Sprint 7 — F-36 Personal Stats.*
