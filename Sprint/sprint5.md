# Sprint 5 — Opening Ritual (F-33)

> **Implementation Brief cho Agent-Dev**
> Tác giả: Agent-BA · Ngày: 2026-06-20 · Nhánh: `feature/sprint-05-opening-ritual`
> Nguồn: PRD v1.2 (§3.5, §4 F-33, §8.6, §10 Sprint 5)

---

## 0. Tiền kiểm — Sprint trước & ảnh hưởng

### 0.1. Sprint 4 (Prediction Before Opening — F-32) đã hoàn tất ✅ (merged vào `main`)

Nhánh `feature/sprint-05-opening-ritual` được tạo từ `main` (sau commit merge `89fcf34`), nên đã có đầy đủ thành quả Sprint 1→4. Không có việc dở dang chặn Sprint 5.

Codebase hiện có (liên quan tới luồng mở hộp):

- **DB version 4**, 5 bảng: `box`, `reflection_question`, `notification_schedule`, `box_teaser`, `box_prediction`.
- `openBox(id)` (`src/db/boxRepository.ts:560`) — **guard tầng data đã vững**:
  `UPDATE box SET is_opened=1, opened_at=? WHERE id=? AND is_deleted=0 AND is_opened=0 AND unlock_date<=now`.
  Nếu `result.changes === 0`: hộp không tồn tại → throw `BOX_NOT_FOUND`; đã mở rồi → **return im lặng (idempotent)**; chưa tới hạn → throw `BOX_NOT_READY`. ⇒ **Chống mở 2 lần đã có sẵn ở tầng data.**
- `getBoxStatus(box)` (`src/store/boxStore.tsx`): derived `locked | ready_to_open | opened`.
- Màn `box/[id]/pre-open.tsx` — màn nghi thức trước khi mở (F-06):
  - Đã có cờ `isOpening` (chống double-tap ở UI), guard `getBoxStatus(box) !== 'ready_to_open'` trước khi gọi `openBox`.
  - Đã có animation **float + glow pulse** cho icon hộp, nút "Mở hộp" gradient, button press spring.
  - `handleOpen()`: `setIsOpening(true)` → `await openBox` → `dispatch(UPDATE_BOX)` → `router.replace('/box/[id]/detail', { isFirstOpen: '1' })`. Lỗi → reset `isOpening`.
- Màn `box/[id]/detail.tsx` — đã có **stagger fade-in + slide-up** 4 section khi `isFirstOpen === '1'` (đây là phần "chuyển cảnh sang nội dung thật" của ritual, đã tồn tại). **Early-return `null` khi `status !== 'opened'`** → không lộ nội dung hộp khóa.

### 0.2. Khoảng trống mà F-33 cần lấp

| Hiện trạng | Còn thiếu cho F-33 |
|-----------|---------------------|
| Bấm "Mở hộp" → `openBox` → chuyển thẳng sang detail (chỉ có press spring). | **Animation "mở hộp" thật sự** (nắp bật / ánh sáng tỏa) chèn giữa lúc bấm và lúc vào detail (AC-33.1). |
| Không có phản hồi xúc giác. | **Haptic nhẹ** khi bấm + khi mở thành công, **optional + fallback im lặng** (AC-33.4). |
| `isOpening` + guard data đã chống double-tap. | Đảm bảo **animation không gây cập nhật trạng thái nhiều lần** & **không hang** nếu callback animation không bắn (AC-33.2, AC-33.3). |

### 0.3. Không có blocker — KHÔNG cần DB/migration

F-33 là sprint **thuần UI/UX + xúc giác**. **Không** thêm/sửa bảng, **không** migration, DB giữ **version 4**. Không đụng repository data (ngoài việc tái sử dụng `openBox` đã có). Rủi ro dữ liệu = 0.

---

## 1. Mục tiêu Sprint

