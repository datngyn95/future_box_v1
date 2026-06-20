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
│   │       └── detail.tsx      # Opened Box Detail Screen (F-07, F-11, F-14, confetti, empathy)
│   ├── settings.tsx            # Settings Screen (App Lock, Change PIN, Biometric)
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
│   │   ├── OpeningRitualOverlay.tsx # F-33 animated opening overlay
│   │   ├── AppLockScreen.tsx   # PIN pad overlay (F-18) — auto-trigger biometric
│   │   └── OnboardingOverlay.tsx # 3-slide onboarding (F-19) — render như overlay
│   ├── db/
│   │   ├── database.ts         # initDatabase(), migrateDbIfNeeded() — PRAGMA user_version
│   │   └── boxRepository.ts    # getAllBoxes(), createBox(), openBox(), deleteBox(), teaser mapping
│   ├── services/
│   │   ├── notificationService.ts  # scheduleCuriosityNotifications(), computeNotificationMarks(), cancelBoxNotification()
│   │   ├── hapticsService.ts     # safe expo-haptics wrapper for optional feedback
│   │   ├── settingsService.ts  # isAppLockEnabled, isOnboardingDone, LOCK_TIMEOUT_MS (AsyncStorage)
│   │   └── authService.ts      # setPIN/verifyPIN (SHA-256+salt), biometric (expo-local-authentication)
│   └── store/
│       └── boxStore.tsx        # BoxProvider (Context), useBoxStore() hook, reducer
│
├── assets/                     # App icons, splash screen
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


**Sprint 3 / F-31 update:** SQLite hiện là **DB version 3**. Migration v2→v3 rebuild `notification_schedule` để bỏ `UNIQUE(box_id)` và thêm `kind TEXT NOT NULL DEFAULT 'unlock' CHECK (kind IN ('unlock','teaser_30d','teaser_7d','teaser_1d'))`. Một box có thể có tối đa 4 row notification: `teaser_30d`, `teaser_7d`, `teaser_1d`, `unlock`; chỉ các mốc còn trong tương lai mới được schedule. `deleteBox` phải hủy tất cả `notification_identifier` của box rồi dựa vào FK `ON DELETE CASCADE` để xóa row DB.

**SQLite schema** (DB version 4, file: `futureboxes.db`):

| Bảng | Mô tả |
|------|-------|
| `box` | Thực thể hộp thời gian (nội dung, loại, ngày mở, trạng thái) |
| `reflection_question` | Câu hỏi Yes/No tùy chọn, quan hệ 1-1 với box |
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
- Không cho sửa nội dung sau khi khóa; chỉ cho xóa (theo Q7 PRD)
