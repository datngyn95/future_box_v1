# PROJECT_STATUS - FutureBoxes

Cập nhật lần cuối: 2026-06-11 (phiên 3)

---

## Trạng thái tổng quan

```
Requirement ✓  →  Design ✓  →  Implementation ✓  →  Complete ✅
```

---

## Giai đoạn 1: Requirement ✅ HOÀN THÀNH

- [x] Phân tích ý tưởng từ ideas.txt
- [x] Tạo PRD.md (v1.1)
- [x] Người dùng xác nhận PRD và trả lời câu hỏi mở (2026-06-11)

**Quyết định chốt:**
- Offline-first, không tài khoản, single-device
- Thời gian tối thiểu tạo → mở: **1 tháng**
- Khóa ở tầng UI (không mã hóa)
- Hộp đã khóa: **không sửa được**, chỉ xóa

---

## Giai đoạn 2: Design ✅ HOÀN THÀNH

### 2.1 System & Flow Design (agent-ba)
- [x] Database schema (`design/database/schema.md`)
- [x] Activity diagram: F-01~F-03 Tạo & Khóa hộp
- [x] Activity diagram: F-05~F-07 Danh sách, Mở hộp, Trả lời
- [x] Activity diagram: F-08 Notification
- [x] Activity diagram: F-10 Đính kèm ảnh
- [x] Activity diagram: F-18 App Lock
- [x] Người dùng xác nhận schema + diagrams (2026-06-11)

### 2.2 Screen Descriptions (agent-uiux)
- [x] Tạo `design/screens.md`
- [x] Người dùng xác nhận screens (2026-06-11)

---

## Giai đoạn 3: Implementation ✅ HOÀN THÀNH

### Must have features
- [x] F-01: Tạo hộp thời gian — business logic layer (createBox, DB transaction, atomic)
- [x] F-02: Chọn ngày mở — native DateTimePicker, min = today+1 tháng, presets
- [x] F-03: Khóa hộp & ẩn nội dung — status derived runtime, hidden at UI layer
- [x] F-04: Câu hỏi phản hồi — lưu vào reflection_question table
- [x] F-05: Danh sách hộp — kết nối store thật, getBoxStatus realtime, AppState refresh
- [x] F-06: Mở hộp khi đến hạn — app/box/[id]/pre-open.tsx, guard check, openBox()
- [x] F-07: Trả lời câu hỏi & hiệu ứng confetti — detail screen, ConfettiOverlay, EmpathyCard
- [x] F-08: Local notification — scheduleBoxNotification, cancelBoxNotification
- [x] F-09: Lưu trữ cục bộ (offline-first) — expo-sqlite, WAL, migration system
- [x] F-10: Đính kèm ảnh — ImagePicker + copy to documentDir, permission banner
- [x] F-11: Xem chi tiết hộp đã mở — app/box/[id]/detail.tsx (read-only, badge kết quả)

### Should have features
- [x] F-12: Template theo loại hộp — BOX_TYPE_CONFIG constants (đã có từ trước)
- [x] F-13: Đếm ngược trực quan — getDaysRemaining, progress bar (đã có từ trước)
- [x] F-14: Animation mở hộp — translateY + opacity stagger khi firstOpen trong detail.tsx
- [x] F-15: Xóa hộp đang khóa — app/box/[id]/locked.tsx có nút xóa + confirm dialog
- [x] F-16: Lời nhắn khi mở — openingNote field trong DB và form
- [x] F-17: Tìm kiếm & lọc — SearchBar inline + FilterChips (all/ready/locked/opened) trong index.tsx
- [x] F-18: App Lock (biometric/PIN) — AppLockScreen, set-pin.tsx, settingsService, authService, AppGuard trong _layout.tsx
- [x] F-19: Onboarding — OnboardingOverlay 3 slides + AppGuard cold-start check

---

## Tài liệu dự án

| File | Mô tả | Trạng thái |
|------|-------|------------|
| `ideas.txt` | Ý tưởng gốc từ người dùng | ✅ |
| `PRD.md` | Product Requirements Document v1.1 | ✅ Xác nhận |
| `design/database/schema.md` | Database schema | ⏳ |
| `design/flows/` | Activity diagrams | ⏳ |
| `design/screens.md` | Screen descriptions | ⏳ |