Biến hành động "mở hộp" từ một cú chuyển màn khô khan thành một **khoảnh khắc nghi thức đáng nhớ**: sau khi người dùng chủ động bấm "Mở hộp" ở màn Pre-open, app chạy **animation mở hộp** (nắp bật + ánh sáng tỏa), kèm **haptic nhẹ** (nếu thiết bị hỗ trợ), rồi mới **chuyển cảnh** sang màn chi tiết nội dung thật.

Trọng tâm kỹ thuật: animation chỉ là **lớp trình diễn**, **không** được làm sai lệch hay trùng lặp việc ghi trạng thái mở hộp, và **luôn** chuyển sang detail an toàn kể cả khi animation lỗi/bị gián đoạn.

**Ngoài phạm vi sprint này (KHÔNG làm):**

- **KHÔNG** thêm bảng / cột / migration. DB giữ version 4.
- **KHÔNG** đổi logic `openBox()` ở tầng data (guard đã đúng) — chỉ tái sử dụng.
- **KHÔNG** đụng F-30 teaser / F-31 notification / F-32 prediction / reflection logic.
- **KHÔNG** thêm âm thanh (sound) trong sprint này — xem §11 R5: sound đẩy sang sau để tránh quản lý asset âm thanh + thư viện audio; haptic đã đủ thỏa AC-33.4 ("haptic/sound là optional"). Nếu Agent-Dev muốn thêm sound vẫn phải đảm bảo optional + fallback im lặng, nhưng **không bắt buộc** và **không** nằm trong Acceptance của sprint.
- **KHÔNG** thêm màn Post-open Reflection (F-34) / Create Next Box CTA (F-35) — đó là Sprint 6.
- **KHÔNG** tự động mở hộp (vẫn phải người dùng chủ động bấm — AC-06.1).
- Mọi tính năng V2: account, cloud sync, gửi hộp cho người khác, hộp nhóm, public box.

---

## 2. Feature ID liên quan

- **F-33 — Opening Ritual** (Should, V1). Phụ thuộc: **F-06** (mở hộp khi đến hạn), **F-14** (hiệu ứng mở hộp/animation) — đều đã có nền.
- Tham chiếu AC: **AC-33.1 → AC-33.4** (PRD §4). Liên quan AC-06.1, AC-06.2, AC-06.3.
- Mô tả & flow: PRD §8.6.
- Roadmap: PRD §10 Sprint 5.
- NFR liên quan: **NFR-P3** (animation chạy native driver, không giật), **NFR-U2** (cảm giác "đáng nhớ"), **NFR-R1** (không mất dữ liệu khi kill app).

---

## 3. User Stories

| ID | Story |
|----|-------|
| US-1 | Là người dùng, khi mở hộp đã đến hạn, tôi muốn thấy một animation mở hộp đẹp trước khi xem nội dung để khoảnh khắc đó trang trọng và bất ngờ hơn. |
| US-2 | Là người dùng, tôi muốn cảm nhận một rung nhẹ (haptic) khi mở hộp để trải nghiệm "chạm" hơn. |
| US-3 | Là người dùng dùng máy không hỗ trợ haptic, tôi vẫn mở hộp bình thường, không lỗi, không rung "giả". |
| US-4 | Là người dùng lỡ bấm nút "Mở hộp" nhiều lần, tôi muốn hộp chỉ mở đúng một lần, trạng thái không bị ghi đè/sai. |
| US-5 | Là người dùng, nếu animation lag/đứng giữa chừng, tôi vẫn được đưa vào màn nội dung và hộp đã mở đúng — không bị kẹt ở màn nghi thức. |

---

## 4. Business Rules

### 4.1. Điều kiện & vòng đời mở hộp (AC-06.1, AC-33.1, AC-33.2, PRD §8.6)

- **Chỉ hộp `ready_to_open` mới được mở.** Guard 2 tầng (đã có, giữ nguyên):
  - UI: `handleOpen` kiểm `getBoxStatus(box) === 'ready_to_open'` trước khi chạy.
  - Data: `openBox` chỉ `UPDATE` khi `is_opened = 0 AND unlock_date <= now`.
