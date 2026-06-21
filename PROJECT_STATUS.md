# PROJECT_STATUS - FutureBoxes

Cập nhật lần cuối: 2026-06-21 (V1 hoàn thành + Polish: open-box effects, filter chip, CTA bottom-inset)

---

## Trạng thái tổng quan

```
MVP (F-01~F-19) ✅  →  V1 Curiosity & Engagement (F-30~F-37) ✅  →  Complete ✅
```

- **PRD**: v1.2 (2026-06-19) — MVP đã xác nhận, V1 đã triển khai xong
- **SQLite DB**: version **6** (`futureboxes.db`)
- **Expo SDK**: 54 (managed workflow, chạy được Expo Go)
- **Tất cả màn hình theo PRD đã implement.** Không còn màn hình chưa làm.

---

## Giai đoạn 1: Requirement ✅ HOÀN THÀNH

- [x] Phân tích ý tưởng từ ideas.txt
- [x] Tạo PRD.md (v1.1 → v1.2)
- [x] Người dùng xác nhận PRD và trả lời câu hỏi mở (2026-06-11)
- [x] Bổ sung chương V1 — Curiosity & Engagement vào PRD (v1.2, 2026-06-19)

**Quyết định chốt:**
- Offline-first, không tài khoản, single-device
- Thời gian tối thiểu tạo → mở: **today + 1 ngày** (cập nhật từ "1 tháng" theo Q3 PRD 2026-06-20)
- Khóa ở tầng UI (không mã hóa DB)
- Hộp đã khóa: **không sửa được**, chỉ xóa

---

## Giai đoạn 2: Design ✅ HOÀN THÀNH

### 2.1 System & Flow Design (agent-ba)
- [x] Database schema (`design/database/schema.md`)
- [x] Activity diagrams: F-01~F-03, F-05~F-07, F-08, F-10, F-18
- [x] Người dùng xác nhận schema + diagrams (2026-06-11)

### 2.2 Screen Descriptions (agent-uiux)
- [x] Tạo `design/screens.md`
- [x] Dark glassmorphism redesign — `design/uiuxguides.md` + `src/constants/theme.ts`
- [x] Người dùng xác nhận screens (2026-06-11)

---

## Giai đoạn 3: Implementation — MVP ✅ HOÀN THÀNH

### Must have
- [x] F-01: Tạo hộp thời gian — createBox, DB transaction atomic
- [x] F-02: Chọn ngày mở — DateTimePicker, min = today+1 ngày, presets (1/2 ngày, 1/3/6 tháng, 1 năm, tùy chỉnh)
- [x] F-03: Khóa hộp & ẩn nội dung — status derived runtime, ẩn ở tầng UI
- [x] F-04: Câu hỏi phản hồi Yes/No — bảng reflection_question
- [x] F-05: Danh sách hộp — store thật, getBoxStatus realtime, AppState refresh
- [x] F-06: Mở hộp khi đến hạn — pre-open.tsx, guard 2 tầng (UI + data)
- [x] F-07: Trả lời câu hỏi & confetti — detail screen, ConfettiOverlay, EmpathyCard
- [x] F-08: Local notification — schedule/cancel
- [x] F-09: Lưu trữ cục bộ offline-first — expo-sqlite, WAL, migration system
- [x] F-10: Đính kèm ảnh — ImagePicker + copy vào documentDir
- [x] F-11: Xem chi tiết hộp đã mở — detail.tsx read-only

### Should have
- [x] F-12: Template theo loại hộp — BOX_TYPE_CONFIG
- [x] F-13: Đếm ngược trực quan — getDaysRemaining, progress bar
- [x] F-14: Animation mở hộp — translateY + opacity stagger
- [x] F-15: Xóa hộp đang khóa — locked.tsx + confirm dialog
- [x] F-16: Lời nhắn khi mở — openingNote
- [x] F-17: Tìm kiếm & lọc — SearchBar + FilterChips (all/ready/locked/opened)
- [x] F-18: App Lock (biometric/PIN) — AppLockScreen, set-pin.tsx, authService, AppGuard
- [x] F-19: Onboarding — OnboardingOverlay 3 slides + AppGuard cold-start

---

