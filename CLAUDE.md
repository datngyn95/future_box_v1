@AGENTS.md

## Quy tắc cập nhật tài liệu

**Mỗi khi thay đổi cấu trúc dự án** (thêm/xóa màn hình, thêm/đổi thư viện, thay đổi kiến trúc lưu trữ, thêm service/store mới), phải cập nhật phần **Kiến trúc dự án** bên dưới ngay trong cùng phiên làm việc đó.

---

## Kiến trúc dự án

### Tech Stack

| Hạng mục | Thư viện / Phiên bản |
|----------|----------------------|
| Framework | Expo SDK **54** (managed workflow) — downgrade từ SDK 56 để chạy Expo Go |
| Runtime | React Native **0.81.5** / React **19.1.0** |
| Ngôn ngữ | TypeScript **5.9** |
| Navigation | **expo-router** ~6.0.24 (file-based routing) |
| Database | **expo-sqlite** ~16.0.10 (`SQLiteProvider` + async API) |
| Notifications | **expo-notifications** ~0.32.17 (local only, no backend) |
| Animation | **react-native-reanimated** ~4.1.1 + **react-native-worklets** 0.5.2 |
| Haptics | **expo-haptics** ~15.0.8 (optional feedback, silent fallback) |
| Audio | **expo-audio** (hiệu ứng âm thanh mở hộp; imperative `createAudioPlayer`, optional/silent khi chưa có file) |
| Image picker | **expo-image-picker** ~17.0.11 |
| File system | **expo-file-system** ~19.0.23 (lưu ảnh vào documentDirectory) |
| Icons | **@expo/vector-icons** ^15.0.3 (Ionicons) |
| Gradient | **expo-linear-gradient** ~15.0.8 |
| Blur (glassmorphism) | **expo-blur** ~15.0.8 — frosted glass cards |
| Crypto | **expo-crypto** ~15.0.9 (UUID generation + SHA-256 PIN hash) |
| Secure store | **expo-secure-store** ~15.0.8 (lưu PIN hash) |
| Biometric | **expo-local-authentication** ~17.0.8 (Face ID / vân tay) |
| Settings storage | **@react-native-async-storage/async-storage** ^2.1.2 (app settings) |
| State | React Context + useReducer (custom, không dùng Redux/Zustand) |

### Cấu trúc thư mục

```
/
├── app/                        # Expo Router screens (file-based routing)
│   ├── _layout.tsx             # Root layout: BoxProvider, DB init, notification handler
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Tab bar layout
│   │   └── index.tsx           # Home / Box List Screen (màn hình chính)
│   ├── create-box/
│   │   ├── index.tsx           # Select Box Type Screen (chọn loại hộp)
│   │   ├── [type].tsx          # Create Box Form Screen (form tạo hộp, param: BoxType)
│   │   ├── confirm-lock.tsx    # Lock Confirmation Modal (transparentModal)
│   │   └── success.tsx         # Lock Success Screen (gesture disabled)
│   ├── box/
│   │   └── [id]/
│   │       ├── locked.tsx      # Locked Box Peek Screen (metadata + xóa hộp F-15)
│   │       ├── pre-open.tsx    # Pre-open Screen (F-06, guard check, "Mở hộp" CTA)
│   │       └── detail.tsx      # Opened Box Detail Screen (F-07, F-11, F-14, F-34/F-35, confetti, empathy)
│   ├── settings.tsx            # Settings Screen (App Lock, Change PIN, Biometric)
│   ├── stats.tsx               # Personal Stats Screen (F-36, read-only local stats)
│   └── auth/
│       └── set-pin.tsx         # Set/Change PIN (3 steps: enter → confirm → biometric offer)
│
├── src/
│   ├── types/
│   │   └── box.ts              # Core types: Box, BoxType, BoxStatus, BoxTypeConfig
│   ├── constants/
│   │   ├── boxTypes.ts         # BOX_TYPE_CONFIG (icon, màu, placeholder, câu hỏi mặc định)
│   │   ├── colors.ts           # Màu sắc toàn app + màu theo loại hộp
│   │   ├── spacing.ts          # Spacing constants
│   │   ├── typography.ts       # Typography constants
│   │   └── theme.ts            # Dark theme tokens (uiuxguides.md): colors, text, motion, blur
│   ├── components/
│   │   ├── BoxIcon.tsx         # Component icon hộp dùng chung
│   │   ├── OpeningRitualOverlay.tsx # GĐ2 mở hộp: tối màn + nắp mở chậm ~3s + tap bỏ qua
│   │   ├── FogRevealOverlay.tsx # GĐ3 mở hộp: vuốt lau sương để lộ nội dung + nút "Hiện luôn"
│   │   ├── AppLockScreen.tsx   # PIN pad overlay (F-18) — auto-trigger biometric
│   │   └── OnboardingOverlay.tsx # 3-slide onboarding (F-19) — render như overlay
│   ├── db/
│   │   ├── database.ts         # initDatabase(), migrateDbIfNeeded() — PRAGMA user_version
│   │   └── boxRepository.ts    # getAllBoxes(), createBox(), openBox(), deleteBox(), reflection/prediction/teaser mapping
│   ├── services/
│   │   ├── notificationService.ts  # scheduleCuriosityNotifications(), computeNotificationMarks(), cancelBoxNotification()
│   │   ├── hapticsService.ts     # safe expo-haptics wrapper (light/medium impact, success)
│   │   ├── soundService.ts     # expo-audio wrapper: playSound/startLoop/stopSound (optional/silent)
│   │   ├── settingsService.ts  # isAppLockEnabled, isOnboardingDone, LOCK_TIMEOUT_MS (AsyncStorage)
│   │   └── authService.ts      # setPIN/verifyPIN (SHA-256+salt), biometric (expo-local-authentication)
│   ├── store/
│   │   └── boxStore.tsx        # BoxProvider (Context), useBoxStore() hook, reducer
│   └── utils/
│       └── stats.ts            # computeStats() for Personal Stats (F-36)
│
├── assets/                     # App icons, splash screen
│   └── sounds/                 # File âm thanh mở hộp (knock/creak/wind/bell) — xem README; chưa có file thì service no-op
├── design/                     # Tài liệu thiết kế (screens.md, flows/, database/schema.md, uiuxguides.md)
├── PRD.md                      # Product Requirements Document v1.2
├── AGENTS.md                   # Hướng dẫn cho AI agents
└── CLAUDE.md                   # File này
```