- Người dùng **phải chủ động** bấm "Mở hộp" — app **không** tự mở (AC-06.1). Ritual chỉ chạy **sau** cú bấm.
- Sau khi mở, hộp chuyển **vĩnh viễn** sang `opened` (AC-06.3) — không "đóng lại". (Đã đúng nhờ `openBox`.)

### 4.2. Thứ tự thực thi chuẩn (quan trọng — AC-33.2 & AC-33.3)

Quy định **persist trước, animate sau, navigate cuối** để trạng thái luôn đúng dù animation lỗi:

1. Bấm "Mở hộp" → nếu `isOpening === true` thì **bỏ qua** (đã đang xử lý). Ngược lại `setIsOpening(true)` ngay (khóa nút + chống double-tap UI).
2. (Optional) `triggerHaptic('impactLight')` — bọc try/catch, lỗi không chặn luồng.
3. `await openBox(box.id)` — **ghi DB là nguồn sự thật, làm trước animation.**
   - Thành công → `dispatch(UPDATE_BOX { ...box, openedAt, status: 'opened' })`.
   - Thất bại (throw) → `setIsOpening(false)`, reset, **không** chạy animation, **không** navigate (hiện trạng đã vậy).
4. Chạy **animation mở hộp** (lớp trình diễn thuần, ~700–1200ms).
5. Khi animation kết thúc → (optional) `triggerHaptic('notificationSuccess')` → `router.replace('/box/[id]/detail', { isFirstOpen: '1' })`.
6. **Bắt buộc có "safety timer"**: đặt `setTimeout(navigateToDetail, <thời lượng animation + buffer>)` (idempotent) để **đảm bảo navigate kể cả khi callback `onFinish`/`runOnJS` của reanimated không bắn** (animation bị gián đoạn, JS thread bận...). Navigate phải được bảo vệ bằng cờ `hasNavigatedRef` để **không** điều hướng 2 lần. (AC-33.3)

> **Lý do persist trước animate:** Nếu để animation chạy trước rồi mới `openBox`, khi app bị kill/animation crash giữa chừng, hộp có thể chưa được đánh dấu mở → người dùng phải làm lại. Persist trước đảm bảo NFR-R1 + AC-33.3.

### 4.3. Chống mở nhiều lần / cập nhật trạng thái trùng (AC-33.2)

- Tầng UI: cờ `isOpening` chặn lần bấm thứ 2+; nút `disabled={isOpening}`.
- Tầng data: `openBox` idempotent — nếu vì lý do gì gọi lại trên hộp đã mở, SQL `changes === 0` và hàm **return im lặng** (không throw, không ghi đè `opened_at`). ⇒ `opened_at` **không** bị cập nhật lần 2.
- Điều hướng: `hasNavigatedRef` đảm bảo `router.replace` chỉ chạy 1 lần dù cả `onFinish` lẫn safety timer cùng kích hoạt.

### 4.4. Haptic / Sound — optional + fallback im lặng (AC-33.4)

- Haptic dùng **`expo-haptics`** (có sẵn trong Expo Go SDK 54). Mọi lời gọi haptic **bọc try/catch** và **kiểm `Platform.OS !== 'web'`**; lỗi/không hỗ trợ → **bỏ qua im lặng**, tuyệt đối không crash, không hiện lỗi.
- **Không** phụ thuộc haptic để luồng mở hộp chạy: dù haptic fail hoàn toàn, animation + navigate vẫn diễn ra bình thường.
- Sound: **không làm trong sprint này** (xem §1 ngoài phạm vi). AC-33.4 chỉ yêu cầu "optional + fallback" — haptic đã thỏa.

### 4.5. Không lộ nội dung hộp khóa trong lúc ritual (F-03 / AC-03.1)

