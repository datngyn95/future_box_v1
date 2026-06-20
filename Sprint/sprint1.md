# Sprint 1 — Core Lock & PRD Consistency

> **Vai trò:** Agent-BA + Tech Reviewer
> **Ngày review:** 2026-06-20
> **PRD đối chiếu:** PRD.md v1.2 (2026-06-19)
> **Phạm vi:** Core Lock & QA (Roadmap Sprint 0 + Sprint 1). KHÔNG bao gồm V1 (Teaser, Prediction, Stats, New Box Types...).
> **Ràng buộc review:** Chỉ kiểm tra — KHÔNG sửa code, KHÔNG refactor, KHÔNG thêm feature. Tài liệu này là sản phẩm review, không phải thay đổi source.

---

## 1. Tổng kết mức độ hoàn thành

**Ước lượng: ~80% (logic nghiệp vụ ~85%, nhưng có 2 blocker hạ điểm tổng thể).**

Phần lớn luồng Core Lock đã code đúng PRD ở tầng UI và phần lớn tầng data. Tuy nhiên còn **2 vấn đề Critical** khiến Sprint 1 chưa thể coi là "đóng":

1. **Toàn bộ thư mục `src/` đã bị xóa khỏi working tree** (chỉ còn trong git HEAD) → app hiện **không build/chạy được**.
2. **`openBox()` ở tầng repository thiếu guard ngày mở** — đúng điểm mà Sprint 0 roadmap và mục 8.6 PRD yêu cầu siết.

Nếu xử lý xong 2 mục Critical + các mục High, Sprint 1 đạt ~95%+.

---

## 2. Các điểm ĐÃ ĐÚNG PRD

| # | Hạng mục | PRD rule | Vị trí code | Ghi chú |
|---|----------|----------|-------------|---------|
| ✓1 | Preset ngày mở: 1 / 3 / 6 / 12 tháng | AC-02.2, Q3 | `app/create-box/[type].tsx:52-55` | Đúng 4 preset. |
| ✓2 | Ngày mở tối thiểu +1 tháng, chỉ chọn ngày (no time) | AC-02.1, AC-02.3, Q3 | `[type].tsx:64-68,395-403`, `mode="date"`, `minimumDate` | Có cả `minimumDate` ở picker. |
| ✓3 | Validate ngày mở ở tầng data | Sprint 0 | `boxRepository.ts:validateUnlockDate()` | createBox throw nếu < min. |
| ✓4 | Hộp Locked KHÔNG render content/image/note | AC-03.1, AC-03.2 | `locked.tsx` (chỉ metadata), `index.tsx:200-219` (card khóa chỉ title + countdown) | Không render content ở list & peek. |
| ✓5 | Tính trạng thái đúng theo device clock | AC-03.3 | `boxStore.ts:getBoxStatus()` | opened→openedAt; now≥unlock→ready; else locked. |
| ✓6 | Mở hộp lưu `opened_at` + chuyển vĩnh viễn Opened | AC-06.3 | `boxRepository.ts:openBox()` | `UPDATE ... WHERE is_opened = 0` (idempotent, chống mở lại). |
| ✓7 | Pre-open: người dùng chủ động nhấn "Mở hộp" | AC-06.1 | `pre-open.tsx:handleOpen` | Không tự mở; có guard `getBoxStatus !== 'ready_to_open'` ở UI. |
| ✓8 | Hộp đã khóa KHÔNG cho sửa, CHỈ cho xóa | F-15, Q7 | `locked.tsx` (chỉ có nút Xóa, không có Edit) | Không tồn tại route/edit nội dung. |
| ✓9 | Xóa hộp → hủy notification + CASCADE + xóa ảnh | AC-08.4 | `boxRepository.ts:deleteBox()` | Lấy identifier trước, cancel, xóa file. |
| ✓10 | Hộp đã xóa biến mất khỏi danh sách | F-05 | `deleteBox` hard delete + `getAllBoxes WHERE is_deleted=0` + `DELETE_BOX` reducer | Đồng bộ DB + state. |
| ✓11 | Notification chỉ schedule khi có quyền & thời điểm tương lai | AC-08.3, 8.4 rules | `notificationService.ts:scheduleBoxNotification` | Từ chối quyền vẫn tạo hộp. |
| ✓12 | NFR-S1: khóa tầng UI, KHÔNG encryption at rest | NFR-S1, Q4 | Content lưu plaintext trong SQLite, chỉ ẩn ở UI | Đúng định hướng mới. |
| ✓13 | App Lock không có bypass nguy hiểm | F-18, NFR-S4 | `AppLockScreen.tsx`, `authService.ts` | PIN SHA-256+salt → SecureStore; biometric `disableDeviceFallback`; timeout 30s; không có "skip". |
| ✓14 | Tạo hộp atomic (transaction) | NFR-R1 | `boxRepository.ts:createBox` `withTransactionAsync` + rollback ảnh/notif | An toàn khi DB lỗi. |

