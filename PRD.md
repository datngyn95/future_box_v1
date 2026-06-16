# PRD - FutureBoxes

**Product Requirements Document**
Phiên bản: 1.1 | Ngày: 2026-06-11 | Tác giả: agent-ba
Nền tảng: React Native (iOS & Android) | Trạng thái: **Đã xác nhận ✓**

---

## Mục lục

1. [Executive Summary](#1-executive-summary)
2. [Personas & Use Cases cốt lõi](#2-personas--use-cases-cốt-lõi)
3. [Feature Table (MoSCoW)](#3-feature-table-moscow)
4. [Acceptance Criteria chi tiết](#4-acceptance-criteria-chi-tiết)
5. [Non-functional Requirements](#5-non-functional-requirements)
6. [Assumptions & Constraints](#6-assumptions--constraints)
7. [Câu hỏi mở cần người dùng xác nhận](#7-câu-hỏi-mở-cần-người-dùng-xác-nhận)

---

## 1. Executive Summary

### 1.1. Tầm nhìn sản phẩm

**FutureBoxes** là ứng dụng mobile đa nền tảng cho phép người dùng "gửi tin nhắn cho chính mình trong tương lai". Người dùng tạo những **hộp thời gian** (time capsule) chứa suy nghĩ, cảm xúc, kỷ niệm, mục tiêu hoặc quyết định, rồi **khóa lại**. Nội dung hộp bị **ẩn hoàn toàn** cho đến đúng ngày mở đã chọn. Khi hộp mở, người dùng đối thoại với "chính mình của quá khứ", trả lời câu hỏi đã đặt ra và nhận được những **khoảnh khắc cảm xúc** (hiệu ứng chúc mừng, hồi tưởng).

Sản phẩm khai thác cảm giác **mong chờ**, **bất ngờ** và **tự phản tư** - biến việc viết nhật ký thành một trải nghiệm có yếu tố thời gian và cảm xúc.

### 1.2. Vấn đề giải quyết

- Con người hay quên cảm xúc, mục tiêu và lý do đằng sau quyết định của mình.
- Việc tự nhìn lại bản thân theo thời gian thiếu một công cụ trực quan, giàu cảm xúc.
- Nhật ký truyền thống không tạo được sự mong chờ hay cơ chế "đối chiếu kỳ vọng vs thực tế".

### 1.3. Giá trị cốt lõi (Core Value)

| Trụ cột | Mô tả |
|---------|-------|
| **Khóa thời gian** | Nội dung không thể xem trước ngày mở - tạo sự mong chờ và toàn vẹn của trải nghiệm. |
| **Đối thoại quá khứ - tương lai** | Người dùng quá khứ đặt câu hỏi, người dùng tương lai trả lời và đối chiếu. |
| **Cảm xúc rõ ràng** | UI đẹp, hiệu ứng mở hộp, hiệu ứng chúc mừng (confetti) khi đạt kỳ vọng. |

### 1.4. Metrics đo lường thành công (Success Metrics)

| Metric | Mục tiêu giai đoạn đầu (MVP, 3 tháng) |
|--------|----------------------------------------|
| Số hộp được tạo / người dùng hoạt động / tháng | ≥ 2 |
| Tỷ lệ hộp được mở khi đến hạn (open rate) | ≥ 60% |
| Tỷ lệ hộp được trả lời câu hỏi sau khi mở | ≥ 40% |
| D7 Retention (quay lại sau 7 ngày) | ≥ 25% |
| Crash-free sessions | ≥ 99.5% |

### 1.5. Phạm vi MVP

MVP tập trung vào **trải nghiệm offline-first, single-device**: tạo hộp - khóa - thông báo khi đến hạn - mở hộp - trả lời câu hỏi - hiệu ứng cảm xúc. Đồng bộ cloud, tài khoản và chia sẻ là giai đoạn sau.

---

## 2. Personas & Use Cases cốt lõi

### 2.1. Persona chính

- **"Người tự phản tư"** (18-35 tuổi): sinh viên, người đi làm trẻ, thích viết nhật ký, đặt mục tiêu, quan tâm phát triển bản thân và lưu giữ kỷ niệm.

### 2.2. Bốn use case nền tảng (rút ra từ ideas.txt)

Bốn use case này được trừu tượhóa thành **các "loại hộp" (Box Type)** chia sẻ chung một khung "khóa - mở - phản hồi":

| # | Loại hộp | Ví dụ từ ý tưởng | Yếu tố đặc trưng |
|---|----------|------------------|------------------|
| UC1 | **Lời nhắn cảm xúc** (Message) | "Đang ôn thi ngập đầu. Hy vọng kết quả tốt" - mở sau 1 tuần, hỏi "Kết quả tốt chứ?" (Yes/No) | Text + câu hỏi Yes/No + confetti khi Yes |
| UC2 | **Mục tiêu** (Goal) | "Giảm cân trong 1 tháng" - mở sau 1 tháng, hỏi "Đã giảm cân chưa?" | Text + câu hỏi đạt/chưa đạt mục tiêu |
| UC3 | **Kỷ niệm** (Memory) | Lưu ảnh + ghi chú khoảnh khắc đáng nhớ + lời nhắn, chọn ngày mở | Ảnh đính kèm + ghi chú |
| UC4 | **Nhật ký quyết định** (Decision) | "Chuyển việc?" - mở sau 1 tháng/1 năm để đánh giá đúng/sai | Mô tả quyết định + đánh giá đúng/sai khi mở |

> **Insight thiết kế:** Cả 4 use case đều là biến thể của một thực thể chung **"Box"** với một trường `boxType` và một **câu hỏi phản hồi (reflection question)** tùy chọn. Điều này cho phép kiến trúc đơn giản, dễ mở rộng thêm loại hộp mới.

---

## 3. Feature Table (MoSCoW)

Ký hiệu phụ thuộc: `F-x` nghĩa là tính năng phụ thuộc vào F-x.

### 3.1. Must have (bắt buộc cho MVP)

| ID | Tính năng | Mô tả ngắn | Phụ thuộc |
|----|-----------|------------|-----------|
| **F-01** | Tạo hộp thời gian | Tạo hộp với tiêu đề, nội dung text, chọn loại hộp (Message/Goal/Memory/Decision), ngày mở. | - |
| **F-02** | Chọn ngày mở (unlock date) | Date/time picker, chỉ cho phép ngày trong tương lai; có preset nhanh (1 tuần, 1 tháng, 1 năm). | F-01 |
| **F-03** | Khóa hộp & ẩn nội dung | Sau khi tạo, nội dung bị ẩn hoàn toàn cho đến ngày mở. Đây là core feature. | F-01, F-02 |
| **F-04** | Câu hỏi phản hồi (reflection question) | Khi tạo hộp, tùy chọn thêm 1 câu hỏi Yes/No (vd "Kết quả tốt chứ?", "Đã giảm cân chưa?", "Quyết định đúng chứ?"). | F-01 |
| **F-05** | Danh sách hộp (Locked/Open/Opened) | Màn hình chính hiển thị hộp theo nhóm: Đang khóa, Sẵn sàng mở, Đã mở. Có đếm ngược thời gian. | F-03 |
| **F-06** | Mở hộp khi đến hạn | Khi đến/qua ngày mở, hộp chuyển sang trạng thái "Sẵn sàng mở"; người dùng thực hiện hành động mở (có hiệu ứng). | F-03, F-05 |
| **F-07** | Trả lời câu hỏi & hiệu ứng cảm xúc | Sau khi mở, hiển thị nội dung gốc + câu hỏi; người dùng chọn Yes/No; chọn Yes (kết quả tích cực) kích hoạt hiệu ứng confetti/chúc mừng. | F-06, F-04 |
| **F-08** | Local notification khi đến hạn | Đẩy thông báo cục bộ vào ngày mở hộp ("Một hộp thời gian đã sẵn sàng mở!"). | F-03 |
| **F-09** | Lưu trữ cục bộ (offline-first) | Toàn bộ hộp lưu trên thiết bị, hoạt động không cần mạng. | F-01 |
| **F-10** | Đính kèm ảnh (cho hộp Kỷ niệm) | Cho phép chọn 1 ảnh từ thư viện/chụp mới đính kèm hộp, ẩn cùng nội dung đến ngày mở. | F-01, F-03 |
| **F-11** | Xem chi tiết hộp đã mở | Xem lại nội dung gốc, ảnh, câu hỏi và câu trả lời đã chọn của hộp đã mở. | F-07 |

### 3.2. Should have (nên có, ưu tiên sau Must)

| ID | Tính năng | Mô tả ngắn | Phụ thuộc |
|----|-----------|------------|-----------|
| **F-12** | Bộ loại hộp với template | Mỗi boxType có icon, màu, gợi ý câu hỏi mặc định, placeholder nội dung riêng. | F-01, F-04 |
| **F-13** | Đếm ngược trực quan | Hiển thị "còn X ngày" / progress bar trên mỗi hộp khóa. | F-05 |
| **F-14** | Hiệu ứng mở hộp (animation) | Animation "mở nắp hộp" khi người dùng mở, tăng cảm giác bất ngờ. | F-06 |
| **F-15** | Chỉnh sửa / xóa hộp đang khóa | Cho phép sửa hoặc xóa hộp **trước** khi khóa hoàn toàn hoặc theo policy (xem F-20). | F-01 |
| **F-16** | Lời nhắn khi mở (opening note) | Trường text riêng "lời nhắn cho lúc mở", hiển thị ngay đầu màn hình khi hộp mở. | F-01 |
| **F-17** | Tìm kiếm & lọc hộp | Lọc theo loại, trạng thái, ngày; tìm theo tiêu đề. | F-05 |
| **F-18** | Bảo vệ ứng dụng (App Lock) | Khóa app bằng PIN/biometric (Face ID/vân tay) vì nội dung riêng tư. | F-09 |
| **F-19** | Onboarding & màn hình rỗng (empty state) | Hướng dẫn lần đầu, empty state truyền cảm hứng tạo hộp. | - |

### 3.3. Could have (có thể có, nếu còn nguồn lực)

| ID | Tính năng | Mô tả ngắn | Phụ thuộc |
|----|-----------|------------|-----------|
| **F-20** | Chính sách "khóa cứng" tùy chọn | Người dùng chọn cấm sửa/xóa sau khi khóa để giữ tính toàn vẹn của trải nghiệm. | F-15 |
| **F-21** | Nhiều ảnh / đính kèm voice note | Đính kèm nhiều ảnh hoặc ghi âm giọng nói vào hộp. | F-10 |
| **F-22** | Câu hỏi phản hồi dạng thang điểm | Ngoài Yes/No, hỗ trợ thang 1-5 sao / mức độ hài lòng. | F-04 |
| **F-23** | Thống kê & insight cá nhân | "Bạn đã đạt 7/10 mục tiêu", biểu đồ cảm xúc theo thời gian. | F-07 |
| **F-24** | Tùy biến giao diện (theme) | Chọn theme màu / dark mode. | - |
| **F-25** | Backup/Export dữ liệu cục bộ | Xuất/nhập file backup để chuyển thiết bị mà không cần cloud. | F-09 |

### 3.4. Won't have (ngoài phạm vi phiên bản này)

| ID | Tính năng | Lý do |
|----|-----------|-------|
| **F-26** | Tài khoản & đồng bộ cloud đa thiết bị | Tăng độ phức tạp (backend, auth); MVP là offline-first single-device. Cân nhắc v2. |
| **F-27** | Gửi hộp cho người khác / chia sẻ xã hội | Ý tưởng cốt lõi là "gửi cho chính mình"; chia sẻ làm loãng định vị sản phẩm. |
| **F-28** | Mở hộp sớm (unlock trả phí) | Phá vỡ tính toàn vẹn của trải nghiệm "khóa thời gian". |
| **F-29** | Gửi qua email/SMS thực tế trong tương lai | Khác mô hình; cần hạ tầng gửi tin nhắn, ngoài phạm vi MVP. |

---

## 4. Acceptance Criteria chi tiết

> Format: Given (bối cảnh) - When (hành động) - Then (kết quả mong đợi). Chỉ liệt kê các tính năng Must + một số Should trọng yếu.

### F-01 - Tạo hộp thời gian
- **AC-01.1:** Given người dùng ở màn hình chính, When nhấn nút "Tạo hộp", Then hiển thị form tạo hộp với: chọn loại hộp, tiêu đề (tùy chọn), nội dung (bắt buộc), ngày mở (bắt buộc).
- **AC-01.2:** Given form tạo hộp, When để trống nội dung và ngày mở rồi nhấn "Khóa hộp", Then hiển thị thông báo lỗi rõ ràng cho từng trường thiếu và không tạo hộp.
- **AC-01.3:** Nội dung text hỗ trợ tối thiểu 2.000 ký tự (xem F-09 giới hạn lưu trữ).
- **AC-01.4:** Khi chưa khóa, người dùng có thể thoát form và được hỏi xác nhận hủy nếu đã nhập dữ liệu (tránh mất dữ liệu).

### F-02 - Chọn ngày mở
- **AC-02.1:** Given form tạo hộp, When mở date picker, Then chỉ cho phép chọn thời điểm **trong tương lai** (≥ thời điểm hiện tại + ngưỡng tối thiểu, vd 1 phút/ giả định: tối thiểu cùng ngày hôm sau - xem Câu hỏi mở Q3).
- **AC-02.2:** Có các preset nhanh: **1 tuần, 1 tháng, 3 tháng, 1 năm** và "Tùy chỉnh".
- **AC-02.3:** When chọn ngày trong quá khứ, Then nút "Khóa hộp" bị vô hiệu hóa kèm thông báo.
- **AC-02.4:** Ngày mở hiển thị rõ ràng (vd "Sẽ mở vào 18/06/2026") trước khi xác nhận khóa.

### F-03 - Khóa hộp & ẩn nội dung
- **AC-03.1:** Given hộp đã khóa và chưa đến ngày mở, When người dùng xem hộp trong danh sách hoặc chi tiết, Then **không hiển thị bất kỳ nội dung/ảnh nào**; chỉ hiển thị metadata: tiêu đề (tùy chọn), loại hộp, ngày mở, đếm ngược.
- **AC-03.2:** Nội dung hộp khóa không thể truy cập kể cả khi xem source dữ liệu thông thường của app UI (ẩn ở tầng hiển thị; lưu ý mã hóa ở F-09/NFR bảo mật).
- **AC-03.3:** Trạng thái hộp được xác định theo `unlockDate` so với thời gian thiết bị hiện tại: `Locked` nếu now < unlockDate, `ReadyToOpen` nếu now ≥ unlockDate và chưa mở, `Opened` nếu đã mở.
- **AC-03.4 (chống chỉnh giờ):** Nếu phát hiện người dùng tua giờ thiết bị về tương lai để mở sớm, hệ thống nên cảnh báo hoặc dựa trên cơ chế xác định thời gian đáng tin cậy hơn (xem NFR & Q4).

### F-04 - Câu hỏi phản hồi
- **AC-04.1:** Given form tạo hộp, When chọn loại hộp, Then hệ thống gợi ý câu hỏi mặc định theo loại (Message: "Kết quả tốt chứ?"; Goal: "Bạn đã đạt mục tiêu chưa?"; Decision: "Quyết định đó đúng chứ?").
- **AC-04.2:** Người dùng có thể sửa hoặc bỏ trống câu hỏi (câu hỏi là tùy chọn).
- **AC-04.3:** Câu hỏi mặc định ở dạng Yes/No.

### F-05 - Danh sách hộp
- **AC-05.1:** Màn hình chính nhóm hộp theo 3 trạng thái: **Sẵn sàng mở** (ưu tiên trên cùng, có badge), **Đang khóa**, **Đã mở**.
- **AC-05.2:** Mỗi hộp khóa hiển thị: loại (icon/màu), tiêu đề, đếm ngược "còn X ngày".
- **AC-05.3:** Khi không có hộp nào, hiển thị empty state truyền cảm hứng (F-19).
- **AC-05.4:** Danh sách cập nhật trạng thái real-time/khi mở app (hộp đến hạn tự chuyển nhóm "Sẵn sàng mở").

### F-06 - Mở hộp khi đến hạn
- **AC-06.1:** Given hộp ở trạng thái `ReadyToOpen`, When người dùng nhấn vào hộp, Then hiển thị màn hình/CTA "Mở hộp" (không tự động mở để giữ khoảnh khắc nghi thức).
- **AC-06.2:** When nhấn "Mở hộp", Then chạy animation mở (F-14) rồi hiển thị nội dung gốc + lời nhắn khi mở (F-16) + câu hỏi (nếu có).
- **AC-06.3:** Sau khi mở, hộp chuyển vĩnh viễn sang trạng thái `Opened` (không "đóng lại").
- **AC-06.4:** Given hộp `Locked`, Then hành động mở bị chặn và hiển thị thời gian còn lại.

### F-07 - Trả lời câu hỏi & hiệu ứng cảm xúc
- **AC-07.1:** Given hộp đã mở có câu hỏi, When người dùng chọn **Yes** (kết quả tích cực), Then hiển thị **hiệu ứng chúc mừng** (confetti + thông điệp tích cực).
- **AC-07.2:** When chọn **No**, Then hiển thị thông điệp đồng cảm/khích lệ (không phán xét), gợi ý tạo hộp mới để thử lại.
- **AC-07.3:** Câu trả lời được lưu cùng hộp và hiển thị lại khi xem chi tiết (F-11).
- **AC-07.4:** Người dùng có thể bỏ qua trả lời (skip) và vẫn xem nội dung.

### F-08 - Local notification
- **AC-08.1:** Given hộp được tạo với ngày mở, When đến ngày/giờ mở, Then thiết bị hiển thị local notification.
- **AC-08.2:** When người dùng nhấn notification, Then app mở thẳng vào hộp tương ứng.
- **AC-08.3:** Nếu người dùng từ chối quyền notification, app vẫn hoạt động; trạng thái hộp vẫn cập nhật trong app (chỉ mất nhắc đẩy).
- **AC-08.4:** Khi xóa hộp khóa, notification đã lên lịch tương ứng bị hủy.

### F-09 - Lưu trữ cục bộ (offline-first)
- **AC-09.1:** Toàn bộ thao tác tạo/xem/mở/trả lời hoạt động hoàn toàn offline.
- **AC-09.2:** Dữ liệu tồn tại sau khi đóng/mở lại app và khởi động lại thiết bị.
- **AC-09.3:** Ảnh đính kèm lưu cục bộ (file system), DB lưu đường dẫn tham chiếu.

### F-10 - Đính kèm ảnh
- **AC-10.1:** Given form tạo hộp loại Kỷ niệm (và các loại khác nếu cho phép), When chọn "Thêm ảnh", Then có thể chọn từ thư viện hoặc chụp mới (yêu cầu quyền truy cập tương ứng).
- **AC-10.2:** Ảnh đính kèm bị ẩn cùng nội dung cho đến ngày mở (AC-03.1).
- **AC-10.3:** Nếu người dùng từ chối quyền, hiển thị hướng dẫn mở quyền trong Settings.

### F-11 - Xem chi tiết hộp đã mở
- **AC-11.1:** Hiển thị: ngày tạo, ngày mở thực tế, nội dung gốc, ảnh, câu hỏi & câu trả lời.
- **AC-11.2:** Hộp đã mở chỉ đọc (read-only); không cho sửa nội dung gốc (giữ tính toàn vẹn lịch sử).

### F-18 - App Lock (Should)
- **AC-18.1:** Khi bật, mỗi lần mở app (hoặc quay lại từ background sau ngưỡng thời gian) yêu cầu biometric/PIN.
- **AC-18.2:** Có fallback PIN khi biometric thất bại/không khả dụng.

---

## 5. Non-functional Requirements

### 5.1. Performance
- **NFR-P1:** Khởi động app (cold start) ≤ 2.5s trên thiết bị tầm trung.
- **NFR-P2:** Mở/cuộn danh sách 200 hộp mượt ở 60fps; dùng list ảo hóa (FlatList/FlashList).
- **NFR-P3:** Animation mở hộp & confetti không gây giật khung hình rõ rệt (chạy trên UI thread/native driver).

### 5.2. Bảo mật & Quyền riêng tư
- **NFR-S1:** Nội dung hộp khóa được **mã hóa khi lưu trữ** (encryption at rest); chỉ giải mã khi đến hạn mở (hoặc quản lý khóa hợp lý) - nhằm bảo vệ tính "khóa" thật sự, không chỉ ẩn ở UI. *(Mức độ áp dụng cần xác nhận - Q4.)*
- **NFR-S2:** Không thu thập dữ liệu cá nhân gửi lên server (MVP không có backend). Mọi dữ liệu nằm trên thiết bị.
- **NFR-S3:** Tuân thủ chính sách quyền của iOS/Android (camera, photo library, notifications) - chỉ xin quyền khi cần (just-in-time).
- **NFR-S4:** App Lock (F-18) bảo vệ truy cập trái phép khi thiết bị mở khóa nhưng bị người khác cầm.

### 5.3. Khả năng dùng (Usability) & Cảm xúc
- **NFR-U1:** UI nhất quán, đẹp, ưu tiên cảm xúc; hỗ trợ Light/Dark mode (Could - F-24).
- **NFR-U2:** Hiệu ứng mở hộp và chúc mừng phải tạo cảm giác "đáng nhớ" (đúng yêu cầu cốt lõi về cảm xúc).
- **NFR-U3:** Hỗ trợ tiếng Việt (mặc định); kiến trúc sẵn sàng đa ngôn ngữ (i18n).
- **NFR-U4:** Accessibility cơ bản: kích thước chạm ≥ 44pt, hỗ trợ font scaling, contrast đạt WCAG AA cho text chính.

### 5.4. Độ tin cậy & Toàn vẹn dữ liệu
- **NFR-R1:** Không mất dữ liệu khi app bị kill đột ngột (ghi DB transaction an toàn).
- **NFR-R2:** Crash-free sessions ≥ 99.5%.
- **NFR-R3:** Xử lý nhất quán việc tính trạng thái hộp dựa trên thời gian (múi giờ, đổi múi giờ, DST - xem Q3/Q4).

### 5.5. Khả năng mở rộng & Bảo trì
- **NFR-M1:** Thực thể "Box" thiết kế tổng quát theo `boxType` để dễ thêm loại hộp mới mà không đổi schema lớn.
- **NFR-M2:** Tách rõ tầng UI (agent-uiux) và business logic (agent-react); dùng state management nhất quán.
- **NFR-M3:** Kiến trúc lưu trữ cục bộ cho phép nâng cấp lên đồng bộ cloud (F-26) ở v2 mà ít phá vỡ.

### 5.6. Tương thích
- **NFR-C1:** Hỗ trợ iOS 15+ và Android 8.0+ (API 26+) *(giả định - cần xác nhận Q5)*.
- **NFR-C2:** Hỗ trợ nhiều kích thước màn hình điện thoại (không bắt buộc tablet ở MVP).

---

## 6. Assumptions & Constraints

### 6.1. Giả định (Assumptions)
1. **A1:** MVP là **offline-first, single-device, không cần tài khoản đăng nhập**. Người dùng đổi/mất máy sẽ mất dữ liệu trừ khi dùng backup (F-25, Could).
2. **A2:** "Gửi cho chính mình" - không có người nhận khác; mọi hộp thuộc về 1 người dùng trên 1 thiết bị.
3. **A3:** Câu hỏi phản hồi mặc định ở dạng **Yes/No**; mở rộng thang điểm là Could (F-22).
4. **A4:** Hiệu ứng "chúc mừng" gắn với câu trả lời **Yes** (kết quả tích cực) theo đúng mô tả ý tưởng.
5. **A5:** Mỗi hộp đính kèm tối đa **1 ảnh** ở MVP (nhiều ảnh/voice là Could - F-21).
6. **A6:** Trạng thái mở hộp xác định theo **đồng hồ thiết bị** (device clock) ở MVP, có cảnh báo cơ bản về việc chỉnh giờ.

### 6.2. Ràng buộc (Constraints)
1. **C1:** Công nghệ: **React Native** (đa nền tảng iOS/Android). *(Đề xuất stack cụ thể sẽ chốt ở giai đoạn Design - xem Q6.)*
2. **C2:** Local notification giới hạn theo nền tảng (số lượng notification được lên lịch, độ chính xác thời gian trên Android do battery optimization có thể trễ).
3. **C3:** Không có backend ở MVP - không có khôi phục dữ liệu từ xa, không phân tích server-side.
4. **C4:** Lưu trữ ảnh cục bộ tiêu tốn dung lượng thiết bị; cần cảnh báo/giới hạn hợp lý.

---

## 7. Quyết định đã xác nhận

> Người dùng xác nhận ngày 2026-06-11.

| # | Câu hỏi | Quyết định |
|---|---------|------------|
| **Q1** | MVP offline-first, không tài khoản — đổi máy mất hộp? | ✅ **Chấp nhận.** MVP không cần tài khoản, mất dữ liệu khi đổi máy là acceptable. F-26 giữ ở Won't have. |
| **Q2** | Gửi hộp cho người khác? | Giữ Won't have (dùng giả định mặc định). |
| **Q3** | Khoảng cách tối thiểu tạo → mở? | ✅ **Tối thiểu 1 tháng.** Chỉ chọn ngày (không chọn giờ). Preset: 1 tháng, 3 tháng, 6 tháng, 1 năm. |
| **Q4** | Mức độ khóa? | ✅ **Khóa ở tầng UI** — ẩn nội dung trên giao diện, không cần mã hóa. NFR-S1 bỏ yêu cầu encryption at rest. |
| **Q5** | Phiên bản OS tối thiểu? | Dùng giả định: iOS 15+, Android 8+ (API 26+). |
| **Q6** | Tech stack? | Để agent-ba đề xuất ở giai đoạn Design. |
| **Q7** | Hộp đã khóa có sửa/xóa được không? | ✅ **Không thể sửa sau khi khóa.** Xóa vẫn cho phép. F-15 cập nhật: chỉ xóa, không sửa nội dung hộp đã khóa. |

---

*Hết tài liệu PRD v1.1. Trạng thái: **Requirement ✓ → Design**.*