## Giai đoạn 4: Implementation — V1 Curiosity & Engagement ✅ HOÀN THÀNH

| Sprint | Feature | Mô tả | DB version | Commit |
|--------|---------|-------|------------|--------|
| 1 | Core Lock fix | Enforce unlock-date guard ở tầng data + PRD v1.2 | 3 | 64b419b |
| — | UI Redesign | Dark glassmorphism — theme tokens, box list | — | c1ba425 |
| 2 | **F-30 Mystery Teaser** | Bảng `box_teaser` (0–3 teaser, ≤160 ký tự); `unlock_at` chia đều khoảng | 3 | d851d72 |
| 3 | **F-31 Curiosity Notification** | `notification_schedule.kind`: teaser_30d/7d/1d + unlock; bỏ UNIQUE(box_id) | 3 | f68ed86 |
| 4 | **F-32 Prediction Before Opening** | Bảng `box_prediction` (0..1/box, ≤500 ký tự); edit khi khóa, read-only sau mở | 4 | c0baa88 |
| 5 | **F-33 Opening Ritual** | OpeningRitualOverlay animated + haptic; persist→animate→navigate | 4 | afbb265 |
| 6 | **F-34/F-35 Post-open Reflection + Next Box CTA** | reflection_note + rating 1–5 (sau mở); CTA "Tạo hộp mới" inline | 5 | ee8819f |
| 7 | **F-36 Personal Stats** | `app/stats.tsx` read-only, tính từ state.boxes qua `utils/stats.ts` | 5 | f7434e1 |
| 8 | **F-37 New Box Types** | Thêm BoxType: Secret, Challenge, Letter (config/template; chung bảng `box`) | 6 | c498ff4 |
| — | Fix Prediction UI | Sửa lỗi ô nhập dự đoán trên màn locked | 6 | e39ccd4 |

---

## Giai đoạn 5: Polish & Fixes sau V1 ✅ HOÀN THÀNH

| Nhánh | Mô tả | DB version | Commit |
|-------|-------|------------|--------|
| `feature/fix-filter-chip-text` | Sửa lỗi cắt chữ ở filter chips trên màn trang chủ | 6 | f66cd6e |
| `feature/open-box-effects` | **Hiệu ứng mở hộp 3 giai đoạn** + âm thanh (`soundService` + `expo-audio`): trước khi mở (rung ngẫu nhiên + knock), lúc mở (`OpeningRitualOverlay` tối màn + nắp mở chậm + creak), sau khi mở (`FogRevealOverlay` vuốt lau sương + wind loop) | 6 | 651b23c |
| `fix/create-box-cta-bottom-inset` | Sửa nút "Xem thêm" hộp đã mở và FAB bị che ở đáy | 6 | 154ee69 |

---

## Migration history (SQLite)

| Version | Thay đổi |
|---------|----------|
| v2→v3 | Rebuild `notification_schedule`: bỏ UNIQUE(box_id), thêm cột `kind` |
| v3→v4 | Thêm bảng `box_prediction` (additive: CREATE TABLE/INDEX IF NOT EXISTS) |
| v4→v5 | Rebuild `reflection_question`: `question_text` nullable + thêm `reflection_note`, `rating`, `updated_at` |
| v5→v6 | Rebuild `box`: mở rộng CHECK `box_type` để thêm Secret\|Challenge\|Letter |

---

## Tài liệu dự án

| File | Mô tả | Trạng thái |
|------|-------|------------|
| `ideas.txt` | Ý tưởng gốc từ người dùng | ✅ |
| `PRD.md` | Product Requirements Document v1.2 | ✅ Xác nhận |
| `CLAUDE.md` / `AGENTS.md` | Hướng dẫn AI agents + kiến trúc chi tiết | ✅ Sống |
| `design/database/schema.md` | Database schema | ✅ |
| `design/flows/` | Activity diagrams | ✅ |
| `design/screens.md` | Screen descriptions | ✅ |
| `design/uiuxguides.md` | Dark theme / glassmorphism guides | ✅ |

> Chi tiết kiến trúc kỹ thuật (tech stack, cấu trúc thư mục, data layer, quy ước) được duy trì trong **CLAUDE.md** — là nguồn sự thật cập nhật theo từng phiên làm việc.