---

## 3. Các điểm SAI / THIẾU so với PRD

### 🔴 CRITICAL — phải sửa NGAY trước Sprint 2

#### C-1. Toàn bộ `src/` bị xóa khỏi working tree → app không chạy
- **Mô tả:** `git status` cho thấy 15 file trong `src/` ở trạng thái deleted (` D`). Trên đĩa `src/` không tồn tại, nhưng các màn `app/*` vẫn `import` từ `../src/...`. App hiện **không thể build/run**.
- **PRD rule:** Toàn bộ Must-have MVP (F-01→F-11) + ràng buộc #13 "không làm ảnh hưởng MVP đã chạy ổn".
- **File/module nghi ngờ:** Toàn bộ `src/` (types, db, services, store, constants, components).
- **Hướng sửa đề xuất:** Khôi phục từ git HEAD: `git checkout -- src/` (hoặc `git restore src/`). Xác nhận đây là thao tác xóa ngoài ý muốn, không phải tái cấu trúc có chủ đích. Sau khôi phục chạy `expo start` để smoke test.
- **Test case:** App khởi động không lỗi import; tạo/khóa/mở/xóa 1 hộp chạy được end-to-end.

#### C-2. `openBox()` thiếu guard ngày mở ở tầng repository
- **Mô tả:** `openBox(id)` chỉ chặn mở lại (`WHERE is_opened = 0`), **không kiểm tra `unlock_date <= now`**. Guard ngày mở hiện chỉ tồn tại ở UI (`pre-open.tsx`). Bất kỳ caller nào (deep-link, code tương lai, lỗi điều hướng) gọi `openBox` đều có thể mở hộp **chưa đến hạn**.
- **PRD rule:** Sprint 0 roadmap ("Đảm bảo `openBox()` kiểm tra ngày mở ở tầng business logic/data"); mục 8.6 Business Rules ("`openBox()` phải có guard ở tầng business logic/data, không chỉ ở UI"); AC-06.4; ràng buộc review #3.
- **File/module nghi ngờ:** `src/db/boxRepository.ts:openBox()`.
- **Hướng sửa đề xuất:** Thêm điều kiện ngày mở vào câu UPDATE hoặc đọc box trước khi mở: `UPDATE box SET is_opened=1, opened_at=? WHERE id=? AND is_opened=0 AND unlock_date <= ?` (truyền `now` ISO). Nếu `changes === 0` → throw lỗi `BOX_NOT_READY` để caller phân biệt "đã mở" vs "chưa đến hạn".
- **Test case:**
  - Hộp Locked (now < unlock): gọi `openBox` → KHÔNG đổi `is_opened`, ném/lỗi rõ ràng.
  - Hộp ReadyToOpen: `openBox` → `is_opened=1`, `opened_at` set.
  - Gọi `openBox` 2 lần liên tiếp trên hộp ready: chỉ mở 1 lần, `opened_at` không bị ghi đè.

---

### 🟠 HIGH — nên sửa trong Sprint 1