### Navigation Flow (expo-router)

```
RootLayout (BoxProvider → AppGuard)
│   AppGuard: onboarding check → lock check → AppState timeout lock
│   Overlays (zIndex): AppLockScreen (9999) > OnboardingOverlay (9998)
├── (tabs)
│   └── index               → Home / Box List (search bar F-17, filter chips F-17)
├── create-box
│   ├── index               → Select Box Type
│   ├── [type]              → Create Box Form  (params: type = message|goal|memory|decision)
│   ├── confirm-lock        → Lock Confirmation Modal
│   └── success             → Lock Success (stack reset sau khi navigate)
├── box/[id]
│   ├── locked              → Locked Box Peek (metadata + delete)
│   ├── pre-open            → Pre-open Screen ("Mở hộp" CTA, guard)
│   └── detail              → Opened Box Detail (content, confetti, reflection, F-14 stagger)
├── settings                → Settings Screen (App Lock, Change PIN, Biometric)
├── stats                   → Personal Stats (F-36), entry from Home header
└── auth/set-pin            → Set/Change PIN (3 steps)
```

**Tất cả màn hình đã implement.** Không còn màn hình chưa làm theo PRD.

### Data Layer

### Sprint 4 / F-32 Prediction

- SQLite DB version 4 adds `box_prediction` with `box_id UNIQUE`, FK `ON DELETE CASCADE`, and `idx_box_prediction_box_id`.
- Migration v3->v4 is additive only: `CREATE TABLE IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS`; no drop/alter/rebuild of older tables.
- Prediction is optional, max 500 characters, max 1 active row per box, entered only on `box/[id]/locked.tsx` after box creation.
- Prediction can be freely edited while `is_opened = 0`; after opening it is read-only in Detail and `upsertPrediction` throws `BOX_NOT_EDITABLE` for direct writes.
- Locked screen must not render original `content`, `image_path`, `opening_note`, or `reflection_question`; it may render only user-entered prediction plus existing metadata/teasers.

### Sprint 6 / F-34-F-35 Post-open Reflection

- SQLite DB version 5 rebuilds `reflection_question` from v4 to v5 using the same safe rebuild pattern as v2->v3: copy `id`, `box_id`, `question_text`, `answer`, `answered_at`, then drop/rename with FK OFF->ON.
- `reflection_question.question_text` is nullable in v5 so opened boxes without a Yes/No question can still store post-open reflection.
- `reflection_question` now includes `reflection_note TEXT`, `rating INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)`, and `updated_at TEXT`.
- F-34 reflection note/rating is optional, editable after opening, and can only be written when `box.is_opened = 1`; data layer guard is `BOX_NOT_OPENED`.
- `upsertReflectionNote` must only touch `reflection_note`, `rating`, and `updated_at`; it must not change `question_text`, `answer`, `answered_at`, or original box content/image/opening note.
- F-35 CTA is rendered at the end of opened `box/[id]/detail.tsx` and navigates to `/create-box`; it is inline in the ScrollView, not a blocking modal.

