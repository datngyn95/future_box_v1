# Screen Descriptions — FutureBoxes

**Tài liệu thiết kế màn hình** | Phiên bản: 1.0 | Ngày: 2026-06-11 | Tác giả: agent-uiux
Nền tảng: React Native (Expo SDK 54) | Ngôn ngữ UI: Tiếng Việt

---

## Mục lục

1. [Lock Screen](#1-lock-screen--màn-hình-khóa-ứng-dụng)
2. [Set PIN Screen](#2-set-pin-screen--màn-hình-đặt-pin)
3. [Onboarding Screen](#3-onboarding-screen--màn-hình-chào-lần-đầu)
4. [Home / Box List Screen](#4-home--box-list-screen--danh-sách-hộp)
5. [Select Box Type Screen](#5-select-box-type-screen--chọn-loại-hộp)
6. [Create Box Form Screen](#6-create-box-form-screen--form-tạo-hộp)
7. [Lock Confirmation Modal](#7-lock-confirmation-modal--xác-nhận-khóa)
8. [Lock Success Screen](#8-lock-success-screen--khóa-thành-công)
9. [Locked Box Peek Screen](#9-locked-box-peek-screen--xem-hộp-đang-khóa)
10. [Pre-open Screen](#10-pre-open-screen--sẵn-sàng-mở)
11. [Opened Box Detail Screen](#11-opened-box-detail-screen--chi-tiết-hộp-đã-mở)
12. [Settings Screen](#12-settings-screen--cài-đặt)

---

## 1. Lock Screen — Màn hình khóa ứng dụng

### Mục đích

Bảo vệ quyền riêng tư của người dùng bằng cách yêu cầu xác thực mỗi khi app khởi động lạnh (cold start) hoặc quay lại từ nền sau khi vượt ngưỡng thời gian (mặc định 30–60 giây). Chỉ xuất hiện khi App Lock được bật trong Cài đặt (F-18).

### Các thành phần chính

1. **App Logo & Tên ứng dụng**
   - Mô tả: Logo FutureBoxes (icon hộp thời gian phong cách minimal) đặt ở giữa màn hình, phía trên khu vực xác thực. Bên dưới logo là tên ứng dụng "FutureBoxes" và tagline ngắn "Hộp thời gian của bạn".
   - Tương tác: Không có tương tác trực tiếp.
   - Hiệu ứng: Fade-in từ opacity 0 lên 1 trong 400ms khi màn hình xuất hiện.

2. **Biometric Prompt (tự động kích hoạt)**
   - Mô tả: Khi `biometricEnabled = true`, native biometric dialog (Face ID trên iOS, vân tay/face unlock trên Android) được tự động gọi ngay sau khi Lock Screen hiển thị. Không có UI tùy chỉnh cho phần này — dùng native OS dialog.
   - Tương tác: Người dùng xác thực bằng khuôn mặt hoặc vân tay. Nếu thất bại hoặc hủy, bàn phím PIN hiện ra.
   - Hiệu ứng: Sau khi xác thực thành công, toàn bộ Lock Screen trượt lên trên và biến mất (slide up + fade out, 300ms) để lộ nội dung app phía sau.

3. **Biometric Retry Button**
   - Mô tả: Nút icon hình vân tay (hoặc khuôn mặt tùy loại biometric của thiết bị) nằm trên bàn phím PIN, cho phép người dùng thử lại biometric sau khi đã chuyển sang PIN. Text label: "Dùng Face ID" hoặc "Dùng vân tay". Chỉ hiển thị khi `biometricEnabled = true` và thiết bị có biometric.
   - Tương tác: Nhấn để kích hoạt lại native biometric dialog.
   - Hiệu ứng: Scale nhẹ khi nhấn (scale 0.95 trong 100ms, trả về 1.0).

4. **PIN Pad**
   - Mô tả: Bàn phím nhập PIN gồm: (a) Khu vực hiển thị các chấm tròn tương ứng số chữ số PIN (4–6 chấm, chấm trống là ô chưa nhập, chấm đặc là đã nhập); (b) Bàn phím số 12 nút layout 3×4 (1–9, *, 0, nút xóa). Mỗi ô chấm PIN có kích thước 14×14 pt, khoảng cách giữa các chấm 16 pt. Mỗi nút số có vùng chạm tối thiểu 60×60 pt.
   - Tương tác: Nhấn số để điền vào ô chấm. Nhấn nút xóa (backspace icon) để xóa chữ số cuối. Khi đủ số chữ số, tự động kiểm tra PIN.
   - Hiệu ứng: Mỗi chấm trống → đặc khi nhập: animation scale từ 0.7 lên 1.0 trong 150ms với spring easing. Khi PIN sai: toàn bộ hàng chấm rung ngang (shake animation: 3 lần ±8 pt trong 400ms), sau đó các chấm xóa hết về trạng thái trống. Khi PIN đúng: các chấm đồng loạt đổi màu sang màu xanh/thành công trong 200ms, rồi màn hình trượt lên.

5. **Thông báo lỗi PIN sai**
   - Mô tả: Text nhỏ màu đỏ/cảnh báo xuất hiện ngay bên dưới hàng chấm PIN: "PIN không đúng, vui lòng thử lại." Ẩn đi sau 2 giây hoặc khi người dùng bắt đầu nhập lại.
   - Tương tác: Không có tương tác.
   - Hiệu ứng: Fade-in trong 200ms, fade-out sau 2 giây.

6. **Label hướng dẫn**
   - Mô tả: Text ở phía trên PIN pad: "Nhập PIN để mở khóa" (khi `biometricEnabled = false`) hoặc "Nhập PIN hoặc dùng biometric" (khi `biometricEnabled = true`). Font size 14pt, màu text phụ (secondary).
   - Tương tác: Không có tương tác.
   - Hiệu ứng: Không có.

### Navigation

- Đến screen này từ: App khởi động (cold start khi App Lock bật), quay lại từ background sau ngưỡng thời gian.
- Từ screen này đến: Home / Box List Screen (sau khi xác thực thành công), Pre-open Screen (nếu mở app từ notification deep link — sau khi unlock thành công thì điều hướng tới Pre-open).

### Ghi chú

- Screen này phủ toàn bộ màn hình (fullscreen overlay), không có thanh navigation, không thể dismiss bằng swipe back.
- Nếu `appLock = off`, màn hình này không bao giờ hiển thị — app vào thẳng Home.
- Khi chuyển app sang native picker (F-10) rồi quay lại, không trigger Lock Screen nếu thời gian background < ngưỡng (tránh phiền khi đang tạo hộp).
- Không có nút "Quên PIN" ở MVP — nếu quên PIN, người dùng phải gỡ cài đặt app (cảnh báo này được hiển thị rõ khi đặt PIN lần đầu).

---

## 2. Set PIN Screen — Màn hình đặt PIN

### Mục đích

Hướng dẫn người dùng đặt mã PIN 4–6 số khi lần đầu bật App Lock, và xác nhận biometric tùy chọn. Cũng được dùng khi người dùng muốn đổi PIN.

### Các thành phần chính

1. **Header**
   - Mô tả: Nút "Hủy" hoặc nút back (X) ở góc trên trái. Tiêu đề màn hình ở giữa: "Đặt PIN". Nút "Hủy" chỉ hiển thị khi đặt PIN lần đầu (người dùng có thể từ bỏ bật App Lock); không hiển thị khi đổi PIN bắt buộc.
   - Tương tác: Nhấn "Hủy" hoặc nút back để thoát và không bật App Lock.
   - Hiệu ứng: Không có.

2. **Bước indicator (Step Indicator)**
   - Mô tả: 2 chấm nhỏ nằm ngang dưới header, chỉ ra người dùng đang ở bước 1 (nhập PIN lần đầu) hay bước 2 (nhập PIN lần 2 để xác nhận). Chấm active lớn hơn và đậm màu hơn chấm inactive.
   - Tương tác: Không có tương tác.
   - Hiệu ứng: Khi chuyển từ bước 1 sang bước 2, chấm 2 animate sang trạng thái active (scale + màu).

3. **Tiêu đề hướng dẫn**
   - Mô tả: Text lớn ở giữa màn hình, trên PIN pad:
     - Bước 1: "Tạo mã PIN của bạn"
     - Bước 2: "Nhập lại mã PIN để xác nhận"
     Font size 20pt, font weight semibold.
   - Tương tác: Không có.
   - Hiệu ứng: Khi chuyển bước, text cũ trượt ra trái và text mới trượt vào từ phải (horizontal slide, 250ms).

4. **PIN Dot Display**
   - Mô tả: Hàng chấm tròn hiển thị tiến trình nhập PIN (giống Lock Screen). Hỗ trợ 4 đến 6 chấm. Số chấm mặc định là 4. Dưới hàng chấm có text nhỏ gợi ý: "Chọn 4–6 chữ số".
   - Tương tác: Không tương tác trực tiếp; phản ánh trạng thái nhập từ bàn phím số.
   - Hiệu ứng: Giống Lock Screen: spring animation khi chấm trống → đặc. Khi PIN 2 lần không khớp: shake animation + chấm xóa hết.

5. **Bàn phím số**
   - Mô tả: Bàn phím số 12 nút layout 3×4, giống Lock Screen. Nút xóa (backspace) ở vị trí dưới cùng bên phải. Vùng chạm tối thiểu 60×60 pt mỗi nút.
   - Tương tác: Nhập số, xóa số. Khi đủ số chữ số tối thiểu (4 số), nút "Tiếp theo" hoặc tự động chuyển sang bước 2.
   - Hiệu ứng: Nút số có ripple/scale nhẹ khi nhấn (scale 0.9, 100ms, spring easing).

6. **Cảnh báo quên PIN**
   - Mô tả: Text cảnh báo nhỏ màu cam/cảnh báo ở phía trên bàn phím số: "Lưu ý: Nếu quên PIN, bạn sẽ cần gỡ cài đặt lại ứng dụng và mất toàn bộ dữ liệu." Hiển thị ở bước 1 để người dùng lưu ý trước khi cam kết.
   - Tương tác: Không có.
   - Hiệu ứng: Không có.

7. **Biometric Option (chỉ xuất hiện sau bước 2 thành công)**
   - Mô tả: Sau khi 2 lần PIN khớp, nếu thiết bị có biometric, hiển thị thêm một bước thứ 3: card/modal hỏi "Dùng Face ID / Vân tay để mở khóa nhanh hơn?" với 2 nút: "Bật Face ID" và "Không, chỉ dùng PIN". Icon minh họa biometric phù hợp với loại thiết bị (Face ID hoặc fingerprint).
   - Tương tác: Chọn "Bật" → lưu `biometricEnabled = true`. Chọn "Không" → lưu `biometricEnabled = false`. Cả hai đều lưu PIN và hoàn tất quá trình đặt PIN.
   - Hiệu ứng: Card/modal biometric slide lên từ dưới (bottom sheet, 300ms ease-out).

8. **Thông báo lỗi PIN không khớp**
   - Mô tả: Text đỏ bên dưới PIN dot: "Mã PIN không khớp. Vui lòng thử lại." Xuất hiện khi bước 2 nhập sai.
   - Tương tác: Không có.
   - Hiệu ứng: Shake animation trên PIN dots + fade-in text lỗi.

### Navigation

- Đến screen này từ: Settings Screen (khi bật toggle App Lock), Settings Screen (khi chọn "Đổi PIN").
- Từ screen này đến: Settings Screen (sau khi đặt PIN thành công hoặc hủy).

### Ghi chú

- Không hiển thị PIN dưới dạng số rõ ràng tại bất kỳ thời điểm nào — luôn dùng chấm.
- PIN được hash trước khi lưu vào expo-secure-store, không lưu plaintext.
- Nếu người dùng nhấn "Hủy" ở bước 1 hoặc 2, App Lock không được bật và toggle ở Settings trở về trạng thái tắt.

---

## 3. Onboarding Screen — Màn hình chào lần đầu

### Mục đích

Chào đón người dùng mới, giải thích concept "hộp thời gian" và giá trị cốt lõi của FutureBoxes. Chỉ hiển thị một lần duy nhất khi mở app lần đầu (sau đó không hiện nữa).

### Các thành phần chính

1. **Pager / Slide Container**
   - Mô tả: ViewPager ngang gồm 3 slide. Người dùng vuốt sang phải để chuyển slide. Mỗi slide chiếm toàn bộ màn hình (fullscreen). Dưới cùng có page indicator (3 chấm) và nút điều hướng.
   - Tương tác: Vuốt ngang để chuyển slide. Nhấn nút "Tiếp theo" để sang slide sau.
   - Hiệu ứng: Horizontal scroll mượt với parallax nhẹ trên illustration (illustration di chuyển chậm hơn container 20%).

2. **Slide 1 — Concept**
   - Mô tả: Illustration lớn ở giữa màn hình: hộp thời gian đang bị khóa với ánh sáng hào quang nhẹ xung quanh. Tiêu đề lớn: "Gửi thư cho chính mình trong tương lai". Mô tả ngắn: "Khóa suy nghĩ, mục tiêu và kỷ niệm của bạn lại — chỉ bạn trong tương lai mới được đọc." Font tiêu đề 24pt bold, mô tả 15pt regular.
   - Tương tác: Không có tương tác trên illustration.
   - Hiệu ứng: Khi slide được focus, illustration có hiệu ứng float nhẹ (lên xuống ±6pt, chu kỳ 3 giây, easing sine).

3. **Slide 2 — Cách hoạt động**
   - Mô tả: Illustration 3 bước theo chiều dọc: (1) icon bút viết → "Viết nội dung"; (2) icon khóa → "Chọn ngày mở"; (3) icon hộp mở ra → "Khám phá bất ngờ". Tiêu đề: "Đơn giản, chỉ 3 bước". Mô tả ngắn cho từng bước hiển thị cạnh icon. Mỗi bước kết nối với nhau bằng đường nét đứt đơn giản.
   - Tương tác: Không có tương tác.
   - Hiệu ứng: Khi slide được focus, 3 bước lần lượt fade-in từ dưới lên (stagger 150ms mỗi item).

4. **Slide 3 — Cảm xúc**
   - Mô tả: Illustration hộp đang mở tung với hiệu ứng confetti mini xung quanh. Tiêu đề: "Mở hộp — khoảnh khắc đáng nhớ". Mô tả: "Khi đến hạn, hãy tự tặng mình một khoảnh khắc bất ngờ và suy ngẫm về hành trình đã qua."
   - Tương tác: Không có tương tác.
   - Hiệu ứng: Khi slide được focus, confetti mini xung quanh illustration chạy animation particle nhỏ trong 2 giây rồi dừng.

5. **Page Indicator (Dot Indicator)**
   - Mô tả: 3 chấm nằm ngang, nằm ở phía dưới illustration và trên nút. Chấm active lớn hơn (8×24pt, hình viên thuốc), chấm inactive nhỏ (8×8pt, hình tròn). Màu active = màu primary của app.
   - Tương tác: Nhấn chấm để nhảy tới slide tương ứng.
   - Hiệu ứng: Chấm active animate width từ 8pt lên 24pt khi được chọn (spring animation 300ms).

6. **Nút điều hướng**
   - Mô tả: Slide 1 và 2: nút "Tiếp theo" (primary button, full-width). Slide 3: nút lớn "Bắt đầu" (primary button, full-width) thay thế "Tiếp theo". Phía dưới nút "Tiếp theo" (chỉ ở slide 1 và 2) có link text nhỏ "Bỏ qua" để skip toàn bộ onboarding.
   - Tương tác: Nhấn "Tiếp theo" → chuyển sang slide tiếp. Nhấn "Bắt đầu" hoặc "Bỏ qua" → đánh dấu onboarding hoàn thành, chuyển vào Home.
   - Hiệu ứng: Nút "Tiếp theo" → "Bắt đầu": transition text cross-fade khi chuyển sang slide 3 (200ms). Nhấn nút có ripple/scale nhẹ.

### Navigation

- Đến screen này từ: App khởi động lần đầu (onboarding chưa hoàn thành).
- Từ screen này đến: Home / Box List Screen (sau khi nhấn "Bắt đầu" hoặc "Bỏ qua").

### Ghi chú

- Trạng thái "đã xem onboarding" lưu vào AsyncStorage key `onboardingCompleted = true`.
- Nếu `onboardingCompleted = true`, toàn bộ màn hình này bị skip, app vào thẳng Home (hoặc Lock Screen nếu App Lock bật).
- Không có nút back — không thể quay lại slide trước bằng back gesture của OS (onboarding là luồng tuyến tính).
- Toàn bộ 3 slide sử dụng nền gradient nhẹ nhàng (pastel) thay vì màu trắng thuần, tạo cảm giác ấm áp.

---

## 4. Home / Box List Screen — Danh sách hộp

### Mục đích

Màn hình chính của ứng dụng. Hiển thị tất cả hộp thời gian của người dùng được phân nhóm theo trạng thái, với thứ tự ưu tiên hiển thị: Sẵn sàng mở → Đang khóa → Đã mở. Đây là điểm xuất phát cho mọi luồng chính.

### Các thành phần chính

1. **App Bar / Header**
   - Mô tả: Thanh trên cùng cố định (sticky). Bên trái: logo nhỏ FutureBoxes + tên ứng dụng hoặc greeting ("Hộp của bạn"). Bên phải: nút icon tìm kiếm (magnifying glass) dẫn vào chức năng tìm kiếm/lọc (F-17), và nút icon Settings (bánh răng) dẫn vào Settings Screen. Background của header dùng màu nền chính (không trong suốt), có shadow nhẹ khi scroll.
   - Tương tác: Nhấn icon tìm kiếm → mở search bar inline hoặc chuyển sang search view. Nhấn icon Settings → chuyển sang Settings Screen.
   - Hiệu ứng: Header xuất hiện elevation/shadow khi người dùng cuộn xuống (shadow tăng dần khi scroll offset > 0).

2. **Section "Sẵn sàng mở" (ReadyToOpen)**
   - Mô tả: Section header gồm text "Sẵn sàng mở" + badge số lượng hộp (hình tròn màu đỏ/cam nổi bật, ví dụ "2"). Tiêu đề section màu đậm, font size 13pt uppercase letter-spacing rộng. Phần này nằm ở trên cùng danh sách. Mỗi card trong section này có viền/highlight màu nổi bật để phân biệt với các hộp đang khóa. Card có kích thước đầy đủ (full-width) hoặc lớn hơn các card khóa.
   - Tương tác: Nhấn vào một card → điều hướng đến Pre-open Screen của hộp đó.
   - Hiệu ứng: Section này có animation nhẹ khi hộp mới được thêm vào (slide down + fade in từ trên). Badge số lượng có animation bounce nhỏ khi xuất hiện.

3. **Card hộp "Sẵn sàng mở"**
   - Mô tả: Card nổi (elevated shadow) với: (1) Icon loại hộp bên trái (icon + background circle màu theo loại hộp — xem F-12); (2) Tiêu đề hộp (nếu có) hoặc placeholder loại hộp ("Lời nhắn", "Mục tiêu", v.v.) — font size 16pt semibold; (3) Text "Sẵn sàng để mở!" với icon mũi tên hoặc chấm nhấp nháy; (4) Ngày tạo (text phụ nhỏ); (5) Mũi tên ">" ở góc phải. Viền card dùng màu accent hoặc loại hộp để nổi bật.
   - Tương tác: Toàn bộ card là vùng nhấn. Nhấn → Pre-open Screen.
   - Hiệu ứng: Scale nhẹ khi nhấn (scale 0.98 trong 100ms, spring easing). Card có thể có pulse animation nhẹ (opacity 1.0 → 0.85 → 1.0, chu kỳ 2 giây) để thu hút chú ý.

4. **Section "Đang khóa" (Locked)**
   - Mô tả: Section header "Đang khóa" với số lượng hộp trong ngoặc. Tiêu đề nhỏ hơn section "Sẵn sàng mở". Bên dưới là danh sách các card hộp đang khóa.
   - Tương tác: Nhấn vào một card → điều hướng đến Locked Box Peek Screen.
   - Hiệu ứng: Không có animation đặc biệt cho section header.

5. **Card hộp "Đang khóa"**
   - Mô tả: Card với: (1) Icon loại hộp (khóa nhỏ overlay trên icon loại, chỉ ra trạng thái khóa); (2) Tiêu đề hoặc placeholder loại hộp; (3) Đếm ngược "Còn X ngày" — số ngày in đậm, màu primary; (4) Progress bar ngang mỏng (2pt) bên dưới đếm ngược, thể hiện % thời gian đã trôi qua (từ ngày tạo đến ngày mở); (5) Ngày mở dự kiến dưới dạng text phụ nhỏ "Mở vào dd/mm/yyyy". Card background dùng màu neutral, ít nổi bật hơn card "Sẵn sàng mở".
   - Tương tác: Nhấn → Locked Box Peek Screen.
   - Hiệu ứng: Scale nhẹ khi nhấn. Progress bar không animate liên tục (chỉ set giá trị tĩnh khi render, tránh tốn pin).

6. **Section "Đã mở" (Opened)**
   - Mô tả: Section header "Đã mở" với số lượng. Nằm cuối danh sách. Có thể có nút "Thu gọn / Xem thêm" nếu có nhiều hộp đã mở (hiển thị tối đa 3 hộp gần nhất, còn lại ẩn đi).
   - Tương tác: Nhấn vào card hộp đã mở → Opened Box Detail Screen. Nhấn "Xem thêm" → mở rộng toàn bộ section.
   - Hiệu ứng: Expand/collapse section với animation chiều cao (height animation, 300ms ease-in-out).

7. **Card hộp "Đã mở"**
   - Mô tả: Card mờ hơn (opacity thấp hơn hoặc màu background nhạt hơn) để phân biệt với các hộp chưa mở. Hiển thị: (1) Icon loại hộp không có overlay khóa; (2) Tiêu đề; (3) "Đã mở ngày dd/mm/yyyy" text phụ; (4) Nếu có câu trả lời: icon nhỏ "Có ✓" (màu xanh) hoặc "Không ✗" (màu xám) ở góc phải trên.
   - Tương tác: Nhấn → Opened Box Detail Screen (read-only).
   - Hiệu ứng: Scale nhẹ khi nhấn.

8. **FAB — Nút tạo hộp mới**
   - Mô tả: Floating Action Button (FAB) tròn ở góc dưới phải, icon dấu "+" lớn, màu primary, kích thước 56×56 pt. Có shadow nổi bật. Label "Tạo hộp" xuất hiện bên trái FAB dưới dạng text chip khi người dùng lần đầu mở app (disappears after first interaction, hoặc sau 3 giây).
   - Tương tác: Nhấn FAB → điều hướng đến Select Box Type Screen.
   - Hiệu ứng: FAB xuất hiện với scale animation từ 0 lên 1 (spring, 400ms) khi màn hình load. Khi nhấn: ripple + scale 0.9 trong 100ms. FAB ẩn khi người dùng cuộn xuống và hiện lại khi cuộn lên (animated hide/show theo scroll direction, translate Y 80pt, 200ms).

9. **Search Bar (inline, khi kích hoạt)**
   - Mô tả: Khi nhấn icon tìm kiếm trên header, header animate để hiện thêm một thanh tìm kiếm bên dưới (hoặc thay thế header title). Gồm ô input text, icon tìm kiếm bên trái, nút "X" để xóa và nút "Hủy" để đóng search. Bên dưới search bar có các chip lọc ngang (scrollable): "Tất cả", "Lời nhắn", "Mục tiêu", "Kỷ niệm", "Quyết định", "Đang khóa", "Đã mở".
   - Tương tác: Gõ text để lọc theo tiêu đề. Nhấn chip để lọc theo loại/trạng thái. Nhấn "Hủy" để đóng search, khôi phục danh sách đầy đủ.
   - Hiệu ứng: Search bar slide down vào view (height animation từ 0, 250ms ease-out). Danh sách bên dưới filter real-time khi gõ (debounce 300ms).

10. **Empty State**
    - Mô tả: Hiển thị khi không có hộp nào (lần đầu dùng app, hoặc đã xóa hết). Gồm: (1) Illustration lớn ở giữa — hộp thời gian trống, phong cách vui vẻ; (2) Tiêu đề: "Chưa có hộp nào"; (3) Mô tả ngắn: "Tạo hộp đầu tiên của bạn và gửi một thông điệp cho chính mình trong tương lai."; (4) Nút primary "Tạo hộp đầu tiên" nằm dưới mô tả (dẫn đến Select Box Type Screen). FAB vẫn hiển thị ở góc dưới phải.
    - Tương tác: Nhấn nút "Tạo hộp đầu tiên" → Select Box Type Screen.
    - Hiệu ứng: Illustration có animation float nhẹ (lên xuống ±4pt, chu kỳ 3s). Empty state fade-in khi xuất hiện (400ms).

### Navigation

- Đến screen này từ: App khởi động (sau Lock Screen hoặc Onboarding), Lock Success Screen (sau khi khóa hộp), Pre-open Screen (nút back), Opened Box Detail Screen (nút back), Settings Screen (nút back), Locked Box Peek Screen (nút back).
- Từ screen này đến: Select Box Type Screen (FAB), Pre-open Screen (tap hộp ReadyToOpen), Locked Box Peek Screen (tap hộp Locked), Opened Box Detail Screen (tap hộp Opened), Settings Screen (icon settings).

### Ghi chú

- Danh sách dùng FlatList với ảo hóa (virtualization) để xử lý đến 200+ hộp mượt 60fps (NFR-P2).
- Trạng thái hộp được tính lại (re-compute) mỗi khi app về foreground (AppState 'active') — hộp đến hạn tự chuyển nhóm mà không cần restart.
- Khi section "Sẵn sàng mở" có hộp mới (hộp vừa đến hạn), scroll tự động lên đầu danh sách.
- Phân biệt trực quan 3 nhóm: màu nền section header khác nhau, card style khác nhau theo nhóm.

---

## 5. Select Box Type Screen — Chọn loại hộp

### Mục đích

Cho người dùng chọn một trong 4 loại hộp thời gian trước khi vào form tạo hộp. Mỗi loại hộp có nhận diện visual riêng và mô tả ngắn để người dùng hiểu mình đang tạo loại gì.

### Các thành phần chính

1. **Header**
   - Mô tả: Nút back (mũi tên trái hoặc "X") ở góc trên trái để thoát về Danh sách. Tiêu đề ở giữa: "Tạo hộp mới". Không có nút action bên phải.
   - Tương tác: Nhấn nút back → quay về Home / Box List Screen.
   - Hiệu ứng: Màn hình slide-in từ phải (React Navigation default stack transition).

2. **Tiêu đề hướng dẫn**
   - Mô tả: Text lớn bên dưới header: "Bạn muốn tạo loại hộp gì?" Font size 22pt, semibold. Subtitle nhỏ hơn: "Mỗi loại hộp có câu hỏi và gợi ý riêng." Font size 14pt, màu secondary.
   - Tương tác: Không có.
   - Hiệu ứng: Không có.

3. **Grid 4 Card loại hộp (2×2)**
   - Mô tả: 4 card loại hộp sắp xếp theo grid 2 cột, mỗi card chiếm khoảng 48% chiều rộng màn hình với padding đều. Mỗi card có:
     - Background màu riêng theo loại (gradient nhẹ hoặc màu solid pastel):
       - **Lời nhắn (Message)**: màu xanh dương ấm (ví dụ #5B8DEF)
       - **Mục tiêu (Goal)**: màu xanh lá tươi (ví dụ #4CAF82)
       - **Kỷ niệm (Memory)**: màu tím nhạt/lavender (ví dụ #9B7FD4)
       - **Quyết định (Decision)**: màu cam/amber (ví dụ #F0944D)
     - Icon lớn (48×48 pt) đặc trưng cho loại hộp (ví dụ: bong bóng chat cho Message, cờ đích cho Goal, ảnh/camera cho Memory, cân bằng/scales cho Decision). Icon màu trắng trên nền màu.
     - Tên loại hộp: font size 16pt, semibold, màu trắng.
     - Mô tả ngắn 1 dòng: font size 12pt, màu trắng với opacity 0.85. Ví dụ: "Nhắn nhủ bản thân" / "Đặt và theo dõi mục tiêu" / "Lưu khoảnh khắc đáng nhớ" / "Ghi lại quyết định quan trọng".
     - Corner radius: 16pt. Height card: khoảng 140pt.
   - Tương tác: Nhấn vào card → chọn loại hộp đó và điều hướng đến Create Box Form Screen với template tương ứng được pre-fill.
   - Hiệu ứng: Khi màn hình load, 4 card stagger fade-in từ dưới lên (item 1: 0ms, item 2: 75ms, item 3: 150ms, item 4: 225ms; mỗi item: translate Y từ +20pt về 0 + fade-in, 300ms ease-out). Khi nhấn vào card: scale xuống 0.95 trong 100ms (spring) rồi navigate.

### Navigation

- Đến screen này từ: Home / Box List Screen (nhấn FAB).
- Từ screen này đến: Create Box Form Screen (sau khi chọn loại hộp), Home / Box List Screen (nhấn back).

### Ghi chú

- Không có scroll — 4 card vừa trong một màn hình.
- Không có trạng thái loading (không fetch data) — transition nhanh.
- Sau khi navigate sang Create Box Form, nếu người dùng back lại, màn hình này vẫn giữ nguyên (không reset).

---

## 6. Create Box Form Screen — Form tạo hộp

### Mục đích

Màn hình tạo hộp thời gian đầy đủ. Người dùng điền nội dung, lời nhắn khi mở, câu hỏi phản hồi, đính kèm ảnh, và chọn ngày mở. Kết thúc bằng việc nhấn "Khóa hộp" để khóa và lưu hộp.

### Các thành phần chính

1. **Header**
   - Mô tả: Nút back (X hoặc mũi tên trái) ở góc trên trái. Tiêu đề ở giữa là tên loại hộp vừa chọn (ví dụ "Hộp Lời nhắn") với icon nhỏ và màu loại hộp. Không có nút action bên phải. Background header dùng màu theo loại hộp đang tạo (tint nhẹ).
   - Tương tác: Nhấn nút back → hiện Alert xác nhận "Hủy tạo hộp? Nội dung chưa lưu sẽ bị mất." với 2 nút "Tiếp tục viết" và "Hủy bỏ". Chỉ hỏi xác nhận nếu đã nhập dữ liệu; nếu form trống thì thoát thẳng.
   - Hiệu ứng: Không có.

2. **ScrollView Container**
   - Mô tả: Toàn bộ form nằm trong ScrollView có padding bottom đủ lớn (khoảng 120pt) để tránh bị che bởi bàn phím và nút "Khóa hộp" sticky. Scroll mượt, không có snap.
   - Tương tác: Cuộn để xem toàn bộ form.
   - Hiệu ứng: Bàn phím xuất hiện → form tự scroll lên để trường đang active không bị che (KeyboardAvoidingView hoặc keyboardShouldPersistTaps).

3. **Trường Tiêu đề (Title)**
   - Mô tả: TextInput 1 dòng. Placeholder: "Tiêu đề hộp (tùy chọn)". Font size 18pt semibold. Không có border box rõ ràng — dùng underline nhẹ hoặc background tinted. Label nhỏ "TIÊU ĐỀ" phía trên input. Tối đa 80 ký tự (hiển thị đếm ký tự "X/80" góc phải khi focus).
   - Tương tác: Nhấn để focus, nhập text. Return/Next key chuyển focus xuống trường Nội dung.
   - Hiệu ứng: Underline animate từ màu neutral sang màu primary khi focus (color transition 200ms). Counter ký tự fade-in khi focus.

4. **Trường Nội dung (Content) — bắt buộc**
   - Mô tả: TextInput đa dòng (multiline). Placeholder thay đổi theo loại hộp (F-12):
     - Message: "Hôm nay mình cảm thấy..."
     - Goal: "Mục tiêu của mình là..."
     - Memory: "Khoảnh khắc này thật đặc biệt vì..."
     - Decision: "Mình đã quyết định..."
   Font size 16pt, chiều cao tối thiểu 120pt, tự mở rộng theo nội dung (auto-expand). Label "NỘI DUNG *" phía trên (dấu * màu đỏ chỉ bắt buộc). Tối đa 2000 ký tự (hiển thị đếm "X/2000" khi focus). Khi validation error: border/underline đổi sang màu đỏ, text lỗi "Nội dung là bắt buộc" xuất hiện bên dưới.
   - Tương tác: Nhập text tự do. Multiline với return key cho phép xuống dòng. Hỗ trợ paste.
   - Hiệu ứng: Chiều cao input animate mượt khi nội dung vượt quá số dòng hiện tại (animated height expand). Validation error: border flash đỏ + shake nhẹ (3 lần ±4pt, 300ms).

5. **Trường Lời nhắn khi mở (Opening Note) — F-16**
   - Mô tả: Section riêng với icon envelope/letter nhỏ. Label "LỜI NHẮN KHI MỞ" và text gợi ý nhỏ: "Điều bạn muốn nói với mình lúc mở hộp". TextInput đa dòng, placeholder: "Ví dụ: Chào bạn! Mình hy vọng bạn...". Font size 15pt. Chiều cao tối thiểu 72pt. Tối đa 500 ký tự. Có thể expand/collapse section bằng cách nhấn vào label (accordion), mặc định là mở (expanded). Icon mũi tên nhỏ ở góc phải label chỉ trạng thái collapsed/expanded.
   - Tương tác: Nhấn vào input để focus và nhập. Nhấn vào label/header section để collapse/expand.
   - Hiệu ứng: Accordion collapse/expand với height animation (300ms ease-in-out).

6. **Toggle Câu hỏi phản hồi (Reflection Question) — F-04**
   - Mô tả: Row nằm ngang gồm: icon câu hỏi (?) nhỏ, label "Thêm câu hỏi phản hồi", và Switch (Toggle) bên phải. Mặc định tắt (off). Khi bật lên, animated content area mở ra bên dưới row chứa TextInput câu hỏi.
   - Tương tác: Toggle Switch bật/tắt. Khi bật, focus tự động nhảy vào TextInput câu hỏi.
   - Hiệu ứng: Content area bên dưới toggle mở ra bằng height animation (0 → auto, 300ms ease-out). TextInput fade-in cùng lúc.

7. **TextInput Câu hỏi (chỉ hiển thị khi toggle bật)**
   - Mô tả: TextInput 1 dòng với câu hỏi mặc định theo loại hộp đã pre-fill (F-12):
     - Message: "Kết quả tốt chứ?"
     - Goal: "Bạn đã đạt mục tiêu chưa?"
     - Memory: (không có câu hỏi mặc định, placeholder: "Nhập câu hỏi của bạn")
     - Decision: "Quyết định đó đúng chứ?"
   Người dùng có thể sửa hoặc xóa toàn bộ nội dung. Text gợi ý nhỏ bên dưới: "Câu trả lời dạng Có / Không". Tối đa 200 ký tự.
   - Tương tác: Nhập và chỉnh sửa câu hỏi. Nếu để trống trước khi khóa → coi như không có câu hỏi (toggle vẫn bật nhưng không lưu câu hỏi).
   - Hiệu ứng: Không có animation riêng.

8. **Khu vực đính kèm ảnh (Photo Attachment) — F-10**
   - Mô tả: Row hoặc card nhỏ với icon camera + text "Thêm ảnh (tùy chọn)". Khi chưa có ảnh: dashed border, icon camera trung tâm. Khi đã có ảnh: hiển thị thumbnail ảnh (tỷ lệ 16:9 hoặc ảnh đầy đủ tỷ lệ, max height 200pt) với 2 nút nhỏ overlay "Đổi ảnh" và "Xóa ảnh" ở góc phải dưới thumbnail. Ảnh có corner radius 12pt.
   - Tương tác: Nhấn khu vực (khi chưa có ảnh) hoặc nút "Đổi ảnh" → hiện Action Sheet với 3 lựa chọn: "Chụp ảnh mới", "Chọn từ thư viện", "Hủy". Nhấn "Xóa ảnh" → xóa ảnh đã chọn, trở về trạng thái trống.
   - Hiệu ứng: Khi ảnh được chọn: fade-in thumbnail từ opacity 0 (300ms). Action Sheet slide up từ dưới màn hình (300ms ease-out). Nếu từ chối quyền: hiện inline banner cảnh báo (màu vàng) với text hướng dẫn và nút "Mở Cài đặt".

9. **Khu vực chọn Ngày mở — F-02 (bắt buộc)**
   - Mô tả: Section "NGÀY MỞ *" với:
     (a) **Row preset nhanh**: 4 chip nằm ngang scrollable với labels: "1 tháng", "3 tháng", "6 tháng", "1 năm". Mỗi chip có border nhẹ, khi được chọn: background màu primary, text màu trắng, có checkmark nhỏ.
     (b) **Nút "Tùy chỉnh"**: nằm cuối row preset hoặc bên dưới, dạng chip với icon lịch. Nhấn → mở Date Picker native (iOS: DatePickerIOS spinner hoặc modal; Android: DatePickerAndroid dialog). Min date = hôm nay + 1 tháng.
     (c) **Hiển thị ngày đã chọn**: sau khi chọn ngày (qua preset hoặc custom), hiển thị text nổi bật: "Sẽ mở vào **18 tháng 7, 2026**" (ngày đặc biệt, bold, màu primary). Có nút nhỏ "Đổi" bên cạnh để reset chọn lại.
     Khi validation error (chưa chọn ngày): text lỗi "Vui lòng chọn ngày mở" màu đỏ xuất hiện.
   - Tương tác: Nhấn chip preset → áp dụng ngày mở tương ứng. Nhấn "Tùy chỉnh" → mở date picker. Nhấn "Đổi" → reset về trạng thái chưa chọn.
   - Hiệu ứng: Khi chọn preset: chip animate sang trạng thái selected (background fill animation 200ms). Khi ngày được xác nhận: text "Sẽ mở vào..." fade-in từ bên dưới (200ms). Date picker iOS: slide up modal; Android: native dialog.

10. **Nút "Khóa hộp" — Sticky Bottom**
    - Mô tả: Nút primary full-width cố định ở dưới cùng màn hình (absolute position phía trên safe area bottom inset). Background màu theo loại hộp (không phải màu primary chung). Label: "Khóa hộp" với icon ổ khóa nhỏ bên trái. Khi form không hợp lệ (nội dung trống hoặc chưa chọn ngày): nút vẫn nhấn được nhưng trigger validation. Không disable hoàn toàn để tránh confusion.
    - Tương tác: Nhấn → validate form. Nếu hợp lệ → hiện Lock Confirmation Modal. Nếu không hợp lệ → scroll tới trường lỗi đầu tiên và highlight.
    - Hiệu ứng: Khi nhấn: ripple + scale nhẹ. Nền có blur/gradient effect nhẹ phía trên nút (frosted glass effect) để phân tách nút với content bên trên khi scroll. Loading spinner thay thế text khi đang xử lý lưu (sau confirm lock).

### Navigation

- Đến screen này từ: Select Box Type Screen (sau khi chọn loại hộp).
- Từ screen này đến: Lock Confirmation Modal (nhấn "Khóa hộp" và form hợp lệ), Select Box Type Screen / Home (nhấn back + confirm hủy), Action Sheet ảnh (nhấn "Thêm ảnh").

### Ghi chú

- Form không auto-save draft. Nếu người dùng thoát giữa chừng và xác nhận hủy, toàn bộ dữ liệu đã nhập mất đi.
- Keyboard avoinding: khi bàn phím xuất hiện, ScrollView cuộn để trường đang active luôn hiển thị trên bàn phím.
- Trường Tiêu đề là optional — placeholder gợi ý loại hộp sẽ được dùng làm tiêu đề hiển thị trên card khi tiêu đề trống.
- Validation chỉ kích hoạt khi nhấn "Khóa hộp", không validate real-time khi đang gõ (tránh phiền).
- Edge case: nếu copy file ảnh thất bại khi khóa hộp, hiện thông báo lỗi toast "Không lưu được ảnh. Khóa hộp không ảnh?" với 2 nút Xác nhận / Thử lại.

---

## 7. Lock Confirmation Modal — Xác nhận khóa

### Mục đích

Yêu cầu người dùng xác nhận một lần nữa trước khi khóa hộp, nhấn mạnh tính bất biến của hành động (không thể sửa nội dung sau khi khóa). Ngăn hành động vô ý.

### Các thành phần chính

1. **Modal Overlay**
   - Mô tả: Semi-transparent dark overlay (rgba(0,0,0,0.6)) phủ toàn bộ màn hình phía sau modal card. Nhấn vào overlay không dismiss modal (người dùng phải chọn rõ ràng Hủy hoặc Khóa hộp).
   - Tương tác: Không dismiss được bằng cách nhấn overlay.
   - Hiệu ứng: Overlay fade-in (opacity 0 → 0.6, 250ms). Modal card slide-up từ dưới hoặc scale-in từ tâm (scale 0.8 → 1.0 + fade-in, 300ms spring).

2. **Modal Card**
   - Mô tả: Card trắng (hoặc tinted nhẹ theo loại hộp) với corner radius 20pt, shadow lớn. Padding 24pt. Chiều rộng = màn hình − 32pt padding hai bên. Không full-height — chiều cao vừa đủ nội dung.
   - Tương tác: Không có tương tác trực tiếp trên card container.
   - Hiệu ứng: Card xuất hiện cùng overlay (xem animation ở overlay).

3. **Icon + Tiêu đề cảnh báo**
   - Mô tả: Icon ổ khóa (lock) lớn (40×40 pt) đặt ở giữa trên cùng modal, màu theo loại hộp hoặc màu primary. Phía dưới icon: tiêu đề bold "Khóa hộp này?" Font size 20pt semibold.
   - Tương tác: Không có.
   - Hiệu ứng: Không có.

4. **Nội dung cảnh báo**
   - Mô tả: Text mô tả 2–3 dòng nhấn mạnh tính không thể đảo ngược: "Sau khi khóa, bạn sẽ không thể xem hay chỉnh sửa nội dung cho đến ngày mở." Dòng tiếp: "Hẹn gặp lại vào **[dd/mm/yyyy]**." (ngày mở bold). Font size 15pt, màu secondary. Căn giữa.
   - Tương tác: Không có.
   - Hiệu ứng: Không có.

5. **Nút "Khóa hộp" (Confirm)**
   - Mô tả: Nút primary full-width trong modal. Label: "Khóa hộp". Background màu theo loại hộp (màu mạnh, không nhạt). Corner radius 12pt. Height 52pt.
   - Tương tác: Nhấn → đóng modal, bắt đầu quá trình lưu hộp (loading state trên nút), sau đó navigate sang Lock Success Screen.
   - Hiệu ứng: Khi nhấn: nút chuyển sang loading state (spinner thay text, không thể nhấn lại). Sau khi lưu thành công: modal dismiss + navigate.

6. **Nút "Hủy"**
   - Mô tả: Nút text (no background, no border) hoặc ghost button, full-width, phía dưới nút "Khóa hộp". Label: "Hủy bỏ". Màu text: secondary/muted. Height 44pt.
   - Tương tác: Nhấn → dismiss modal, quay về Create Box Form Screen (dữ liệu đã nhập vẫn còn).
   - Hiệu ứng: Modal slide-down và dismiss (300ms). Overlay fade-out.

### Navigation

- Đến screen này từ: Create Box Form Screen (nhấn "Khóa hộp" sau khi validate thành công).
- Từ screen này đến: Create Box Form Screen (nhấn "Hủy"), Lock Success Screen (nhấn "Khóa hộp" và lưu thành công).

### Ghi chú

- Modal không thể bị dismiss bằng swipe, back gesture của OS, hay nhấn vào overlay — người dùng phải chọn rõ ràng.
- Trong quá trình lưu (sau nhấn "Khóa hộp"), cả 2 nút đều bị vô hiệu hóa để tránh double-submit.
- Nếu lưu thất bại (lỗi DB): modal dismiss, toast error xuất hiện ở Create Box Form, người dùng có thể thử lại.

---

## 8. Lock Success Screen — Khóa thành công

### Mục đích

Xác nhận với người dùng rằng hộp đã được khóa thành công. Tạo cảm giác hoàn tất, kết thúc cảm xúc của hành trình tạo hộp, và thông báo ngày mở trong tương lai.

### Các thành phần chính

1. **Full-screen Celebration Container**
   - Mô tả: Màn hình fullscreen không có header. Nền dùng gradient nhẹ theo màu loại hộp vừa khóa (từ màu loại hộp ở trên xuống màu nền trắng/neutral ở dưới).
   - Tương tác: Không có tương tác trên container.
   - Hiệu ứng: Màn hình fade-in toàn bộ từ màn Lock Confirmation Modal (cross-fade 300ms).

2. **Illustration hộp đã khóa**
   - Mô tả: Illustration lớn ở giữa màn hình — hộp thời gian có ổ khóa đóng chặt, ánh hào quang nhẹ xung quanh. Icon loại hộp nhỏ hiển thị trên nắp hộp. Kích thước illustration khoảng 200×200 pt.
   - Tương tác: Không có.
   - Hiệu ứng: Khi màn hình xuất hiện, illustration có animation "lock click" — icon ổ khóa animate từ mở → đóng (rotation + scale), kèm hiệu ứng "tia sáng" nhỏ tỏa ra (burst particle effect nhẹ, 4–6 tia, fade out trong 800ms). Sau đó illustration settle với float animation nhẹ.

3. **Thông điệp thành công**
   - Mô tả: Text lớn ở giữa, bên dưới illustration: "Hộp đã được khóa!" Font size 24pt bold. Bên dưới: "Hẹn gặp lại vào" (regular) + ngày mở dạng "**18 tháng 7, 2026**" (bold, màu primary, font size 20pt). Thêm 1 dòng nhỏ bên dưới: "Hộp sẽ mở sau **37 ngày** nữa." (text phụ).
   - Tương tác: Không có.
   - Hiệu ứng: Text stagger fade-in từ dưới lên sau illustration settle (dòng 1: delay 300ms, dòng 2: delay 500ms, dòng 3: delay 700ms; mỗi dòng translate Y +10pt → 0 + fade-in, 400ms ease-out).

4. **Nút "Về trang chủ"**
   - Mô tả: Nút primary full-width ở phía dưới màn hình (với safe area bottom padding). Label: "Về trang chủ". Background màu loại hộp hoặc màu primary. Corner radius 14pt. Height 52pt.
   - Tương tác: Nhấn → navigate về Home / Box List Screen (reset navigation stack — không để người dùng back về form tạo hộp).
   - Hiệu ứng: Fade-in sau tất cả text animations (delay 900ms). Nhấn: ripple + scale.

5. **Auto-navigate countdown (tùy chọn)**
   - Mô tả: Text nhỏ bên dưới nút: "Tự động chuyển về trang chủ sau 5 giây" với progress bar mỏng đếm ngược. Người dùng có thể nhấn nút trước để đi ngay.
   - Tương tác: Không có tương tác bổ sung (nhấn nút là cách tương tác chính).
   - Hiệu ứng: Progress bar animate từ full (100%) về 0 trong 5 giây.

### Navigation

- Đến screen này từ: Lock Confirmation Modal (sau khi lưu thành công).
- Từ screen này đến: Home / Box List Screen (nhấn nút hoặc auto-navigate). Không có nút back — navigation stack được reset.

### Ghi chú

- Màn hình này thay thế Create Box Form Screen trong navigation stack (không để người dùng back về form sau khi khóa thành công).
- Không có nút back / không swipe back.
- Nếu notification permission chưa cấp: hiển thị thêm một gợi ý nhẹ dưới nút "Về trang chủ": "Bật thông báo để được nhắc khi hộp sẵn sàng mở" + nút nhỏ "Bật thông báo" → mở hệ thống xin quyền.

---

## 9. Locked Box Peek Screen — Xem hộp đang khóa

### Mục đích

Cho phép người dùng xem thông tin meta của hộp đang trong thời gian khóa (tiêu đề, loại hộp, đếm ngược, ngày mở) mà không tiết lộ bất kỳ nội dung nào. Đồng thời cung cấp tùy chọn xóa hộp.

### Các thành phần chính

1. **Header**
   - Mô tả: Nút back (mũi tên trái) ở góc trên trái. Tiêu đề ở giữa: tên hộp (nếu có) hoặc tên loại hộp. Nút icon "..." (menu) hoặc icon thùng rác ở góc phải để xóa hộp.
   - Tương tác: Nhấn back → về Home. Nhấn "..." → hiện Action Sheet với lựa chọn "Xóa hộp" (chỉ có 1 action). Nhấn icon thùng rác trực tiếp → hiện confirm dialog xóa.
   - Hiệu ứng: Màn hình slide-in từ phải (stack navigation).

2. **Box Type Badge & Illustration**
   - Mô tả: Ở phần trên màn hình (khoảng 40% chiều cao), hiển thị illustration hộp đang bị khóa. Background gradient theo màu loại hộp. Icon loại hộp lớn (64×64 pt) overlay lên hộp. Badge loại hộp (text chip nhỏ) ở góc trên của illustration area.
   - Tương tác: Không có.
   - Hiệu ứng: Illustration có float animation nhẹ (±4pt, chu kỳ 3s). Icon ổ khóa trên hộp có pulse animation nhẹ (scale 1.0 → 1.05 → 1.0, chu kỳ 2s).

3. **Đếm ngược lớn**
   - Mô tả: Số ngày còn lại hiển thị rất lớn ở giữa màn hình phần dưới illustration: "**37**" (số, font size 64pt bold) + "ngày nữa" (text nhỏ bên dưới hoặc bên cạnh, font size 16pt, màu secondary). Ngày cụ thể: "Sẽ mở vào 18 tháng 7, 2026" dưới số đếm ngược (font size 14pt, màu secondary).
   - Tương tác: Không có.
   - Hiệu ứng: Số đếm ngược không animate liên tục (static khi render). Khi màn hình xuất hiện, số animate từ scale 0.5 → 1.0 (spring, 400ms).

4. **Thông báo nội dung ẩn**
   - Mô tả: Card hoặc box text với background tinted (nhẹ), icon khóa nhỏ bên trái, text: "Nội dung hộp đang được bảo vệ đến ngày mở." Font size 14pt, màu secondary/muted. Không có preview nội dung dù 1 ký tự.
   - Tương tác: Không có.
   - Hiệu ứng: Không có animation đặc biệt.

5. **Nút xóa hộp**
   - Mô tả: Nút text hoặc ghost button (không solid background) ở phía dưới màn hình, màu đỏ/destructive. Label: "Xóa hộp" với icon thùng rác nhỏ. Hoặc đặt trong Action Sheet khi nhấn "..." trên header. Height tối thiểu 44pt.
   - Tương tác: Nhấn → hiện Alert xác nhận "Xóa hộp này?" với mô tả "Hành động này không thể hoàn tác. Nội dung sẽ bị xóa vĩnh viễn." và 2 nút: "Hủy" (cancel) và "Xóa" (destructive, màu đỏ).
   - Hiệu ứng: Alert xuất hiện với native OS alert. Sau khi xác nhận xóa: màn hình dismiss (navigate về Home), hộp biến khỏi danh sách với animation fade-out + height collapse.

6. **Progress bar thời gian**
   - Mô tả: Progress bar ngang ở phần giữa màn hình (dưới đếm ngược), chiều rộng toàn màn hình − padding, chiều cao 6pt, corner radius 3pt. Màu fill = màu loại hộp. Thể hiện % thời gian đã trôi qua từ ngày tạo đến ngày mở. Label hai đầu: ngày tạo (trái) và ngày mở (phải), font size 11pt, màu muted.
   - Tương tác: Không có.
   - Hiệu ứng: Progress bar animate fill từ 0 lên giá trị thực (400ms ease-out) khi màn hình load.

### Navigation

- Đến screen này từ: Home / Box List Screen (nhấn vào card hộp "Đang khóa").
- Từ screen này đến: Home / Box List Screen (nhấn back hoặc sau khi xóa hộp).

### Ghi chú

- Tuyệt đối không hiển thị bất kỳ nội dung, ảnh, lời nhắn, hay câu hỏi của hộp. Chỉ hiển thị metadata (tiêu đề, loại, ngày).
- Sau khi xóa hộp, notification đã lên lịch cho hộp đó bị hủy tự động (F-08).
- Nếu tiêu đề hộp trống: dùng tên loại hộp ("Hộp Lời nhắn", "Hộp Mục tiêu", v.v.) làm tiêu đề hiển thị.

---

## 10. Pre-open Screen — Sẵn sàng mở

### Mục đích

Tạo "khoảnh khắc nghi thức" trước khi người dùng mở hộp. Màn hình này tồn tại để người dùng chủ động ra quyết định mở (không tự động), tăng cảm giác mong chờ và bất ngờ. Được truy cập từ danh sách hoặc thông qua deep link từ notification.

### Các thành phần chính

1. **Header**
   - Mô tả: Nút back (mũi tên trái) ở góc trên trái. Tiêu đề ở giữa: "Hộp sẵn sàng!" hoặc tên hộp. Không có nút action phải.
   - Tương tác: Nhấn back → về Home. Người dùng có thể chọn chưa mở và quay lại.
   - Hiệu ứng: Màn hình slide-in từ phải.

2. **Illustration hộp chờ mở**
   - Mô tả: Phần trên màn hình (khoảng 45–50% chiều cao), nền gradient ấm áp (không dùng màu loại hộp — dùng gradient đặc biệt "celebration warm": vàng nhạt → cam nhạt hoặc tương tự). Illustration hộp thời gian nắp đang hé mở một chút với ánh sáng rò ra từ trong. Icon loại hộp nhỏ visible trên hộp.
   - Tương tác: Không có.
   - Hiệu ứng: Illustration có animation loop — nắp hộp hé mở nhẹ nhàng (oscillate 0° → 15°, chu kỳ 2s, easing sine) như đang "thở" và chờ được mở. Ánh sáng rò ra pulse animation (opacity 0.6 → 1.0 → 0.6, chu kỳ 2s).

3. **Thông tin hộp**
   - Mô tả: Phần dưới illustration: Badge loại hộp (chip), tiêu đề hộp (font size 20pt bold), text phụ "Được tạo vào [ngày tạo]". Nhóm thông tin này tạo context cho người dùng nhớ lại họ đã tạo hộp gì.
   - Tương tác: Không có.
   - Hiệu ứng: Fade-in stagger khi màn hình xuất hiện (delay 200ms sau illustration).

4. **Thông điệp khuyến khích**
   - Mô tả: Text ngắn truyền cảm hứng: "Đã đến lúc rồi! Hộp thời gian của bạn đang chờ." Hoặc các thông điệp ngẫu nhiên như "Bạn của quá khứ có điều muốn nói..." Font size 16pt, màu secondary, căn giữa, italic nhẹ.
   - Tương tác: Không có.
   - Hiệu ứng: Fade-in sau thông tin hộp (delay 400ms).

5. **Nút lớn "Mở hộp"**
   - Mô tả: Nút primary lớn, nổi bật nhất trên màn hình. Full-width hoặc centered với padding rộng (tối thiểu 80% chiều rộng màn hình). Height 56–60pt. Background gradient warm (không thuần solid — gradient để tạo cảm giác đặc biệt). Label: "Mở hộp" với icon animation nhỏ (icon hộp mở hoặc key). Font size 18pt semibold. Corner radius 28pt (rounded pill).
   - Tương tác: Nhấn → bắt đầu animation mở nắp (F-14), sau đó navigate sang Opened Box Detail Screen. Nút không thể nhấn 2 lần (debounce / disabled sau lần nhấn đầu).
   - Hiệu ứng: Nút có shimmer/glow animation nhẹ (gradient highlight di chuyển qua nút từ trái sang phải, chu kỳ 3s) để thu hút attention. Khi nhấn: scale 0.95 → 1.05 (spring 150ms) + vibration haptic (medium impact). Rồi transition sang animation mở nắp fullscreen.

6. **Animation mở nắp (F-14) — Fullscreen Transition**
   - Mô tả: Khi người dùng nhấn "Mở hộp", màn hình chuyển sang animation toàn màn hình:
     Giai đoạn 1 (0–500ms): Nắp hộp mở từ từ ra (rotation animation của lid, 0° → 80°).
     Giai đoạn 2 (500–1000ms): Ánh sáng/particles bùng ra từ trong hộp (burst effect, 8–12 particles, fade out nhanh).
     Giai đoạn 3 (800ms–1200ms): Nội dung hộp (content của Opened Box Detail) fade-in từ phía trong hộp lên (scale từ 0.8 lên 1.0 + fade-in).
     Toàn bộ animation chạy trên UI thread (Reanimated worklet) để đảm bảo 60fps (NFR-P3).
   - Tương tác: Không có tương tác trong thời gian animation (màn hình bị block).
   - Hiệu ứng: Như mô tả. Haptic feedback tại thời điểm nắp mở hoàn toàn (notification haptic).

### Navigation

- Đến screen này từ: Home / Box List Screen (nhấn hộp "Sẵn sàng mở"), Notification deep link (mở app từ notification).
- Từ screen này đến: Opened Box Detail Screen (nhấn "Mở hộp" → animation → navigate), Home / Box List Screen (nhấn back mà không mở).

### Ghi chú

- Nếu người dùng đến đây qua deep link notification và App Lock đang bật, phải qua Lock Screen trước, sau đó mới về Pre-open Screen của đúng hộp đó.
- Guard check thời gian (anti-cheat clock): khi nhấn "Mở hộp", app kiểm tra lại `now >= unlockDate`. Nếu không hợp lệ (người dùng tua ngược giờ) → block mở, hiện thông báo "Chưa đến thời gian mở hộp".
- Màn hình này không có chức năng xóa hộp (chỉ xem thông tin và mở).

---

## 11. Opened Box Detail Screen — Chi tiết hộp đã mở

### Mục đích

Hiển thị toàn bộ nội dung hộp sau khi đã mở: lời nhắn khi mở, nội dung gốc, ảnh đính kèm, và câu hỏi phản hồi. Cho phép người dùng trả lời câu hỏi với hiệu ứng cảm xúc tương ứng. Đây là màn hình quan trọng nhất về cảm xúc của toàn bộ app.

### Các thành phần chính

1. **Header**
   - Mô tả: Nút back (mũi tên trái) ở góc trên trái. Tiêu đề ở giữa: tên hộp hoặc loại hộp. Background header trong suốt (transparent) khi scroll ở đầu, chuyển sang màu nền khi scroll xuống (animated opacity).
   - Tương tác: Nhấn back → về Home / Box List Screen.
   - Hiệu ứng: Header background fade-in khi scroll offset > 60pt.

2. **ScrollView Container**
   - Mô tả: Toàn bộ nội dung trong ScrollView. Phần trên cùng có hero area với gradient background theo loại hộp (chiều cao ~200pt), dần fade sang màu nền chính khi scroll.
   - Tương tác: Cuộn tự do.
   - Hiệu ứng: Hero gradient parallax nhẹ khi scroll (gradient di chuyển chậm hơn content 20%).

3. **Opening Note Card (Lời nhắn khi mở) — F-16**
   - Mô tả: Card nổi (elevated shadow, corner radius 16pt) xuất hiện ở đầu màn hình, ngay sau hero area. Background màu warm/cream hoặc tinted nhẹ theo loại hộp. Icon envelope nhỏ ở góc trên trái card. Label nhỏ "LỜI NHẮN KHI MỞ" dạng uppercase. Nội dung lời nhắn in italic (font size 15pt). Thời gian "Gửi lúc [ngày tạo hộp]" ở dưới cùng card (text phụ nhỏ).
   - Tương tác: Không có tương tác.
   - Hiệu ứng: Card này xuất hiện với animation đặc biệt — fade-in + slight scale up (0.95 → 1.0, 500ms ease-out) sau khi animation mở nắp hoàn tất. Như thể card "bay ra" từ trong hộp.
   - Edge case: Nếu không có lời nhắn khi mở → ẩn hoàn toàn section này (không hiển thị card trống).

4. **Box Info Header**
   - Mô tả: Nằm dưới Opening Note: Badge loại hộp (chip màu), tiêu đề hộp (font size 18pt bold). Dòng meta phụ: "Tạo ngày [ngày tạo] · Mở ngày [ngày mở thực tế]". Font size 12pt, màu muted.
   - Tương tác: Không có.
   - Hiệu ứng: Fade-in sau Opening Note Card (delay 200ms).

5. **Nội dung gốc (Original Content)**
   - Mô tả: Section "NỘI DUNG GỐC" (uppercase, font 11pt, màu muted). Bên dưới: Text nội dung hộp (font size 16pt, regular, line-height 1.6). Không có giới hạn chiều cao — hiển thị toàn bộ nội dung. Background nhẹ (card hoặc section divider).
   - Tương tác: Có thể long-press để copy text (native text selection).
   - Hiệu ứng: Fade-in stagger tiếp nối (delay 400ms).

6. **Ảnh đính kèm**
   - Mô tả: Nếu có ảnh, hiển thị bên dưới nội dung text: ảnh full-width với corner radius 12pt, tỷ lệ gốc (không crop), chiều cao tối đa 300pt. Nhấn ảnh → mở lightbox fullscreen.
   - Tương tác: Nhấn → lightbox fullscreen với pinch-to-zoom. Swipe down để đóng lightbox.
   - Hiệu ứng: Ảnh fade-in khi load (skeleton placeholder trắng trong khi load). Lightbox: shared element transition (ảnh "phóng to" từ vị trí trong scroll lên fullscreen, 300ms spring).
   - Edge case: Nếu `image_path` không tồn tại trong file system → hiển thị placeholder "Ảnh không khả dụng" với icon hình ảnh bị vỡ và text giải thích (không crash).

7. **Section câu hỏi phản hồi + nút trả lời — F-07**
   - Mô tả: Section "CÂU HỎI" (uppercase, font 11pt). Card chứa:
     (a) Text câu hỏi (font size 17pt semibold, căn giữa).
     (b) 2 nút trả lời nằm ngang: nút "Có" (primary, màu xanh lá/green, icon check + text) và nút "Không" (secondary outline, màu đỏ nhạt, icon X + text). Mỗi nút rộng khoảng 45% màn hình, height 52pt, corner radius 14pt. Vùng chạm tối thiểu 44pt.
     (c) Dưới 2 nút: link text nhỏ "Bỏ qua" căn giữa.
     Nếu đã trả lời trước đó: thay thế 2 nút bằng badge kết quả ("Bạn đã trả lời: **Có** ✓" hoặc "**Không**") + nút nhỏ "Đổi câu trả lời".
   - Tương tác: Nhấn "Có" → kích hoạt confetti + thông điệp chúc mừng. Nhấn "Không" → hiện thông điệp đồng cảm. Nhấn "Bỏ qua" → ẩn section câu hỏi (nhưng vẫn có thể scroll xuống tìm lại). Nhấn "Đổi câu trả lời" (ở màn xem lại) → hiện lại 2 nút.
   - Hiệu ứng: Khi nhấn nút "Có": nút scale up nhẹ (1.0 → 1.05 → 1.0, 200ms) + confetti toàn màn hình. Khi nhấn "Không": nút scale tương tự. Sau khi chọn, 2 nút animate ra (fade-out) và badge kết quả animate vào (fade-in + scale-in, 300ms).
   - Edge case: Nếu hộp không có câu hỏi → ẩn hoàn toàn section này.

8. **Confetti Overlay (khi trả lời "Có") — F-07**
   - Mô tả: Khi người dùng nhấn "Có", hiệu ứng confetti toàn màn hình xuất hiện: 50–80 particles đủ màu sắc (sử dụng Lottie animation hoặc custom confetti component với React Native Reanimated) rơi từ trên xuống trong 3 giây. Phía trên confetti (không bị che): modal/toast "Tuyệt vời! Bạn đã làm được rồi!" hoặc thông điệp tích cực ngẫu nhiên theo loại hộp. Modal này có background semi-transparent, corner radius, và nút "Đóng" nhỏ.
   - Tương tác: Nhấn vào bất kỳ đâu hoặc nhấn "Đóng" → dismiss confetti.
   - Hiệu ứng: Confetti particles: rơi với gravity + slight rotation + random x-velocity. Fade-out nhẹ ở 2.5–3s. Thông điệp chúc mừng: scale-in từ tâm (scale 0.5 → 1.0, spring 400ms, delay 200ms sau confetti bắt đầu).

9. **Thông điệp đồng cảm (khi trả lời "Không")**
   - Mô tả: Sau khi nhấn "Không", hiện một card/toast với icon trái tim và thông điệp đồng cảm theo loại hộp:
     - Goal: "Không sao cả! Hành trình quan trọng hơn đích đến. Hãy thử lại."
     - Decision: "Mỗi quyết định đều là bài học. Bạn đã dũng cảm hơn rồi đó."
     - Message: "Mọi thứ sẽ tốt hơn. Tạo một hộp mới để ghi lại bước tiếp theo nhé."
   Card có nút nhỏ "Tạo hộp mới" (dẫn về Select Box Type Screen).
   - Tương tác: Nhấn "Tạo hộp mới" → navigate về Select Box Type Screen.
   - Hiệu ứng: Card slide-up từ dưới (300ms ease-out, delay 200ms sau khi nhấn nút).

### Navigation

- Đến screen này từ: Pre-open Screen (sau animation mở nắp), Home / Box List Screen (nhấn hộp "Đã mở" để xem lại).
- Từ screen này đến: Home / Box List Screen (nhấn back), Select Box Type Screen (nhấn "Tạo hộp mới" trong thông điệp đồng cảm).

### Ghi chú

- Màn hình này là read-only với nội dung gốc: không thể chỉnh sửa text, tiêu đề, câu hỏi hay ảnh.
- Câu trả lời (Có/Không) có thể được cập nhật lại (đổi ý) — nhấn "Đổi câu trả lời". Confetti chỉ chạy khi chọn "Có", không chạy lại khi đổi từ "Không" về "Có" ở màn xem lại (chỉ chạy lần đầu trả lời).
- Nếu mở màn hình này từ danh sách (hộp đã mở trước đó), Opening Note Card và confetti không tự động chạy lại — chỉ hiển thị kết quả tĩnh.
- Hộp không có câu hỏi: section câu hỏi hoàn toàn không xuất hiện.
- Hộp đã trả lời (xem lại): hiện badge kết quả thay vì 2 nút.

---

## 12. Settings Screen — Cài đặt

### Mục đích

Cho phép người dùng quản lý cài đặt ứng dụng, chủ yếu là bật/tắt App Lock và đặt lại PIN. Màn hình đơn giản, ít items ở MVP.

### Các thành phần chính

1. **Header**
   - Mô tả: Nút back (mũi tên trái) ở góc trên trái. Tiêu đề ở giữa: "Cài đặt". Không có nút action phải.
   - Tương tác: Nhấn back → về Home / Box List Screen.
   - Hiệu ứng: Màn hình slide-in từ phải.

2. **Section "Bảo mật"**
   - Mô tả: Section header "BẢO MẬT" (uppercase, font 11pt, màu muted, letter-spacing rộng). Chứa các rows cài đặt liên quan App Lock.
   - Tương tác: Không tương tác trực tiếp với section header.
   - Hiệu ứng: Không có.

3. **Row "Khóa ứng dụng" (App Lock Toggle) — F-18**
   - Mô tả: Row đầy đủ chiều rộng. Bên trái: icon ổ khóa nhỏ + label "Khóa ứng dụng". Mô tả nhỏ bên dưới label: "Yêu cầu PIN / Face ID khi mở ứng dụng". Bên phải: Switch (Toggle) on/off. Height row: khoảng 64pt.
   - Tương tác:
     - Khi **tắt → bật** (App Lock chưa được bật): chuyển sang Set PIN Screen để thiết lập PIN.
     - Khi **bật → tắt** (App Lock đang bật): hiện Alert xác nhận "Tắt khóa ứng dụng?" với mô tả "Bạn sẽ cần xác thực để tắt." Sau đó yêu cầu xác thực biometric/PIN. Nếu xác thực thành công → tắt App Lock, xóa PIN khỏi secure store. Nếu thất bại → giữ nguyên bật, toggle trở về trạng thái on.
   - Hiệu ứng: Toggle Switch animate on/off (native Switch animation). Khi bật thành công (sau Set PIN Screen): toggle animate sang on với bounce nhẹ.

4. **Row "Đổi PIN" (Change PIN)**
   - Mô tả: Chỉ hiển thị khi App Lock đang bật (`appLock = on`). Row bên trái: icon key nhỏ + label "Đổi mã PIN". Không có element bên phải ngoài mũi tên chevron. Khi App Lock tắt, row này ẩn (animated height collapse).
   - Tương tác: Nhấn → hiện Alert "Đổi PIN?", yêu cầu xác thực PIN/biometric hiện tại, sau đó điều hướng đến Set PIN Screen.
   - Hiệu ứng: Row fade-in + height expand khi App Lock được bật (300ms ease-out). Row fade-out + height collapse khi App Lock tắt.

5. **Row "Dùng Face ID / Vân tay" (Biometric Toggle)**
   - Mô tả: Chỉ hiển thị khi App Lock bật VÀ thiết bị có biometric. Row: icon biometric + label "Dùng Face ID" (hoặc "Vân tay" tùy thiết bị). Mô tả nhỏ: "Mở khóa nhanh bằng sinh trắc học". Toggle on/off bên phải.
   - Tương tác: Toggle bật biometric → lưu `biometricEnabled = true`. Toggle tắt → lưu `biometricEnabled = false`. Khi bật lần đầu, có thể trigger test biometric để xác nhận khả dụng.
   - Hiệu ứng: Toggle animate native. Row fade-in/out tương tự row "Đổi PIN".

6. **Section "Thông tin ứng dụng"**
   - Mô tả: Section header "VỀ ỨNG DỤNG". Chứa: Row "Phiên bản" với version number bên phải (text muted, ví dụ "1.0.0"). Không có tương tác.
   - Tương tác: Không có tương tác (hoặc long-press vào version number → copy vào clipboard, hidden feature cho debugging).
   - Hiệu ứng: Không có.

7. **Footer**
   - Mô tả: Text nhỏ ở cuối trang: "FutureBoxes — Hộp thời gian của riêng bạn." Màu muted, căn giữa. Không có tương tác.
   - Tương tác: Không có.
   - Hiệu ứng: Không có.

### Navigation

- Đến screen này từ: Home / Box List Screen (nhấn icon Settings trên header).
- Từ screen này đến: Set PIN Screen (toggle App Lock bật / nhấn Đổi PIN), Home / Box List Screen (nhấn back).

### Ghi chú

- Settings Screen ở MVP rất đơn giản. Không có cài đặt theme, ngôn ngữ, hay backup ở giai đoạn này.
- Toggle App Lock không thay đổi ngay lập tức nếu cần xác thực — phải đợi xác thực thành công mới đổi state.
- Khi quay lại Settings sau khi từ Set PIN Screen (đặt PIN thành công): toggle App Lock hiển thị trạng thái "on" mới bật.
- Edge case: Nếu thiết bị không có biometric, row "Dùng Face ID / Vân tay" hoàn toàn không xuất hiện.

---

*Hết tài liệu Screen Descriptions v1.0.*
*Tác giả: agent-uiux | Dự án: FutureBoxes | Ngày: 2026-06-11*
