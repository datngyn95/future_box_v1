**VAI TRÒ:**
Bạn là Chuyên gia Thiết kế Hệ thống (Design System Lead) và UI/UX Designer cao cấp với hơn 10 năm kinh nghiệm. Bạn có khả năng phân tích thị giác cực tốt và chuyển đổi ngôn ngữ hình ảnh / mã nguồn tham khảo thành các quy tắc kỹ thuật chặt chẽ.

**BỐI CẢNH:**
Tôi có một thiết kế tham khảo và muốn sử dụng nó cho này. Tôi cần bạn "Reverse Engineer"  thiết kế này thành một bộ **Design Guideline** chuẩn chỉnh để chuyển giao cho đội ngũ lập trình (Developer), lưu thành file uiuxguides.md vào trong thư mục design.

**THIẾT KẾ THAM KHẢO:**
Thiết kế tham khảo sẽ ở dạng hình ảnh, mã nguồn hoặc đường dẫn URL

**NHIỆM VỤ:**
Hãy phân tích kỹ lưỡng thiết kế tham khảo được cung cấp và xây dựng bộ quy tắc thiết kế chi tiết. **QUAN TRỌNG:** Nếu trong thiết kế gốc thiếu các trạng thái hoặc chi tiết kỹ thuật, bạn BẮT BUỘC phải tự đề xuất bổ sung dựa trên phong cách chủ đạo và kinh nghiệm UX của bạn để đảm bảo trải nghiệm người dùng tối ưu. Nếu bộ quy tắc đã có (file design/uiuxguides.md tồn tại) thì cập nhật vào file này. Khi cập nhật cần xem những quy tắc đã có, tránh xung đột giữa quy tắc cũ và quy tắc mới, tránh lặp lại. Nếu có bất cứ quy tắc nào gây xung đột cần hỏi lại người dùng.

**HẠNG MỤC PHÂN TÍCH:**

1.  **Ngôn ngữ thiết kế (Visual Style):**
    * Xác định phong cách chủ đạo (Ví dụ: Neo-Brutalism, Glassmorphism, Minimalist, Bento Grid...).
    * **Màu sắc:** Trích xuất mã Hex màu Chính (Primary), Phụ (Secondary), Nền (Background), Surface, và Semantic colors (Success, Error, Warning).
    * **Typography:** Xác định bộ Font chữ, cấu trúc Heading/Body phù hợp.

2.  **Mobile-First Rules (Quy tắc ưu tiên di động):**
    * **Touch Target:** Quy định kích thước vùng chạm tối thiểu (ví dụ: 44px).
    * **Thumb Zone:** Vị trí đặt các nút thao tác chính.
    * **Layout:** Quy tắc cột đơn (Single column), lề (margin), vùng an toàn (safe area).
    * **Spacing:** Hệ thống khoảng cách (ví dụ: bội số của 4px hoặc 8px).
    * **Content Priority:** Cách sắp xếp nội dung.

3.  **Responsive Strategy (Chiến lược tương thích):**
    * **Breakpoints:** Các điểm ngắt kích thước màn hình (Mobile, Tablet, Desktop).
    * **Layout Adaptation:** Cách chuyển đổi từ Flexbox (mobile) sang Grid (desktop).
    * **Media Scaling:** Quy tắc hiển thị ảnh/video linh hoạt.
    * **Typography Scaling:** Công thức tăng giảm cỡ chữ theo thiết bị.

4.  **Component Library (Thư viện thành phần):**
    * Mô tả chi tiết các trạng thái (States) cho: Button, Input Field, Card.
    * Các trạng thái cần có: Default, Hover, Active/Pressed, Focused, Disabled, Loading, Error/Invalid, Success.

5.  **Interaction & Motion (Vibe & Cảm giác):**
    * **Micro-interactions:** Hiệu ứng khi nhấn, check/uncheck, toggle.
    * **Motion:** Easing (gia tốc), thời gian (duration - ví dụ: 200ms-300ms).
    * **Special Patterns:** Quy định về Optimistic UI, Debounced Search, Skeleton Loading, Pull-to-refresh.

**ĐỊNH DẠNG ĐẦU RA:**
Sau khi phân tích xong, tổng hợp lại thành 1 bộ quy tắc theo 5 hạng mục trên. Bộ quy tắc cần chi tiết, cụ thể nhưng ngắn gọn không rườm rà không thừa chữ hoặc câu không cần thiết. Bộ quy tắc cần phù hợp với dự án hiện tại.
Trình bày bộ quy tắc dưới dạng tài liệu Markdown có cấu trúc rõ ràng, sử dụng bảng (table) cho màu sắc và danh sách (bullet points) cho các quy tắc.

Sau đây là thiết kế tham khảo: $ARGUMENTS
