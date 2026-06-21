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

### 📋 Danh sách tính năng chi tiết (F-01 → F-29)

#### Cốt lõi MVP — Must / Should have (F-01 → F-19)

| Mã | Tính năng | Mô tả |
|----|-----------|-------|
| **F-01** | Tạo hộp thời gian | Tạo hộp với tiêu đề, nội dung text, chọn loại hộp, ngày mở. |
| **F-02** | Chọn ngày mở (unlock date) | Date picker chỉ cho chọn từ ngày mai trở đi; preset nhanh: 1 ngày, 2 ngày, 1 tháng, 3 tháng, 6 tháng, 1 năm. |
| **F-03** | Khóa hộp & ẩn nội dung | Sau khi tạo, nội dung bị ẩn hoàn toàn cho đến ngày mở — core feature. |
| **F-04** | Câu hỏi phản hồi | Tùy chọn thêm 1 câu hỏi Yes/No (vd "Kết quả tốt chứ?", "Đã giảm cân chưa?"). |
| **F-05** | Danh sách hộp | Màn hình chính nhóm hộp: Đang khóa, Sẵn sàng mở, Đã mở, kèm đếm ngược. |
| **F-06** | Mở hộp khi đến hạn | Khi qua ngày mở, hộp chuyển "Sẵn sàng mở"; người dùng thực hiện mở (có hiệu ứng). |
| **F-07** | Trả lời câu hỏi & hiệu ứng cảm xúc | Sau khi mở hiển thị nội dung + câu hỏi; chọn Yes kích hoạt confetti/chúc mừng. |
| **F-08** | Local notification khi đến hạn | Đẩy thông báo cục bộ vào ngày mở ("Một hộp thời gian đã sẵn sàng mở!"). |
| **F-09** | Lưu trữ cục bộ (offline-first) | Toàn bộ hộp lưu trên thiết bị, hoạt động không cần mạng. |
| **F-10** | Đính kèm ảnh (hộp Kỷ niệm) | Chọn/chụp 1 ảnh đính kèm hộp, ẩn cùng nội dung đến ngày mở. |
| **F-11** | Xem chi tiết hộp đã mở | Xem lại nội dung gốc, ảnh, câu hỏi và câu trả lời đã chọn. |
| **F-12** | Bộ loại hộp với template | Mỗi loại có icon, màu, gợi ý câu hỏi mặc định, placeholder riêng. |
| **F-13** | Đếm ngược trực quan | Hiển thị "còn X ngày" / progress bar trên mỗi hộp khóa. |
| **F-14** | Hiệu ứng mở hộp (animation) | Animation "mở nắp hộp" khi mở, tăng cảm giác bất ngờ. |
| **F-15** | Xóa hộp đang khóa | Cho xóa hộp đã khóa; không cho sửa tiêu đề/nội dung/ảnh/ngày/câu hỏi sau khi khóa. |
| **F-16** | Lời nhắn khi mở (opening note) | Trường "lời nhắn cho lúc mở", hiển thị ngay đầu màn hình khi mở. |
| **F-17** | Tìm kiếm & lọc hộp | Lọc theo loại, trạng thái, ngày; tìm theo tiêu đề. |
| **F-18** | Bảo vệ ứng dụng (App Lock) | Khóa app bằng PIN / sinh trắc học (Face ID / vân tay). |
| **F-19** | Onboarding & empty state | Hướng dẫn lần đầu; empty state truyền cảm hứng tạo hộp. |

#### Mở rộng — Could have (F-20 → F-25)

| Mã | Tính năng | Mô tả |
|----|-----------|-------|
| **F-20** | Chính sách "khóa cứng" tùy chọn | Người dùng chọn cấm sửa/xóa sau khi khóa để giữ tính toàn vẹn trải nghiệm. |
| **F-21** | Nhiều ảnh / voice note | Đính kèm nhiều ảnh hoặc ghi âm giọng nói vào hộp. |
| **F-22** | Câu hỏi dạng thang điểm | Ngoài Yes/No, hỗ trợ thang 1–5 sao / mức độ hài lòng. |
| **F-23** | Thống kê & insight cá nhân | "Bạn đã đạt 7/10 mục tiêu", biểu đồ cảm xúc theo thời gian. |
| **F-24** | Tùy biến giao diện (theme) | Chọn theme màu / dark mode. |
| **F-25** | Backup / Export dữ liệu cục bộ | Xuất/nhập file backup để chuyển thiết bị mà không cần cloud. |

#### Ngoài phạm vi — Won't have (v1) (F-26 → F-29)

| Mã | Tính năng | Lý do |
|----|-----------|-------|
| **F-26** | Tài khoản & đồng bộ cloud đa thiết bị | Tăng độ phức tạp (backend, auth); MVP offline-first single-device. Cân nhắc v2. |
| **F-27** | Gửi hộp cho người khác / chia sẻ xã hội | Ý tưởng cốt lõi là "gửi cho chính mình"; chia sẻ làm loãng định vị sản phẩm. |
| **F-28** | Mở hộp sớm (unlock trả phí) | Phá vỡ tính toàn vẹn của trải nghiệm "khóa thời gian". |
| **F-29** | Gửi qua email/SMS thực tế trong tương lai | Khác mô hình; cần hạ tầng gửi tin nhắn, ngoài phạm vi MVP. |

> Các tính năng V1 nâng cao (F-30 → F-37) được tóm tắt ở phần đầu mục này và mô tả chi tiết trong [`PRD.md`](./PRD.md).

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