### Sprint 8 / F-37 New Box Types

- SQLite DB version 6 rebuilds `box` from v5 to v6 to widen `box_type` CHECK from `Message|Goal|Memory|Decision` to `Message|Goal|Memory|Decision|Secret|Challenge|Letter`.
- Migration v5->v6 copies every existing `box` row and column, drops/renames with `PRAGMA foreign_keys = OFF`, recreates `idx_box_unlock_date`, `idx_box_is_opened`, `idx_box_type`, and `idx_box_list`, then turns FK checks back on.
- F-37 adds `secret`, `challenge`, and `letter` only as `BoxType` values plus TypeScript config/templates. Do not add separate tables, columns, per-type flows, or encryption/PIN behavior for Secret.


**Sprint 3 / F-31 update:** SQLite hiện là **DB version 3**. Migration v2→v3 rebuild `notification_schedule` để bỏ `UNIQUE(box_id)` và thêm `kind TEXT NOT NULL DEFAULT 'unlock' CHECK (kind IN ('unlock','teaser_30d','teaser_7d','teaser_1d'))`. Một box có thể có tối đa 4 row notification: `teaser_30d`, `teaser_7d`, `teaser_1d`, `unlock`; chỉ các mốc còn trong tương lai mới được schedule. `deleteBox` phải hủy tất cả `notification_identifier` của box rồi dựa vào FK `ON DELETE CASCADE` để xóa row DB.

**SQLite schema** (DB version 6, file: `futureboxes.db`):

| Bảng | Mô tả |
|------|-------|
| `box` | Thực thể hộp thời gian (nội dung, loại, ngày mở, trạng thái) |
| `reflection_question` | Câu hỏi Yes/No tùy chọn + post-open reflection note/rating; 1-1 với box, `question_text` nullable, FK `ON DELETE CASCADE` |
| `notification_schedule` | Ánh xạ box ↔ notification identifier để hủy khi xóa |
| `box_teaser` | Mystery teaser F-30, quan hệ nhiều-1 với box, FK `ON DELETE CASCADE` |
| `box_prediction` | Prediction Before Opening F-32, optional 0..1 per box, FK `ON DELETE CASCADE`, read-only after open |

Trạng thái hộp **không lưu cứng** vào DB — được tính toán (derived) trong code:
```ts
// src/types/box.ts
function getBoxStatus(box, now): BoxStatus
// 'locked' | 'ready_to_open' | 'opened'
```

**Phân chia lưu trữ:**
- File ảnh → `documentDirectory/box_images/<box_id>.<ext>`
- Cài đặt app (App Lock on/off, onboarding) → AsyncStorage
- PIN hash → expo-secure-store

### State Management

`src/store/boxStore.tsx` — React Context + useReducer:
- `BoxProvider` bọc toàn bộ app trong `app/_layout.tsx`
- `useBoxStore()` trả về `{ state, dispatch }`
- State chứa: `boxes: Box[]`, `loading: boolean`, `error: string | null`
- Actions: `SET_BOXES`, `ADD_BOX`, `UPDATE_BOX`, `DELETE_BOX`, `SET_LOADING`, `SET_ERROR`

### Quy ước quan trọng

