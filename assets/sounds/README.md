# Âm thanh hiệu ứng mở hộp

Đặt 3 file âm thanh vào thư mục này rồi bỏ comment dòng `require` tương ứng trong
`src/services/soundService.ts`. Khung phát (expo-audio) đã dựng sẵn — không cần sửa
chỗ gọi.

| Tên key | File gợi ý | Giai đoạn | Mô tả |
|---------|-----------|-----------|-------|
| `knock` | `knock.mp3` | GĐ1 trước khi mở | Tiếng gõ "cốc… cốc…", ngắn, gọn (~0.3s) |
| `creak` | `creak.mp3` | GĐ2 lúc mở | Tiếng kẹt cửa gỗ cũ "kẹtttt", dài ~2.5–3s |
| `wind`  | `wind.mp3`  | GĐ3 sau khi mở | Gió rít nhẹ, có thể loop liền mạch (seamless) |

## Yêu cầu kỹ thuật
- Định dạng: `.mp3` (khuyến nghị) hoặc `.wav`/`.m4a`.
- Dung lượng nhỏ (vài chục KB–vài trăm KB) để bundle gọn.
- `wind.mp3` nên cắt loop liền mạch để không bị "khựng" khi lặp.
- Nguồn: dùng âm thanh royalty-free / có bản quyền hợp lệ (vd: freesound.org CC0).

## Cách bật
Trong `src/services/soundService.ts`, bỏ comment:
```ts
const SOUND_SOURCES = {
  knock: require('../../assets/sounds/knock.mp3'),
  creak: require('../../assets/sounds/creak.mp3'),
  wind:  require('../../assets/sounds/wind.mp3'),
};
```