- Animation mở hộp **chỉ dùng hình ảnh chung chung** (icon hộp/`BoxIcon`, ánh sáng, hạt sáng) — **TUYỆT ĐỐI không** render `content`, `image_path`, `opening_note`, `reflection_question`, `prediction` của hộp trong pha animation.
- Nội dung thật chỉ xuất hiện ở màn `detail.tsx` (đã `status === 'opened'`). Trong khoảnh khắc ritual, hộp **đã** chuyển sang `opened` ở DB (đúng) nhưng **màn pre-open không hiển thị nội dung** — nó chỉ chiếu animation rồi `replace` sang detail.
- Giữ nguyên `detail.tsx` early-return `null` khi `status !== 'opened'`.

---

## 5. Data Model / Migration

**KHÔNG có thay đổi DB.** F-33 không thêm bảng/cột, không migration. `DATABASE_VERSION` giữ **= 4**.

> Agent-Dev: **không** sửa `src/db/database.ts`, **không** đụng `boxRepository.ts` (trừ việc đọc/tái dùng `openBox` đã có). Nếu thấy mình đang viết SQL trong sprint này → đã đi sai scope.

---

## 6. Danh sách Task cần code

### Tầng dependency (cài thư viện)
1. Cài **`expo-haptics`** đúng phiên bản SDK 54:
   ```
   npx expo install expo-haptics
   ```
   (Dùng `expo install` để Expo tự resolve version tương thích SDK 54; **không** hardcode version trong `package.json` bằng tay.)

### Tầng service (mới — wrapper an toàn)
2. Tạo `src/services/hapticsService.ts`: hàm mỏng bọc `expo-haptics`, mỗi hàm **try/catch + check Platform**, fallback im lặng. Ví dụ API: `hapticImpactLight()`, `hapticSuccess()`. Không export logic gì khác.

### Tầng component (mới — animation tái sử dụng, khuyến nghị)
3. Tạo `src/components/OpeningRitualOverlay.tsx` (hoặc đặt inline trong `pre-open.tsx` nếu Agent-Dev thấy gọn hơn):
   - Animated overlay phủ toàn màn, chạy chuỗi: hộp **nảy nhẹ → nắp bật/scale up → ánh sáng bùng (flash/glow) → hạt sáng tỏa**, dùng `react-native-reanimated` (đã có trong dự án), **chạy trên UI thread/native driver** (NFR-P3).
   - Prop: `boxType` (để render `BoxIcon` đúng màu), `onFinish: () => void` (gọi qua `runOnJS` khi chuỗi xong).
   - **Chỉ hình ảnh chung chung** — không nhận/không render bất kỳ nội dung hộp nào (§4.5).
   - Thời lượng tổng ~700–1200ms để không lê thê (NFR-U2).

### Tầng UI — Pre-open (`app/box/[id]/pre-open.tsx`) — TRỌNG TÂM
4. Thêm state pha ritual, ví dụ `const [phase, setPhase] = useState<'idle' | 'ritual'>('idle')` và `hasNavigatedRef = useRef(false)`.
5. Sửa `handleOpen()` theo **thứ tự §4.2**:
   - Chặn nếu `isOpening` (giữ nguyên), `setIsOpening(true)`.
   - `hapticImpactLight()` (try/catch trong service).
   - `await openBox(box.id)` → `dispatch(UPDATE_BOX ...)` (giữ logic hiện có).
   - `setPhase('ritual')` để render `OpeningRitualOverlay`.
   - Đặt **safety timer** `setTimeout(goDetail, ANIM_MS + 250)`.
   - Hàm `goDetail()` idempotent: nếu `hasNavigatedRef.current` thì return; set true; `hapticSuccess()`; `router.replace('/box/[id]/detail', { isFirstOpen: '1' })`.
   - `OpeningRitualOverlay.onFinish = goDetail`.
   - `catch`: `setIsOpening(false)`, `setPhase('idle')`, reset (như hiện tại). Không navigate.