- **ID**: UUID v4 sinh bằng `expo-crypto` ở client
- **Thời gian**: `created_at`, `opened_at` lưu ISO8601 UTC; `unlock_date` lưu 00:00 local của ngày mở
- **Tạo hộp** là 1 transaction: INSERT box + reflection_question + notification_schedule + box_teaser trong `db.withTransactionAsync`
- **Ẩn nội dung hộp khóa**: chỉ ẩn ở tầng UI, không mã hóa DB (theo Q4 PRD)
- **Xóa hộp**: hard delete + CASCADE + hủy notification + xóa file ảnh
- **Mystery teaser (F-30)**: nhập 0-3 teaser lúc tạo hộp, mỗi teaser tối đa 160 ký tự; `createBox` tự tính `unlock_at` bằng cách chia đều khoảng từ `created_at` đến `unlock_date`. UI chỉ render teaser khi `now >= unlock_at` và hộp còn locked; Home chỉ hiển thị badge, không in nội dung teaser.
- `unlock_date` tối thiểu = today + 1 ngày (theo Q3 PRD, cập nhật 2026-06-20); chặn chọn hôm nay/quá khứ. Preset: 1 ngày, 2 ngày, 1 tháng, 3 tháng, 6 tháng, 1 năm + "Tùy chỉnh". Validate 2 tầng: UI (`app/create-box/[type].tsx`) + data (`validateUnlockDate` trong `src/db/boxRepository.ts`)
- **Mở hộp** chỉ khi `now >= unlock_date`; guard ở cả UI (`getBoxStatus`) lẫn tầng data (`openBox` dùng SQL `unlock_date <= now AND is_opened = 0`). Màn `box/[id]/detail.tsx` early-return `null` khi `status !== 'opened'` để không lộ content/ảnh/lời nhắn/câu hỏi của hộp khóa
- **Opening Ritual (F-33)**: `box/[id]/pre-open.tsx` follows persist -> animate -> navigate. `openBox` runs before `OpeningRitualOverlay`; navigation is guarded by `hasNavigatedRef` and a safety timer so animation callbacks cannot hang or double-navigate. Haptics go through `hapticsService` and must remain optional/silent on unsupported devices. The ritual overlay only receives `boxType` and must not render content, image, opening note, reflection answer, or prediction. F-33 does not change DB schema or migrations.
- **Hiệu ứng mở hộp 3 giai đoạn** (nhánh `feature/open-box-effects`): (1) **Trước khi mở** — `pre-open.tsx`: hộp đứng yên, thỉnh thoảng rung nhẹ theo nhịp NGẪU NHIÊN + tiếng gõ `knock` + haptic; bộ lập lịch tự dừng khi bắt đầu mở (`openingRef`). (2) **Lúc mở** — `OpeningRitualOverlay.tsx`: tối toàn màn, hộp phát sáng mờ, nắp mở rất chậm `OPENING_RITUAL_DURATION_MS = 3000` + tiếng `creak`, có "Chạm để bỏ qua"; vẫn theo guard `hasNavigatedRef` + safety timer của pre-open. (3) **Sau khi mở** — `FogRevealOverlay.tsx`: lớp sương (BlurView + gradient trôi) che nội dung, **vuốt tích lũy** (`PanResponder`, ngưỡng `ACC_THRESHOLD` px) làm sương tan dần, có bóng mờ chiếc hộp + nút "Hiện luôn"; chỉ hiện khi `firstOpen && !revealed`; stagger reveal nội dung (F-14) chỉ chạy sau khi `revealed`. `bell` ngẫu nhiên do fog phát; **tiếng `wind` (loop) do màn `detail` làm chủ** — bật khi vào màn hộp đã mở, tắt khi rời màn — nên âm nền gió liền mạch từ lúc lau sương qua suốt phần nhập "Cảm nhận sau khi mở".
- **Âm thanh (`soundService` + `expo-audio`)**: optional/silent — `SOUND_SOURCES` hiện trống nên mọi hàm no-op; thêm file vào `assets/sounds/` rồi bỏ comment `require` để bật, KHÔNG cần sửa chỗ gọi. Mọi lời gọi âm thanh phải im lặng an toàn khi chưa có file / thiết bị không hỗ trợ (giống haptics).
- **Post-open Reflection (F-34)**: reflection note + rating 1-5 are optional and editable only after open. UI renders only in opened detail; repository writes are guarded by `BOX_NOT_OPENED`. Reflection is independent from Yes/No answer and original content remains read-only.
- **Create Next Box CTA (F-35)**: opened detail ends with inline CTA "Tạo hộp mới cho tương lai" -> `/create-box`; keep EmpathyCard CTA for the "No" answer path.
- **Personal Stats (F-36)**: `app/stats.tsx` is read-only and computes all values from `state.boxes` through `src/utils/stats.ts` + `getBoxStatus`. F-36 has no DB migration, no notification changes, and no data mutation. Stats must not render locked box content, image, opening note, reflection note text, reflection answer details, prediction text, or teaser text; only counts plus public metadata for the next locked box (title, type, unlock date, countdown). Empty state navigates to `/create-box`.
- **New Box Types (F-37)**: Secret/Challenge/Letter share the existing `box` table and generic create/lock/open/detail flow. They are template/config additions only, must follow the same locked-content rule as all other box types, and must not introduce separate DB tables, separate business logic, account/cloud/public sharing, or Secret-specific encryption/PIN behavior.
- Không cho sửa nội dung sau khi khóa; chỉ cho xóa (theo Q7 PRD)
