# Future Boxes 📦

Ứng dụng **"hộp thời gian"** (time capsule) trên di động: tạo một chiếc hộp chứa lời nhắn, mục tiêu, kỷ niệm hoặc quyết định cho chính mình trong tương lai, khóa lại và chỉ có thể mở vào đúng ngày đã hẹn. Khi đến hạn, bạn mở hộp qua một nghi thức nhiều giai đoạn (rung — mở nắp — lau sương) rồi ghi lại cảm nhận.

> Toàn bộ dữ liệu lưu **cục bộ** trên máy (SQLite). Không có backend, không tài khoản, không chia sẻ đám mây.

---

## ✨ Tính năng chính

- **Tạo hộp thời gian** với 7 loại: Message, Goal, Memory, Decision, Secret, Challenge, Letter.
- **Khóa theo thời gian**: chọn ngày mở (tối thiểu hôm sau), không thể sửa nội dung sau khi khóa — chỉ có thể xóa.
- **Nghi thức mở hộp 3 giai đoạn**: hộp rung nhẹ ngẫu nhiên → mở nắp chậm trong bóng tối → vuốt lau lớp sương để lộ nội dung, kèm hiệu ứng âm thanh & haptic.
- **Mystery Teaser (F-30)**: nhập 0–3 gợi ý hé lộ dần theo thời gian trước ngày mở.
- **Prediction Before Opening (F-32)**: dự đoán trước khi mở; khóa lại read-only sau khi mở.
- **Curiosity Notifications (F-31)**: nhắc nhở local theo các mốc 30/7/1 ngày + ngày mở.
- **Post-open Reflection (F-34/F-35)**: ghi cảm nhận + đánh giá 1–5 sao sau khi mở, gợi ý tạo hộp mới.
- **Personal Stats (F-36)**: thống kê cá nhân read-only (số hộp đã tạo/đã mở/đang chờ...).
- **Bảo mật ứng dụng**: App Lock bằng PIN (SHA-256 + salt) + sinh trắc học (Face ID / vân tay).
- **Onboarding** 3 slide cho lần đầu sử dụng.

---

## 🛠 Tech Stack

| Hạng mục | Thư viện / Phiên bản |
|----------|----------------------|
| Framework | Expo SDK **54** (managed workflow) |
| Runtime | React Native **0.81.5** / React **19.1.0** |
| Ngôn ngữ | TypeScript **5.9** |
| Navigation | expo-router ~6.0.24 (file-based routing) |
| Database | expo-sqlite ~16.0.10 |
| Notifications | expo-notifications ~0.32.17 (local) |
| Animation | react-native-reanimated ~4.1.1 + react-native-worklets |
| Audio / Haptics | expo-audio, expo-haptics |
| Bảo mật | expo-crypto, expo-secure-store, expo-local-authentication |
| State | React Context + useReducer |

---

## 🚀 Bắt đầu

### Yêu cầu

- Node.js LTS
- Expo Go (trên điện thoại) hoặc trình giả lập Android/iOS

### Cài đặt & chạy

```bash
# Cài dependencies
npm install

# Khởi động dev server
npm start

# Hoặc chạy thẳng nền tảng
npm run android
npm run ios
npm run web
```

Sau khi `npm start`, quét mã QR bằng **Expo Go** để mở app trên điện thoại.

---

## 📁 Cấu trúc dự án

```
app/                 # Expo Router screens (file-based routing)
├── (tabs)/          # Home / Box List
├── create-box/      # Chọn loại hộp → form → xác nhận khóa → success
├── box/[id]/        # locked / pre-open / detail
├── settings.tsx     # App Lock, đổi PIN, sinh trắc học
├── stats.tsx        # Personal Stats
└── auth/set-pin.tsx # Đặt / đổi PIN

src/
├── types/           # Box, BoxType, BoxStatus...
├── constants/       # boxTypes, colors, spacing, typography, theme
├── components/      # BoxIcon, OpeningRitualOverlay, FogRevealOverlay, AppLockScreen...
├── db/              # database.ts (migrations), boxRepository.ts
├── services/        # notification, haptics, sound, settings, auth
├── store/           # boxStore.tsx (Context + reducer)
└── utils/           # stats.ts

design/              # Tài liệu thiết kế (screens, flows, schema, uiux)
PRD.md               # Product Requirements Document
```

---

## 🗄 Lưu trữ dữ liệu

- **SQLite** (`futureboxes.db`, DB version 6): bảng `box`, `reflection_question`, `notification_schedule`, `box_teaser`, `box_prediction`.
- **Ảnh** → `documentDirectory/box_images/<box_id>.<ext>`
- **Cài đặt app** (App Lock, onboarding) → AsyncStorage
- **PIN hash** → expo-secure-store

Trạng thái hộp (`locked` / `ready_to_open` / `opened`) được **tính toán động** trong code, không lưu cứng vào DB.

---

## 📐 Quy ước

- ID sinh bằng UUID v4 (`expo-crypto`) ở client.
- `created_at`, `opened_at` lưu ISO8601 UTC; `unlock_date` lưu 00:00 local của ngày mở.
- Tạo hộp là **một transaction** (INSERT box + reflection + notification + teaser).
- Nội dung hộp khóa chỉ ẩn ở tầng UI (không mã hóa DB).
- Validate ngày mở 2 tầng: UI + tầng data (`validateUnlockDate`).
- Mở hộp chỉ khi `now >= unlock_date`, guard ở cả UI lẫn data layer.

---

## 📄 Tài liệu liên quan

- [`PRD.md`](./PRD.md) — Product Requirements Document
- [`CLAUDE.md`](./CLAUDE.md) — Kiến trúc & quy ước chi tiết cho AI agents
- [`design/`](./design) — Screens, flows, database schema, UI/UX guides