6. Cleanup: `clearTimeout` trong `useEffect` cleanup / khi unmount để tránh navigate sau khi rời màn.
7. Giữ nguyên guard `getBoxStatus(box) !== 'ready_to_open'` và redirect `openedAt` đã có.
8. Đảm bảo trong pha `ritual` **không** render thêm bất kỳ nội dung hộp nào (chỉ overlay animation).

### Tầng UI — Detail (`app/box/[id]/detail.tsx`)
9. **Không bắt buộc sửa.** Stagger fade-in khi `isFirstOpen === '1'` đã đóng vai "chuyển cảnh sang nội dung thật" (F-14). Có thể tinh chỉnh nhẹ timing nếu thấy nối tiếp animation ritual chưa mượt, nhưng **không đổi cấu trúc**, **không** thêm nội dung mới.

### Tài liệu (bắt buộc theo CLAUDE.md)
10. `CLAUDE.md`:
    - Tech Stack: thêm dòng **`expo-haptics`** (Haptic feedback — optional, fallback im lặng).
    - Cấu trúc thư mục: thêm `src/services/hapticsService.ts` và (nếu tạo) `src/components/OpeningRitualOverlay.tsx`.
    - Quy ước: bổ sung mục **Opening Ritual (F-33)**: thứ tự *persist → animate → navigate*, safety timer chống hang, haptic optional fallback, animation không lộ nội dung hộp, không đổi DB.
11. (Tùy chọn) `design/flows/F33-opening-ritual.md`: mô tả flow PRD §8.6 + sơ đồ trạng thái pha `idle → ritual → detail`.

---

## 7. File/Module cần SỬA

| File | Thay đổi |
|------|----------|
| `package.json` / lockfile | Thêm `expo-haptics` qua `npx expo install` (không sửa tay version). |
| `app/box/[id]/pre-open.tsx` | Thêm pha `ritual`, safety timer + `hasNavigatedRef`, gọi haptic, render `OpeningRitualOverlay`, giữ thứ tự persist→animate→navigate. |
| `app/box/[id]/detail.tsx` | (Tùy chọn) tinh chỉnh nhẹ timing stagger để nối tiếp ritual — không bắt buộc. |
| `CLAUDE.md` | Tech stack + cấu trúc + quy ước Opening Ritual. |

## 8. File/Module cần TẠO MỚI

| File | Mục đích | Ghi chú |
|------|----------|---------|
| `src/services/hapticsService.ts` | Wrapper an toàn quanh `expo-haptics` (try/catch + Platform check, fallback im lặng). | Bắt buộc. |
| `src/components/OpeningRitualOverlay.tsx` | Animated overlay "mở hộp" tái sử dụng (chỉ hình ảnh chung chung). | Khuyến nghị; có thể inline trong pre-open nếu gọn hơn. |
| `design/flows/F33-opening-ritual.md` *(tùy chọn)* | Mô tả luồng F-33. | Không bắt buộc nếu đã ghi đủ ở CLAUDE.md. |

> F-33 **không** thêm route/màn mới. Ritual là một **pha animation overlay** ngay trong màn `pre-open` sẵn có.

---

## 9. Acceptance Criteria (PRD §4)