#### H-1. `detail.tsx` không có guard chống render khi hộp chưa mở
- **Mô tả:** Màn detail render thẳng content/ảnh/note mà **không kiểm tra `openedAt`/status**. Hiện an toàn vì điều hướng chỉ vào detail từ trạng thái `opened`, nhưng thiếu defense-in-depth: deep-link hoặc bug điều hướng có thể làm lộ nội dung hộp chưa mở.
- **PRD rule:** AC-03.2 ("nội dung không được render ở ... preview"), NFR-U5.
- **File/module nghi ngờ:** `app/box/[id]/detail.tsx`.
- **Hướng sửa đề xuất:** Đầu màn, nếu `!box.openedAt` (hoặc `getBoxStatus(box) !== 'opened'`) thì `router.replace` về pre-open/locked tương ứng thay vì render content.
- **Test case:** Điều hướng trực tiếp tới `/box/<lockedId>/detail` → không hiển thị content, bị redirect.

#### H-2. Deep-link notification luôn đẩy vào `pre-open` không kèm guard trạng thái
- **Mô tả:** `addNotificationResponseListener` → `router.push('/box/<id>/pre-open')` cho mọi notification. Sprint 1 chỉ có notification `unlock` (đúng ngày) nên thường an toàn, nhưng nếu OS bắn trễ/sai hoặc box đã bị xóa, màn pre-open xử lý chưa rõ ràng (box không tồn tại → hiện "Không tìm thấy hộp").
- **PRD rule:** AC-08.2, AC-31.3/31.4 (định hướng V1, để chuẩn bị).
- **File/module nghi ngờ:** `app/_layout.tsx:AppInit` (listener), `pre-open.tsx`.
- **Hướng sửa đề xuất:** Khi nhận boxId, kiểm tra tồn tại + trạng thái rồi điều hướng: ready→pre-open, locked→locked, opened→detail, không tồn tại→home.
- **Test case:** Tap notification của hộp đã xóa → về home, không crash. Tap notification hộp ready → vào pre-open.

---

### 🟡 MEDIUM — có thể sửa sau, cần ghi chú

#### M-1. Chưa có cảnh báo chống tua giờ thiết bị (anti time-tamper)
- **Mô tả:** Trạng thái dựa hoàn toàn vào device clock; người dùng tua giờ về tương lai có thể mở sớm. PRD để mức "nên" (should).
- **PRD rule:** AC-03.4, NFR-R3, A6.
- **File:** `boxStore.ts:getBoxStatus`, `pre-open.tsx`.
- **Hướng sửa:** Lưu mốc thời gian "đã thấy" lớn nhất; nếu now nhảy bất thường so với createdAt/last-seen thì cảnh báo. Có thể để V1.
- **Test case:** Tua giờ máy +2 tháng → app cảnh báo hoặc không cho mở "im lặng".

#### M-2. `validateUnlockDate` / `getMinDate` dùng `setMonth(+1)` có thể lệch cuối tháng
- **Mô tả:** `setMonth(getMonth()+1)` với ngày 31 → tràn sang tháng sau (vd 31/01 → 03/03). Lệch 1-3 ngày ở biên.
- **PRD rule:** AC-02.1.
- **File:** `boxRepository.ts:validateUnlockDate`, `[type].tsx:getMinDate`.
- **Hướng sửa:** Chuẩn hóa kẹp ngày khi tràn tháng, hoặc dùng thư viện date.
- **Test case:** Tạo hộp ngày 31 → min date không bị nhảy quá 1 tháng.

#### M-3. `AppLockScreen` không giới hạn số lần thử PIN (no lockout)
- **Mô tả:** PIN 4 số, không có cooldown/lockout sau nhiều lần sai → dễ brute-force nếu kẻ xấu cầm máy.
- **PRD rule:** NFR-S4, F-18.
- **File:** `AppLockScreen.tsx`.
- **Hướng sửa:** Thêm đếm số lần sai + delay/lockout tăng dần. Không bắt buộc MVP nhưng nên ghi chú.
- **Test case:** Nhập sai 5 lần → bị khóa tạm/đếm ngược.

---

