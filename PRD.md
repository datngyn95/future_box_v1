# PRD - FutureBoxes

**Product Requirements Document**
Phiên bản: 1.2 | Ngày cập nhật: 2026-06-19 | Tác giả: agent-ba
Nền tảng: React Native (iOS & Android) | Trạng thái: **MVP đã xác nhận ✓ → V1 Curiosity & Engagement planning**

---

## Mục lục

1. [Executive Summary](#1-executive-summary)
2. [Personas & Use Cases cốt lõi](#2-personas--use-cases-cốt-lõi)
3. [Feature Table (MoSCoW)](#3-feature-table-moscow)
4. [Acceptance Criteria chi tiết](#4-acceptance-criteria-chi-tiết)
5. [Non-functional Requirements](#5-non-functional-requirements)
6. [Assumptions & Constraints](#6-assumptions--constraints)
7. [Quyết định đã xác nhận](#7-quyết-định-đã-xác-nhận)
8. [V1 — Curiosity & Engagement](#8-v1--curiosity--engagement)
9. [Data Model bổ sung cho V1](#9-data-model-bổ-sung-cho-v1)
10. [Roadmap triển khai](#10-roadmap-triển-khai)
11. [Change Log](#11-change-log)

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

### 1.6. Định hướng V1

Sau MVP, V1 tập trung vào **Curiosity & Engagement**: tăng sự tò mò trong thời gian chờ, tạo lý do để người dùng quay lại app, biến thời điểm mở hộp thành một nghi thức có cảm xúc và khuyến khích người dùng tạo hộp tiếp theo. Các tính năng V1 vẫn giữ nguyên định hướng **offline-first, single-device, không backend**.

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
| **F-02** | Chọn ngày mở (unlock date) | Date picker, chỉ cho phép ngày trong tương lai, tối thiểu 1 tháng; preset nhanh: 1 tháng, 3 tháng, 6 tháng, 1 năm. | F-01 |
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
| **F-15** | Xóa hộp đang khóa | Cho phép xóa hộp đã khóa. Không cho sửa tiêu đề, nội dung, ảnh, ngày mở hoặc câu hỏi sau khi hộp đã khóa. | F-01 |
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


### 3.5. V1 — Curiosity & Engagement

Các tính năng V1 tập trung vào việc tăng **tò mò, mong chờ, cảm xúc và vòng lặp quay lại app**. V1 vẫn không yêu cầu tài khoản, backend hoặc đồng bộ cloud.

| ID | Tính năng | Mô tả ngắn | Ưu tiên | Phụ thuộc |
|----|-----------|------------|---------|-----------|
| **F-30** | Mystery Teaser | Cho phép tạo 1-3 gợi ý bí ẩn cho hộp; teaser chỉ hiển thị khi đến mốc thời gian đã định trước ngày mở. | Should | F-01, F-03, F-13 |
| **F-31** | Curiosity Notification | Gửi notification kiểu gợi tò mò trước ngày mở: 30 ngày, 7 ngày, 1 ngày và khi teaser mới được mở. | Should | F-08, F-30 |
| **F-32** | Prediction Before Opening | Trước khi hộp mở, người dùng có thể ghi dự đoán: “Bạn nghĩ bên trong hộp này là gì?”. Sau khi mở, app hiển thị dự đoán để đối chiếu. | Should | F-03, F-06, F-11 |
| **F-33** | Opening Ritual | Nâng cấp trải nghiệm mở hộp bằng animation, haptic, thông điệp cảm xúc và chuyển cảnh sang nội dung thật. | Should | F-06, F-14 |
| **F-34** | Post-open Reflection Note | Sau khi mở, người dùng có thể viết cảm nhận, chấm điểm hoặc trả lời sâu hơn thay vì chỉ Yes/No. | Should | F-07, F-11 |
| **F-35** | Create Next Box CTA | Sau khi mở hoặc trả lời reflection, app gợi ý tạo hộp tiếp theo để hình thành vòng lặp sử dụng. | Should | F-07 |
| **F-36** | Personal Stats | Màn thống kê cá nhân: tổng số hộp, số hộp đã mở, số hộp sắp mở, tỷ lệ mục tiêu hoàn thành, chuỗi hoạt động. | Could | F-05, F-07, F-34 |
| **F-37** | New Box Types | Bổ sung loại hộp: Secret, Challenge, Letter với icon, màu, placeholder và câu hỏi mặc định riêng. | Could | F-12 |

---

## 4. Acceptance Criteria chi tiết

> Format: Given (bối cảnh) - When (hành động) - Then (kết quả mong đợi). Chỉ liệt kê các tính năng Must + một số Should trọng yếu.

### F-01 - Tạo hộp thời gian
- **AC-01.1:** Given người dùng ở màn hình chính, When nhấn nút "Tạo hộp", Then hiển thị form tạo hộp với: chọn loại hộp, tiêu đề (tùy chọn), nội dung (bắt buộc), ngày mở (bắt buộc).
- **AC-01.2:** Given form tạo hộp, When để trống nội dung và ngày mở rồi nhấn "Khóa hộp", Then hiển thị thông báo lỗi rõ ràng cho từng trường thiếu và không tạo hộp.
- **AC-01.3:** Nội dung text hỗ trợ tối thiểu 2.000 ký tự (xem F-09 giới hạn lưu trữ).
- **AC-01.4:** Khi chưa khóa, người dùng có thể thoát form và được hỏi xác nhận hủy nếu đã nhập dữ liệu (tránh mất dữ liệu).

### F-02 - Chọn ngày mở
- **AC-02.1:** Given form tạo hộp, When mở date picker, Then chỉ cho phép chọn ngày **tối thiểu sau ngày tạo 1 tháng**.
- **AC-02.2:** Có các preset nhanh: **1 tháng, 3 tháng, 6 tháng, 1 năm** và "Tùy chỉnh".
- **AC-02.3:** When chọn ngày trong quá khứ, Then nút "Khóa hộp" bị vô hiệu hóa kèm thông báo.
- **AC-02.4:** Ngày mở hiển thị rõ ràng (vd "Sẽ mở vào 18/06/2026") trước khi xác nhận khóa.

### F-03 - Khóa hộp & ẩn nội dung
- **AC-03.1:** Given hộp đã khóa và chưa đến ngày mở, When người dùng xem hộp trong danh sách hoặc chi tiết, Then **không hiển thị bất kỳ nội dung/ảnh nào**; chỉ hiển thị metadata: tiêu đề (tùy chọn), loại hộp, ngày mở, đếm ngược.
- **AC-03.2:** Nội dung hộp khóa không được render ở màn Locked, danh sách hoặc preview. MVP khóa ở tầng UI theo quyết định Q4, chưa yêu cầu mã hóa dữ liệu local.
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

### F-30 - Mystery Teaser (V1)
- **AC-30.1:** Given người dùng tạo hộp mới, When nhập teaser, Then có thể thêm tối đa 3 teaser ngắn, mỗi teaser tối đa 160 ký tự.
- **AC-30.2:** Given teaser có `unlockAt` lớn hơn thời gian hiện tại, When người dùng xem màn hộp đang khóa, Then teaser đó chưa hiển thị.
- **AC-30.3:** Given teaser đã đến `unlockAt`, When người dùng mở màn hộp đang khóa, Then teaser hiển thị trong khu vực “Gợi ý đã mở khóa”.
- **AC-30.4:** Teaser không được hiển thị trên màn danh sách nếu chưa đến `unlockAt`; chỉ hiển thị badge “Có gợi ý mới” nếu có teaser vừa mở.
- **AC-30.5:** Khi xóa hộp, toàn bộ teaser liên quan bị xóa theo.

### F-31 - Curiosity Notification (V1)
- **AC-31.1:** Given hộp được tạo và người dùng cho phép notification, When đến các mốc hợp lệ trước ngày mở, Then app gửi notification gợi tò mò.
- **AC-31.2:** Notification chỉ được schedule nếu thời điểm gửi nằm trong tương lai; nếu hộp mở sau đúng 1 tháng, mốc 30 ngày có thể được bỏ qua hoặc chuyển thành notification “Hộp đã bắt đầu ngủ yên”.
- **AC-31.3:** When người dùng nhấn notification teaser, Then app mở vào màn Locked của hộp tương ứng.
- **AC-31.4:** When người dùng nhấn notification ngày mở, Then app mở vào màn Ready To Open / Pre-open của hộp tương ứng.
- **AC-31.5:** Khi xóa hộp, tất cả notification đã schedule cho hộp đó bị hủy.

### F-32 - Prediction Before Opening (V1)
- **AC-32.1:** Given hộp đang khóa, When người dùng nhập dự đoán, Then prediction được lưu và gắn với hộp.
- **AC-32.2:** Người dùng có thể sửa prediction khi hộp còn Locked.
- **AC-32.3:** Sau khi hộp đã Opened, prediction chuyển sang read-only và không được sửa.
- **AC-32.4:** Màn chi tiết hộp đã mở hiển thị prediction trước nội dung thật hoặc ngay sau phần nội dung thật để tạo hiệu ứng đối chiếu.

### F-33 - Opening Ritual (V1)
- **AC-33.1:** Given hộp ReadyToOpen, When người dùng nhấn “Mở hộp”, Then app hiển thị animation mở hộp trước khi vào màn chi tiết.
- **AC-33.2:** Animation không được làm mất dữ liệu hoặc khiến trạng thái mở bị cập nhật nhiều lần khi người dùng bấm liên tục.
- **AC-33.3:** Nếu animation lỗi hoặc bị gián đoạn, hộp vẫn mở đúng và chuyển sang màn chi tiết an toàn.
- **AC-33.4:** Haptic/sound là optional và phải có fallback im lặng nếu thiết bị không hỗ trợ.

### F-34 - Post-open Reflection Note (V1)
- **AC-34.1:** Given hộp đã mở, When người dùng viết cảm nhận sau khi mở, Then reflection note được lưu cùng hộp.
- **AC-34.2:** Người dùng có thể chọn rating 1-5 hoặc bỏ qua rating.
- **AC-34.3:** Reflection note hiển thị lại khi xem chi tiết hộp đã mở.
- **AC-34.4:** Nếu người dùng chọn No ở câu hỏi Yes/No, app hiển thị thông điệp đồng cảm và gợi ý tạo hộp mới.

### F-35 - Create Next Box CTA (V1)
- **AC-35.1:** Sau khi người dùng mở hộp thành công, app hiển thị CTA “Tạo hộp mới cho tương lai”.
- **AC-35.2:** CTA không gây cản trở việc đọc nội dung hộp; ưu tiên hiển thị cuối màn hình chi tiết hoặc sau khi trả lời reflection.
- **AC-35.3:** Khi nhấn CTA, app điều hướng sang luồng tạo hộp mới.

### F-36 - Personal Stats (V1)
- **AC-36.1:** Màn thống kê hiển thị tổng số hộp, số hộp đang khóa, số hộp sẵn sàng mở và số hộp đã mở.
- **AC-36.2:** Nếu có hộp Goal/Challenge, app hiển thị số mục tiêu/thử thách đã hoàn thành dựa trên câu trả lời tích cực.
- **AC-36.3:** Khi chưa có dữ liệu, màn thống kê hiển thị empty state và gợi ý tạo hộp đầu tiên.

### F-37 - New Box Types (V1)
- **AC-37.1:** Màn chọn loại hộp hiển thị thêm Secret, Challenge và Letter.
- **AC-37.2:** Mỗi loại hộp mới có icon, màu, placeholder nội dung và câu hỏi mặc định riêng.
- **AC-37.3:** Box type mới phải dùng chung entity Box, không tạo bảng riêng nếu chưa cần.
- **AC-37.4:** Các loại hộp mới vẫn tuân thủ rule khóa: không hiển thị content trước ngày mở.

---

## 5. Non-functional Requirements

### 5.1. Performance
- **NFR-P1:** Khởi động app (cold start) ≤ 2.5s trên thiết bị tầm trung.
- **NFR-P2:** Mở/cuộn danh sách 200 hộp mượt ở 60fps; dùng list ảo hóa (FlatList/FlashList).
- **NFR-P3:** Animation mở hộp & confetti không gây giật khung hình rõ rệt (chạy trên UI thread/native driver).

### 5.2. Bảo mật & Quyền riêng tư
- **NFR-S1:** MVP khóa nội dung ở tầng UI: không hiển thị, không preview và không render nội dung hộp trước ngày mở. **Encryption at rest không thuộc phạm vi MVP** theo quyết định Q4; có thể xem xét ở phiên bản sau nếu sản phẩm cần bảo mật cao hơn.
- **NFR-S2:** Không thu thập dữ liệu cá nhân gửi lên server (MVP không có backend). Mọi dữ liệu nằm trên thiết bị.
- **NFR-S3:** Tuân thủ chính sách quyền của iOS/Android (camera, photo library, notifications) - chỉ xin quyền khi cần (just-in-time).
- **NFR-S4:** App Lock (F-18) bảo vệ truy cập trái phép khi thiết bị mở khóa nhưng bị người khác cầm.

### 5.3. Khả năng dùng (Usability) & Cảm xúc
- **NFR-U1:** UI nhất quán, đẹp, ưu tiên cảm xúc; hỗ trợ Light/Dark mode (Could - F-24).
- **NFR-U2:** Hiệu ứng mở hộp và chúc mừng phải tạo cảm giác "đáng nhớ" (đúng yêu cầu cốt lõi về cảm xúc).
- **NFR-U3:** Hỗ trợ tiếng Việt (mặc định); kiến trúc sẵn sàng đa ngôn ngữ (i18n).
- **NFR-U4:** Accessibility cơ bản: kích thước chạm ≥ 44pt, hỗ trợ font scaling, contrast đạt WCAG AA cho text chính.
- **NFR-U5:** Các yếu tố tò mò như teaser, badge, countdown và notification phải khơi gợi hứng thú nhưng không được tiết lộ nội dung chính của hộp trước ngày mở.

### 5.4. Độ tin cậy & Toàn vẹn dữ liệu
- **NFR-R1:** Không mất dữ liệu khi app bị kill đột ngột (ghi DB transaction an toàn).
- **NFR-R2:** Crash-free sessions ≥ 99.5%.
- **NFR-R3:** Xử lý nhất quán việc tính trạng thái hộp dựa trên thời gian (múi giờ, đổi múi giờ, DST - xem Q3/Q4).
- **NFR-R4:** Các mốc teaser và curiosity notification phải được tính lại an toàn khi app mở lại, khi notification bị OS bỏ qua hoặc khi người dùng thay đổi timezone.

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
7. **A7:** V1 Curiosity & Engagement vẫn là **offline-first, single-device**, không yêu cầu tài khoản hoặc backend.
8. **A8:** Teaser, prediction và reflection là dữ liệu cá nhân local, không đồng bộ lên server ở V1.

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

## 8. V1 — Curiosity & Engagement

### 8.1. Mục tiêu V1

Mục tiêu của V1 là chuyển FutureBoxes từ một app “tạo hộp và chờ đến ngày mở” thành một trải nghiệm có vòng lặp cảm xúc rõ hơn:

```txt
Tạo hộp → Khóa hộp → Countdown → Gợi ý bí ẩn → Dự đoán → Notification → Mở hộp → Reflection → Tạo hộp mới
```

V1 không thay đổi định vị MVP: app vẫn phục vụ người dùng tự gửi nội dung cho chính mình trong tương lai, dữ liệu vẫn lưu local và không yêu cầu backend.

### 8.2. Nguyên tắc thiết kế V1

- Tạo tò mò nhưng không làm lộ nội dung chính.
- Mỗi tương tác trong thời gian chờ phải có cảm xúc hoặc lý do quay lại.
- Không làm quá phức tạp form tạo hộp.
- Không đưa social, cloud, tài khoản hoặc gửi cho người khác vào V1.
- Mọi tính năng phải hoạt động offline sau khi đã được tạo.

### 8.3. Feature F-30 — Mystery Teaser

#### Mục tiêu

Tạo các “mảnh gợi ý” nhỏ xuất hiện trước ngày mở hộp, giúp người dùng tò mò và quay lại app trong thời gian chờ.

#### Mô tả

Khi tạo hộp, người dùng có thể nhập tối đa 3 teaser. Mỗi teaser được gắn với một mốc mở tự động trước ngày mở hộp. Ví dụ: 30 ngày trước, 7 ngày trước, 1 ngày trước. Nếu mốc đó không hợp lệ vì ngày mở quá gần, app bỏ qua mốc hoặc dùng mốc gần nhất hợp lệ.

#### User Story

Là một người dùng, tôi muốn nhìn thấy một vài gợi ý nhỏ trước ngày mở hộp để cảm thấy hồi hộp và muốn quay lại app.

#### Luồng xử lý

1. Người dùng tạo hộp.
2. App hiển thị phần optional “Thêm gợi ý bí ẩn”.
3. Người dùng nhập 0-3 teaser.
4. App tự tính `unlockAt` cho từng teaser dựa trên `unlockDate`.
5. Khi chưa đến `unlockAt`, teaser không hiển thị.
6. Khi đến `unlockAt`, teaser hiển thị ở màn Locked.

#### Business Rules

- Teaser là optional.
- Tối đa 3 teaser / hộp.
- Mỗi teaser tối đa 160 ký tự.
- Teaser không được hiển thị trước `unlockAt`.
- Teaser được phép hiển thị khi hộp vẫn Locked.
- Teaser không thay thế nội dung chính.
- Khi xóa hộp, teaser liên quan phải bị xóa.

#### UI đề xuất

**Create Box Form**

- Section: “Gợi ý bí ẩn”
- Helper text: “Những gợi ý nhỏ sẽ xuất hiện trước ngày mở hộp.”
- Input teaser 1, teaser 2, teaser 3
- Có thể thu gọn section để form không bị dài.

**Locked Box Detail**

- Nếu chưa có teaser mở: “Một vài gợi ý sẽ xuất hiện khi gần đến ngày mở...”
- Nếu có teaser mở: hiển thị card “Gợi ý đã mở khóa”.

### 8.4. Feature F-31 — Curiosity Notification

#### Mục tiêu

Tăng khả năng người dùng quay lại app bằng notification có nội dung gợi tò mò thay vì chỉ nhắc ngày mở.

#### Mô tả

Ngoài notification ngày mở, app schedule thêm notification trước ngày mở nếu mốc thời gian hợp lệ. Nội dung notification không tiết lộ nội dung hộp.

#### User Story

Là một người dùng, tôi muốn được nhắc nhẹ khi hộp sắp mở hoặc có gợi ý mới để cảm thấy hào hứng quay lại app.

#### Các loại notification

| Kind | Thời điểm | Nội dung mẫu | Điều hướng |
|------|-----------|--------------|------------|
| `teaser_30d` | 30 ngày trước mở | “Một gợi ý mới vừa được mở trong hộp tương lai của bạn.” | Locked Box Detail |
| `teaser_7d` | 7 ngày trước mở | “Chỉ còn 7 ngày nữa. Bạn còn nhớ mình đã viết gì không?” | Locked Box Detail |
| `teaser_1d` | 1 ngày trước mở | “Ngày mai hộp của bạn sẽ mở. Có hồi hộp không?” | Locked Box Detail |
| `unlock` | Ngày mở | “Một hộp thời gian đã sẵn sàng mở!” | Ready To Open / Pre-open |

#### Business Rules

- Chỉ schedule notification nếu người dùng đã cấp quyền.
- Chỉ schedule notification nếu thời điểm gửi nằm trong tương lai.
- Nếu notification permission bị từ chối, app vẫn hoạt động bình thường.
- Khi xóa hộp, hủy tất cả notification liên quan.
- Notification phải có `boxId` và `kind` trong payload để deep link đúng màn.

### 8.5. Feature F-32 — Prediction Before Opening

#### Mục tiêu

Tạo sự đối chiếu thú vị giữa “mình nghĩ bên trong là gì” và “nội dung thật sự là gì”.

#### Mô tả

Trong màn Locked, người dùng có thể nhập dự đoán về nội dung hộp. Prediction được lưu riêng, không ảnh hưởng đến nội dung gốc. Khi hộp đã mở, app hiển thị prediction cùng nội dung thật.

#### User Story

Là một người dùng, tôi muốn đoán xem bên trong hộp là gì trước khi mở để khoảnh khắc mở hộp trở nên bất ngờ hơn.

#### Luồng xử lý

1. Người dùng mở màn Locked của một hộp.
2. App hiển thị câu hỏi: “Bạn nghĩ bên trong hộp này là gì?”
3. Người dùng nhập prediction.
4. App lưu prediction.
5. Khi hộp đã mở, prediction hiển thị ở màn chi tiết.

#### Business Rules

- Prediction là optional.
- Prediction tối đa 500 ký tự.
- Có thể sửa prediction khi hộp còn Locked.
- Không được sửa prediction sau khi hộp đã Opened.
- Prediction không được dùng để thay đổi nội dung chính.

### 8.6. Feature F-33 — Opening Ritual

#### Mục tiêu

Biến hành động mở hộp thành một khoảnh khắc đáng nhớ thay vì chỉ là chuyển màn.

#### Mô tả

Khi hộp đến hạn, người dùng không xem nội dung ngay. App hiển thị màn Pre-open với CTA “Mở hộp”. Sau khi nhấn, app chạy animation, haptic nhẹ nếu hỗ trợ, sau đó chuyển sang màn chi tiết.

#### User Story

Là một người dùng, tôi muốn việc mở hộp có cảm giác trang trọng và bất ngờ để nội dung bên trong có giá trị cảm xúc hơn.

#### Flow đề xuất

1. Hộp chuyển sang `ReadyToOpen`.
2. Người dùng nhấn hộp.
3. App mở màn Pre-open.
4. Người dùng nhấn “Mở hộp”.
5. App chạy animation mở hộp.
6. App cập nhật `isOpened = true`, `openedAt = now`.
7. App chuyển sang màn Box Opened Detail.

#### Business Rules

- Chỉ hộp `ReadyToOpen` mới được mở.
- `openBox()` phải có guard ở tầng business logic/data, không chỉ ở UI.
- Nếu người dùng bấm nhiều lần, app chỉ xử lý mở một lần.
- Nếu animation lỗi, app vẫn phải đảm bảo trạng thái hộp đúng.

### 8.7. Feature F-34 — Post-open Reflection Note

#### Mục tiêu

Mở rộng reflection từ Yes/No thành một phần ghi nhận cảm xúc sau khi mở hộp.

#### Mô tả

Sau khi mở hộp, app cho phép người dùng viết vài dòng cảm nhận và có thể chấm điểm cảm xúc/mức độ hài lòng. Điều này giúp hộp đã mở trở thành một bản ghi hoàn chỉnh của quá khứ và hiện tại.

#### User Story

Là một người dùng, tôi muốn viết cảm nhận sau khi mở hộp để lưu lại sự thay đổi của bản thân theo thời gian.

#### Business Rules

- Reflection note là optional.
- Rating là optional, thang 1-5.
- Reflection note có thể sửa sau khi hộp đã mở.
- Nội dung gốc của hộp vẫn read-only.

### 8.8. Feature F-35 — Create Next Box CTA

#### Mục tiêu

Tạo vòng lặp sử dụng sau khi người dùng mở hộp.

#### Mô tả

Sau khi người dùng mở hộp, trả lời câu hỏi hoặc viết reflection, app gợi ý tạo hộp tiếp theo. CTA không được làm gián đoạn trải nghiệm đọc nội dung.

#### User Story

Là một người dùng, sau khi đọc lại một hộp cũ, tôi muốn dễ dàng tạo một hộp mới cho tương lai.

#### Vị trí UI đề xuất

- Cuối màn Box Opened Detail.
- Sau khi lưu reflection.
- Empty state của màn thống kê nếu chưa có hộp mới.

#### Nội dung CTA mẫu

- “Gửi tiếp một điều cho tương lai”
- “Tạo hộp mới cho bạn của 1 tháng sau”
- “Viết tiếp một lời nhắn cho chính mình”

### 8.9. Feature F-36 — Personal Stats

#### Mục tiêu

Cho người dùng thấy hành trình cá nhân và tăng động lực quay lại app.

#### Mô tả

Màn thống kê hiển thị các số liệu đơn giản về hộp đã tạo, hộp đã mở, hộp sắp mở và tỷ lệ mục tiêu/thử thách hoàn thành.

#### Chỉ số đề xuất

- Tổng số hộp đã tạo.
- Số hộp đang khóa.
- Số hộp sẵn sàng mở.
- Số hộp đã mở.
- Hộp sắp mở gần nhất.
- Tỷ lệ Goal/Challenge trả lời Yes.
- Số reflection note đã viết.

#### Business Rules

- Stats được tính từ dữ liệu local.
- Không yêu cầu analytics server.
- Không hiển thị biểu đồ phức tạp ở bản đầu của V1.

### 8.10. Feature F-37 — New Box Types

#### Mục tiêu

Mở rộng nội dung người dùng có thể tạo, giúp app phong phú hơn mà không cần thay đổi kiến trúc lớn.

#### Loại hộp mới

| Box Type | Mục đích | Placeholder | Câu hỏi mặc định |
|----------|----------|-------------|------------------|
| `Secret` | Lưu bí mật hoặc điều chưa muốn nói ra hiện tại | “Có một điều mình chưa muốn nói ra...” | “Bí mật này bây giờ còn quan trọng không?” |
| `Challenge` | Đặt thử thách cho bản thân | “Thử thách mình muốn hoàn thành là...” | “Bạn đã hoàn thành thử thách chưa?” |
| `Letter` | Viết lá thư dài cho bản thân tương lai | “Gửi tôi của tương lai...” | “Bạn cảm thấy thế nào khi đọc lại lá thư này?” |

#### Business Rules

- Các box type mới dùng chung bảng `box`.
- Mỗi box type cần icon, màu, label, placeholder và default reflection question.
- Không tạo logic riêng phức tạp cho từng loại trong V1 nếu chưa cần.

---

## 9. Data Model bổ sung cho V1

### 9.1. Cập nhật bảng `box`

Bổ sung giá trị hợp lệ cho `box_type`:

```txt
Message, Goal, Memory, Decision, Secret, Challenge, Letter
```

Ghi chú kỹ thuật: nếu SQLite schema hiện tại dùng CHECK constraint cho `box_type`, cần migration tạo bảng mới hoặc bỏ constraint cũ để hỗ trợ type mới.

### 9.2. Bảng `box_teaser`

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `id` | TEXT | Yes | ID teaser |
| `box_id` | TEXT | Yes | FK tới `box.id` |
| `teaser_text` | TEXT | Yes | Nội dung gợi ý |
| `unlock_at` | TEXT/ISO Date | Yes | Thời điểm teaser được hiển thị |
| `is_system_generated` | INTEGER/BOOLEAN | Yes | 1 nếu teaser do hệ thống tạo, 0 nếu người dùng nhập |
| `created_at` | TEXT/ISO Date | Yes | Ngày tạo teaser |

Index đề xuất:

```sql
CREATE INDEX idx_box_teaser_box_id ON box_teaser(box_id);
CREATE INDEX idx_box_teaser_unlock_at ON box_teaser(unlock_at);
```

### 9.3. Bảng `box_prediction`

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `id` | TEXT | Yes | ID prediction |
| `box_id` | TEXT | Yes | FK tới `box.id` |
| `prediction_text` | TEXT | Yes | Nội dung dự đoán |
| `created_at` | TEXT/ISO Date | Yes | Ngày tạo |
| `updated_at` | TEXT/ISO Date | No | Ngày sửa gần nhất |

Rule:

- Mỗi hộp có tối đa 1 prediction active.
- Prediction read-only sau khi hộp đã mở.

### 9.4. Cập nhật bảng `reflection_question`

Bổ sung field:

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `reflection_note` | TEXT | No | Cảm nhận sau khi mở hộp |
| `rating` | INTEGER | No | Rating 1-5 |
| `updated_at` | TEXT/ISO Date | No | Ngày cập nhật reflection note |

### 9.5. Cập nhật bảng `notification_schedule`

Bổ sung field:

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `kind` | TEXT | Yes | `unlock`, `teaser_30d`, `teaser_7d`, `teaser_1d` |

Rule:

- Một hộp có thể có nhiều notification schedule.
- Khi xóa hộp, hủy tất cả notification theo `box_id`.

---

## 10. Roadmap triển khai

### Sprint 0 — PRD Consistency & Core Guard

- Cập nhật version PRD lên 1.2.
- Sửa NFR-S1: MVP không yêu cầu encryption at rest.
- Sửa F-15: chỉ cho xóa hộp đã khóa, không cho sửa.
- Sửa preset ngày mở theo Q3: 1 tháng, 3 tháng, 6 tháng, 1 năm.
- Đảm bảo `openBox()` kiểm tra ngày mở ở tầng business logic/data.

### Sprint 1 — Core Lock & QA

- Test lại toàn bộ luồng tạo hộp.
- Test hộp không lộ content/ảnh khi Locked.
- Test ReadyToOpen và Opened.
- Test local notification ngày mở.
- Test xóa hộp và hủy notification.
- Test App Lock nếu đã triển khai.

### Sprint 2 — Mystery Teaser

- Thêm type/model `BoxTeaser`.
- Thêm bảng `box_teaser` và migration.
- Thêm repository/service cho teaser.
- Thêm UI nhập teaser trong Create Box Form.
- Thêm UI hiển thị teaser trong Locked Box Detail.
- Thêm badge “Có gợi ý mới” nếu phù hợp.

### Sprint 3 — Curiosity Notification

- Thêm field `kind` vào `notification_schedule`.
- Schedule notification 30 ngày, 7 ngày, 1 ngày và ngày mở nếu mốc hợp lệ.
- Deep link notification vào đúng màn.
- Hủy tất cả notification khi xóa hộp.

### Sprint 4 — Prediction Before Opening

- Thêm bảng `box_prediction`.
- Thêm repository/service cho prediction.
- Thêm input prediction ở Locked Box Detail.
- Hiển thị prediction ở Opened Detail.
- Chặn sửa prediction sau khi hộp đã mở.

### Sprint 5 — Opening Ritual

- Nâng cấp màn Pre-open.
- Thêm animation mở hộp.
- Thêm haptic optional.
- Chống double tap khi mở hộp.
- Đảm bảo fallback khi animation lỗi.

### Sprint 6 — Post-open Reflection & Next Box CTA

- Thêm `reflection_note`, `rating` vào data model.
- Thêm UI viết cảm nhận sau khi mở.
- Hiển thị reflection note ở chi tiết hộp đã mở.
- Thêm CTA tạo hộp mới.

### Sprint 7 — Personal Stats & New Box Types

- Thêm màn Stats.
- Tính tổng số hộp, số hộp mở/khóa/sẵn sàng mở.
- Tính tỷ lệ Goal/Challenge hoàn thành.
- Thêm Secret, Challenge, Letter vào constants, UI chọn loại và validation.

### Sprint 8 — V2 Exploration, chưa code trong V1

- Nghiên cứu cloud sync.
- Nghiên cứu gửi hộp cho người khác.
- Nghiên cứu hộp nhóm.
- Nghiên cứu AI viết thư/reflection.

---

## 11. Change Log

| Version | Ngày | Nội dung thay đổi |
|---------|------|-------------------|
| 1.1 | 2026-06-11 | Xác nhận PRD MVP: offline-first, single-device, tạo hộp, khóa, mở, reflection, notification, ảnh, app lock. |
| 1.2 | 2026-06-19 | Bổ sung V1 — Curiosity & Engagement: Mystery Teaser, Curiosity Notification, Prediction Before Opening, Opening Ritual, Post-open Reflection Note, Create Next Box CTA, Personal Stats, New Box Types. Đồng thời chỉnh NFR-S1, F-15 và preset ngày mở để thống nhất với quyết định đã xác nhận. |

---

*Hết tài liệu PRD v1.2. Trạng thái: **MVP confirmed ✓ → V1 Curiosity & Engagement planning**.*