| AC | Tiêu chí | Cách đạt |
|----|----------|----------|
| **AC-33.1** | Hộp ReadyToOpen → bấm "Mở hộp" → app hiển thị animation mở hộp **trước khi** vào màn chi tiết. | Pha `ritual` chạy `OpeningRitualOverlay` rồi mới `router.replace(detail)`. |
| **AC-33.2** | Animation không làm mất dữ liệu / không khiến trạng thái mở bị cập nhật nhiều lần khi bấm liên tục. | `isOpening` (UI) + `openBox` idempotent (data, `changes===0`→return, không ghi đè `opened_at`) + `hasNavigatedRef` (navigate 1 lần). |
| **AC-33.3** | Nếu animation lỗi/bị gián đoạn, hộp vẫn mở đúng và chuyển sang detail an toàn. | Persist (`openBox`) **trước** animation; **safety timer** đảm bảo `goDetail` chạy dù `onFinish` không bắn; `goDetail` idempotent. |
| **AC-33.4** | Haptic/sound optional, fallback im lặng nếu thiết bị không hỗ trợ. | `hapticsService` bọc try/catch + Platform check; luồng mở không phụ thuộc haptic; sound không đưa vào sprint. |
| (Ngầm, AC-06.1) | Không tự động mở; người dùng phải bấm. | Ritual chỉ chạy sau cú bấm "Mở hộp". |
| (Ngầm, F-03/AC-03.1) | Không lộ nội dung hộp trong lúc ritual. | Overlay chỉ render hình ảnh chung; nội dung thật chỉ ở `detail` (status opened). |
| (Ngầm, NFR-P3) | Animation mượt, không giật. | Reanimated chạy UI thread/native driver; thời lượng ~700–1200ms. |

---

## 10. Test case thủ công

**A. Ritual hiển thị trước detail (AC-33.1)**
1. Tạo hộp `unlockDate = +1 ngày`, chỉnh giờ thiết bị tới hạn (hoặc dùng hộp đã ready) → vào màn Pre-open → bấm "Mở hộp" → ✔ thấy **animation mở hộp** (nắp bật + ánh sáng) **trước**, sau đó mới vào màn chi tiết.
2. ✔ Trong pha animation **không** thấy `content`/ảnh/lời nhắn/câu hỏi/prediction của hộp.

**B. Chống double-tap / không cập nhật trạng thái nhiều lần (AC-33.2)**
3. Bấm "Mở hộp" **liên tục thật nhanh nhiều lần** → ✔ hộp chỉ mở 1 lần; vào detail bình thường; không nhân đôi animation/navigation.
4. Kiểm DB: `SELECT opened_at FROM box WHERE id=?` → ✔ chỉ **1** giá trị `opened_at`, không bị đổi/ghi đè ở lần bấm sau (giá trị ổn định).
5. (Nếu mô phỏng được) gọi lại `openBox(openedId)` → ✔ return im lặng, `opened_at` **không** đổi.

**C. Fallback animation lỗi/gián đoạn (AC-33.3)**
6. Bấm "Mở hộp" rồi **lập tức khóa màn / chuyển app sang background** giữa lúc animation → mở lại app → ✔ hộp **đã ở trạng thái opened**, không kẹt ở pre-open; mở hộp lại từ Home → vào thẳng detail.
7. (Dev test) Tạm vô hiệu `onFinish` của overlay (giả lập callback không bắn) → bấm mở → ✔ **safety timer** vẫn đưa vào detail sau ~thời lượng animation; không hang.
8. (Dev test) Ép `openBox` throw (vd sửa tạm unlock_date tương lai) → bấm mở → ✔ **không** chạy animation, **không** navigate, nút reset về trạng thái bấm lại được; không crash.

**D. Haptic optional + fallback (AC-33.4)**
9. Trên thiết bị thật hỗ trợ haptic → bấm mở → ✔ cảm nhận rung nhẹ lúc bấm và/hoặc lúc mở xong.
10. Trên emulator/thiết bị **không** hỗ trợ haptic (hoặc web) → bấm mở → ✔ mở hộp + animation + navigate **bình thường**, **không** crash, không lỗi đỏ.

**E. Không tự mở + chỉ ready mới mở (AC-06.1)**
11. Vào Pre-open của hộp ready → ✔ hộp **không** tự mở; chỉ mở khi bấm nút.
12. (Guard) Hộp chưa tới hạn không vào được pha ritual (status guard) → ✔ không mở.