### 🟢 LOW — tối ưu nhỏ / ghi chú cho sprint sau

#### L-1. CHECK constraint `box_type` chỉ chấp nhận 4 loại
- **Mô tả:** `box_type IN ('Message','Goal','Memory','Decision')`. Đúng cho Sprint 1, nhưng sẽ chặn New Box Types (F-37) — cần migration ở Sprint 7.
- **PRD rule:** Mục 9.1 (ghi chú kỹ thuật migration). **Ngoài phạm vi Sprint 1**, chỉ ghi nhận.

#### L-2. Cột `is_cancelled` trong `notification_schedule` chưa dùng
- **Mô tả:** Xóa hộp dùng hard delete + CASCADE nên row notification bị xóa luôn, cờ `is_cancelled` không bao giờ set. Hợp lệ với AC-08.4 ("hủy hoặc đánh dấu cancelled"). Ghi nhận để Sprint 3 (field `kind`) tái dùng.

#### L-3. `getAllBoxes` luôn nạp lại toàn bộ khi mở app
- **Mô tả:** Không có vấn đề ở quy mô MVP; nếu nhiều hộp cân nhắc phân trang (NFR-P2 đã dùng list ảo hóa ở UI). Ghi nhận.

---

## 4. Fix Plan ngắn gọn cho Sprint 1 (chưa code)

> Thứ tự ưu tiên thực thi. Mỗi mục kèm điều kiện "Done".

| Bước | Việc | Mức | Done khi |
|------|------|-----|----------|
| 1 | Khôi phục `src/` từ git (`git restore src/`) + smoke test app | C-1 | App build & chạy end-to-end 1 hộp |
| 2 | Thêm guard ngày mở vào `openBox()` (repository), throw `BOX_NOT_READY` | C-2 | Test case C-2 pass |
| 3 | Thêm guard render ở `detail.tsx` (redirect nếu chưa opened) | H-1 | Direct-nav locked→detail không lộ content |
| 4 | Guard điều hướng theo trạng thái cho deep-link notification | H-2 | Tap notif hộp đã xóa không crash |
| 5 | (Ghi chú) M-1 anti time-tamper, M-2 lệch cuối tháng, M-3 PIN lockout | M | Đưa vào backlog có chủ đích |
| 6 | Chạy lại checklist QA Sprint 1 (tạo/locked/ready/opened/notif/delete/app-lock) | — | Toàn bộ test case mục 5 pass |

### Checklist QA hồi quy (regression) sau khi sửa
- [ ] Tạo hộp 4 loại; ngày mở < 1 tháng bị chặn; preset 1/3/6/12T đúng.
- [ ] Hộp Locked: list + peek KHÔNG lộ content/ảnh/note/câu hỏi.
- [ ] Hộp tới hạn tự chuyển nhóm "Sẵn sàng mở".
- [ ] `openBox` chặn hộp Locked ở tầng data (gọi trực tiếp, bỏ qua UI).
- [ ] Mở hộp → `opened_at` set, chuyển Opened vĩnh viễn, mở lại không đổi dữ liệu.
- [ ] detail chỉ hiển thị khi đã mở.
- [ ] Xóa hộp Locked → biến mất khỏi list + notification bị hủy + ảnh bị xóa.
- [ ] Từ chối quyền notification → app vẫn tạo/mở hộp bình thường.
- [ ] App Lock bật: background > 30s → yêu cầu PIN/biometric; PIN sai → báo lỗi, không bypass.

---

## 5. Phạm vi KHÔNG đụng tới (xác nhận giữ nguyên)

Theo ràng buộc, **không** triển khai và **không** đánh giá sâu các feature V1:
F-30 Mystery Teaser, F-31 Curiosity Notification, F-32 Prediction, F-33 Opening Ritual (animation nâng cao), F-34 Reflection Note, F-35 Next Box CTA, F-36 Stats, F-37 New Box Types.
Các bảng `box_teaser`, `box_prediction` và field `kind`/`reflection_note`/`rating` chưa được tạo — **đúng**, vì thuộc Sprint 2-7.