**F. Không hồi quy các sprint trước**
13. Mở 1 hộp có **prediction** (F-32) → sau ritual vào detail → ✔ vẫn thấy section "Bạn đã đoán" đúng chỗ.
14. Mở hộp có **reflection question** → trả lời "Có" → ✔ confetti vẫn chạy; trả lời "Không" → ✔ empathy card vẫn hiện.
15. Xóa 1 hộp khóa → ✔ notification của hộp vẫn bị hủy (không hồi quy F-31); ritual không ảnh hưởng luồng xóa.
16. ✔ DB vẫn version 4; không có bảng/cột mới; hộp/teaser/notification/prediction cũ nguyên vẹn.

**G. Cảm xúc / hiệu năng (NFR)**
17. ✔ Animation mở hộp mượt (~60fps), không giật rõ rệt; thời lượng vừa phải, không lê thê.

---

## 11. Rủi ro cần lưu ý

| # | Rủi ro | Hướng xử lý |
|---|--------|-------------|
| R1 | **App "kẹt" ở màn pre-open** nếu callback `onFinish` của reanimated không bắn (JS busy, animation bị gián đoạn). | **Safety timer** `setTimeout(goDetail, ANIM_MS+buffer)` + `goDetail` idempotent (`hasNavigatedRef`). Test C7. |
| R2 | **Mở/ghi trạng thái nhiều lần** khi bấm liên tục → `opened_at` bị ghi đè / animation chồng. | `isOpening` (UI) + `openBox` idempotent (`changes===0`→return) + nút `disabled`. Test B3/B4/B5. |
| R3 | **Mất trạng thái mở** nếu animation chạy trước khi persist và app bị kill giữa chừng (NFR-R1, AC-33.3). | Quy định **persist (`openBox`) TRƯỚC**, animate sau, navigate cuối. Test C6. |
| R4 | **Haptic crash** trên thiết bị/nền tảng không hỗ trợ (web, emulator). | `hapticsService` try/catch + `Platform.OS !== 'web'`; luồng không phụ thuộc haptic. Test D10. |
| R5 | **Scope creep sang sound** (asset âm thanh + thư viện audio). | Sound **loại khỏi sprint**; haptic đã thỏa AC-33.4 "optional". Nếu thêm vẫn phải optional + fallback, nhưng không thuộc Acceptance. |
| R6 | **Lộ nội dung hộp khóa** trong pha ritual nếu overlay vô tình render content. | Overlay **chỉ** nhận `boxType`, render `BoxIcon` + hiệu ứng ánh sáng; cấm truyền/ render content/image/note/question/prediction. Test A2. |
| R7 | **Đụng nhầm DB / data layer.** | F-33 KHÔNG sửa `database.ts`/SQL; chỉ tái dùng `openBox`. DB giữ version 4. Test F16. |
| R8 | **Timer chạy sau khi rời màn** → navigate nhầm/cảnh báo "update unmounted". | `clearTimeout` ở cleanup `useEffect` + guard `hasNavigatedRef`. |
| R9 | **Animation giật** trên máy yếu (NFR-P3). | Dùng reanimated UI thread, tránh layout animation nặng, thời lượng gọn ~700–1200ms. Test G17. |
| R10 | **Wrong expo-haptics version** không tương thích SDK 54 / Expo Go. | Cài bằng `npx expo install expo-haptics` (Expo resolve version); không sửa tay. |

---

## 12. Prompt giao Agent-Dev

```
Bạn là Agent-Dev (React Native / Expo SDK 54, chạy Expo Go). Triển khai Sprint 5 — Opening Ritual (F-33)
theo file Sprint/sprint5.md. Đọc kỹ sprint5.md trước khi code, bám đúng scope, KHÔNG thêm tính năng ngoài PRD.

Bối cảnh: openBox() (src/db/boxRepository.ts) đã có guard tầng data vững (chỉ update khi is_opened=0 AND
unlock_date<=now; changes===0 → đã mở thì return im lặng, idempotent). Màn pre-open.tsx đã có cờ isOpening
+ guard getBoxStatus, hiện bấm "Mở hộp" → openBox → dispatch → replace sang detail. detail.tsx đã có stagger
fade-in khi isFirstOpen='1'. F-33 KHÔNG đụng DB (giữ version 4), KHÔNG sửa SQL/migration.

Phạm vi:
1. Cài expo-haptics: `npx expo install expo-haptics` (KHÔNG hardcode version trong package.json).
2. Tạo src/services/hapticsService.ts: wrapper try/catch + check Platform.OS!=='web', fallback im lặng
   (vd hapticImpactLight(), hapticSuccess()). Luồng mở hộp KHÔNG được phụ thuộc haptic.
3. Tạo src/components/OpeningRitualOverlay.tsx (hoặc inline trong pre-open nếu gọn): animated overlay
   "mở hộp" bằng react-native-reanimated (UI thread), chuỗi nảy→nắp bật/scale→ánh sáng bùng→hạt sáng,
   ~700–1200ms, prop { boxType, onFinish }. CHỈ render hình ảnh chung chung (BoxIcon + ánh sáng) — TUYỆT
   ĐỐI không render content/image/opening_note/reflection/prediction của hộp.
4. Sửa app/box/[id]/pre-open.tsx theo thứ tự BẮT BUỘC persist→animate→navigate:
   - Bấm: nếu isOpening return; setIsOpening(true); hapticImpactLight().
   - await openBox(box.id) → dispatch(UPDATE_BOX ...). Throw → setIsOpening(false), reset, KHÔNG animate,
     KHÔNG navigate.
   - setPhase('ritual') render OpeningRitualOverlay; đặt safety timer setTimeout(goDetail, ANIM_MS+250).
   - goDetail() idempotent qua hasNavigatedRef: hapticSuccess(); router.replace('/box/[id]/detail',
     {isFirstOpen:'1'}). onFinish của overlay = goDetail.
   - clearTimeout ở cleanup; giữ guard getBoxStatus!=='ready_to_open' và redirect openedAt đã có.
5. (Tùy chọn) tinh chỉnh nhẹ timing stagger ở detail.tsx cho nối tiếp mượt — KHÔNG đổi cấu trúc.
6. Cập nhật CLAUDE.md (tech stack +expo-haptics, cấu trúc +hapticsService/OpeningRitualOverlay, quy ước
   Opening Ritual: persist→animate→navigate, safety timer, haptic optional fallback, không lộ nội dung,
   không đổi DB).

Ràng buộc bắt buộc:
- Persist (openBox) TRƯỚC animation; safety timer + hasNavigatedRef đảm bảo LUÔN navigate đúng 1 lần kể cả
  khi animation lỗi/gián đoạn (AC-33.3).
- Chống double-tap: isOpening + openBox idempotent + navigate 1 lần (AC-33.2). opened_at không bị ghi đè.
- Haptic optional, fallback im lặng, không crash trên máy không hỗ trợ/web (AC-33.4). KHÔNG thêm sound.
- KHÔNG lộ nội dung hộp khóa trong pha ritual (chỉ hình ảnh chung).
- KHÔNG thêm bảng/cột/migration; DB giữ version 4; KHÔNG sửa boxRepository ngoài việc tái dùng openBox.
- KHÔNG thêm màn/route mới; KHÔNG tự động mở hộp; KHÔNG đụng F-30/F-31/F-32/reflection; KHÔNG V2.

Sau khi code: chạy app, làm theo Test case thủ công §10 (đặc biệt A1/A2 ritual+không lộ nội dung,
B3/B4 chống double-tap, C6/C7/C8 fallback animation/persist, D10 haptic fallback, F13–F16 không hồi quy),
báo lại kết quả từng case.
```

---

*Hết Implementation Brief Sprint 5 — F-33 Opening Ritual.*
