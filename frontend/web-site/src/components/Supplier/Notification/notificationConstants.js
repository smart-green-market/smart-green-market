// notificationConstants.js
// Hằng số + dữ liệu mẫu cho module Thông báo (Supplier)
// Dữ liệu mẫu mô phỏng response thật của API /api/notifications/my/
// Khi tích hợp API thật, chỉ cần import service của bạn và bỏ MOCK_NOTIFICATIONS đi
// (xem hướng dẫn trong README.md)

// type (warning/info/success/error) → tông màu sẵn có trong hệ thống (a/b/g/r)
export const TYPE_TONE = { warning: 'a', info: 'b', success: 'g', error: 'r' };

// reference_type → icon Tabler tương ứng
export const REF_TYPE_ICON = {
  purchase_order: 'ti-clipboard-list',
  supplier_product: 'ti-package',
  category: 'ti-tags',
  certification: 'ti-certificate',
  supplier_document: 'ti-file-text',
};

// reference_type → trang sẽ điều hướng tới khi bấm hành động trong modal chi tiết
export const REF_TYPE_ACTION = {
  purchase_order: { label: 'Xem phiếu nhập', page: 'orders' },
  supplier_product: { label: 'Xem sản phẩm', page: 'products' },
  category: { label: 'Xem danh mục', page: 'products' },
  certification: { label: 'Xem chứng nhận', page: 'certs' },
  supplier_document: { label: 'Xem hồ sơ', page: 'profile' },
};

// Nhãn tiếng Việt cho reference_status thô từ backend
export const REF_STATUS_LABELS = {
  pending_dealer_confirmation: 'Chờ NCC xác nhận',
  confirmed: 'Đã xác nhận',
  delivered: 'Đã giao',
  completed: 'Hoàn thành',
  returned: 'Yêu cầu trả hàng',
  cancelled: 'Đã hủy',
  rejected: 'Từ chối',
};

// page key → tiêu đề hiển thị trên topbar khi điều hướng từ modal thông báo
export const NOTIF_PAGE_TITLE = {
  orders: 'Đơn hàng',
  products: 'Sản phẩm',
  certs: 'Chứng nhận',
};

// Danh sách chip lọc dùng cho trang danh sách thông báo đầy đủ
export const NOTIF_FILTER_CHIPS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unread', label: 'Chưa đọc' },
  { value: 'warning', label: 'Cảnh báo' },
  { value: 'info', label: 'Thông tin' },
  { value: 'success', label: 'Thành công' },
  { value: 'error', label: 'Thất bại' },
];

// Dữ liệu mẫu — XÓA/THAY bằng dữ liệu lấy từ API thật khi tích hợp
export const MOCK_NOTIFICATIONS = [
  { receipt_id: 775, id: 692, title: '[Phiếu nhập] PN-20260701-0002-0018 — Yêu cầu trả hàng', content: 'Phiếu PN-20260701-0002-0018: Đã giao → Yêu cầu trả hàng.', type: 'warning', type_label: 'Cảnh báo', reference_type: 'purchase_order', reference_type_label: 'Phiếu nhập hàng', reference_id: 95, read_at: null, created_at: '2026-07-01T11:35:45.177994Z', reference_status: 'returned', reference_order_code: 'PN-20260701-0002-0018' },
  { receipt_id: 764, id: 684, title: '[Phiếu nhập] PN-20260701-0002-0019 — Đã giao', content: 'Phiếu PN-20260701-0002-0019: Đang giao → Đã giao.', type: 'info', type_label: 'Thông tin', reference_type: 'purchase_order', reference_type_label: 'Phiếu nhập hàng', reference_id: 96, read_at: null, created_at: '2026-07-01T11:25:07.915525Z', reference_status: 'completed', reference_order_code: 'PN-20260701-0002-0019' },
  { receipt_id: 761, id: 681, title: '[Phiếu nhập] PN-20260701-0002-0019 — Chờ xác nhận tiền cọc', content: 'Phiếu PN-20260701-0002-0019: Đã xác nhận → Chờ xác nhận tiền cọc.', type: 'warning', type_label: 'Cảnh báo', reference_type: 'purchase_order', reference_type_label: 'Phiếu nhập hàng', reference_id: 96, read_at: null, created_at: '2026-07-01T11:24:50.736280Z', reference_status: 'completed', reference_order_code: 'PN-20260701-0002-0019' },
  { receipt_id: 723, id: 644, title: '[Phiếu nhập] PN-20260701-0002-0009 — Chờ NCC xác nhận', content: 'Phiếu nhập PN-20260701-0002-0009 — Chờ NCC xác nhận.', type: 'warning', type_label: 'Cảnh báo', reference_type: 'purchase_order', reference_type_label: 'Phiếu nhập hàng', reference_id: 86, read_at: null, created_at: '2026-07-01T09:11:37.183043Z', reference_status: 'cancelled', reference_order_code: 'PN-20260701-0002-0009' },
  { receipt_id: 690, id: 611, title: '[Phiếu nhập] PN-20260701-0002-0004 — Yêu cầu trả hàng', content: 'Phiếu PN-20260701-0002-0004: Đã giao → Yêu cầu trả hàng.', type: 'warning', type_label: 'Cảnh báo', reference_type: 'purchase_order', reference_type_label: 'Phiếu nhập hàng', reference_id: 70, read_at: null, created_at: '2026-07-01T07:13:47.352952Z', reference_status: 'delivered', reference_order_code: 'PN-20260701-0002-0004' },
  { receipt_id: 637, id: 558, title: '[Phiếu nhập] PN-20260629-0002-0002 — Đã hủy', content: 'Phiếu PN-20260629-0002-0002: Chờ NCC xác nhận → Đã hủy.', type: 'error', type_label: 'Thất bại', reference_type: 'purchase_order', reference_type_label: 'Phiếu nhập hàng', reference_id: 65, read_at: null, created_at: '2026-06-30T03:47:33.583541Z', reference_status: 'cancelled', reference_order_code: 'PN-20260629-0002-0002' },
  { receipt_id: 614, id: 535, title: '[Sản phẩm] "Đậu nành" — Đã duyệt', content: 'Sản phẩm Đậu nành đã được duyệt.', type: 'success', type_label: 'Thành công', reference_type: 'supplier_product', reference_type_label: 'Sản phẩm NCC', reference_id: 27, read_at: null, created_at: '2026-06-29T08:20:24.666415Z', reference_status: null, reference_order_code: null },
  { receipt_id: 603, id: 525, title: '[Sản phẩm] "Hà Noi" — Từ chối', content: 'Sản phẩm Hà Noi đã bị từ chối. Lý do: Ha Noi là trái gì', type: 'error', type_label: 'Thất bại', reference_type: 'supplier_product', reference_type_label: 'Sản phẩm NCC', reference_id: 26, read_at: null, created_at: '2026-06-28T07:50:02.657778Z', reference_status: null, reference_order_code: null },
  { receipt_id: 600, id: 522, title: '[Danh mục] "Rau lá" — Đã khóa', content: 'Danh mục Rau lá đã bị khóa do vi phạm quy định.', type: 'warning', type_label: 'Cảnh báo', reference_type: 'category', reference_type_label: 'Danh mục sản phẩm', reference_id: 2, read_at: null, created_at: '2026-06-27T03:11:04.765093Z', reference_status: null, reference_order_code: null },
  { receipt_id: 527, id: 451, title: '[Danh mục] Rau Mỹ Đình — Đã kích hoạt', content: 'Danh mục Rau Mỹ Đình của bạn đã được duyệt.', type: 'success', type_label: 'Thành công', reference_type: 'category', reference_type_label: 'Danh mục sản phẩm', reference_id: 48, read_at: null, created_at: '2026-06-24T16:57:32.412006Z', reference_status: null, reference_order_code: null },
  { receipt_id: 510, id: 435, title: '[Sản phẩm] "Bắp Cải" — Đã duyệt', content: 'Sản phẩm Bắp Cải đã được duyệt.', type: 'success', type_label: 'Thành công', reference_type: 'supplier_product', reference_type_label: 'Sản phẩm NCC', reference_id: 23, read_at: null, created_at: '2026-06-24T14:19:07.288543Z', reference_status: null, reference_order_code: null },
  { receipt_id: 553, id: 475, title: '[Phiếu nhập] PN-20260624-0002-0006 — Chờ xác nhận thanh toán cuối', content: 'Phiếu PN-20260624-0002-0006: Đã giao → Chờ xác nhận thanh toán cuối.', type: 'warning', type_label: 'Cảnh báo', reference_type: 'purchase_order', reference_type_label: 'Phiếu nhập hàng', reference_id: 54, read_at: null, created_at: '2026-06-26T15:59:31.066598Z', reference_status: 'completed', reference_order_code: 'PN-20260624-0002-0006' },
  { receipt_id: 482, id: 414, title: '[Chứng nhận] VietGAP — Đã duyệt', content: 'Chứng nhận VietGAP của bạn đã được duyệt.', type: 'success', type_label: 'Thành công', reference_type: 'certification', reference_type_label: 'Chứng nhận chất lượng', reference_id: 6, read_at: null, created_at: '2026-06-22T08:45:43.626626Z', reference_status: null, reference_order_code: null },
  { receipt_id: 463, id: 397, title: '[Phiếu nhập] PN-20260621-0002-0001 — Chờ xác nhận thanh toán cuối', content: 'Phiếu PN-20260621-0002-0001: Đã giao → Chờ xác nhận thanh toán cuối.', type: 'warning', type_label: 'Cảnh báo', reference_type: 'purchase_order', reference_type_label: 'Phiếu nhập hàng', reference_id: 35, read_at: null, created_at: '2026-06-21T02:25:32.104900Z', reference_status: 'completed', reference_order_code: 'PN-20260621-0002-0001' },
  { receipt_id: 438, id: 377, title: '[Chứng nhận] Hữu cơ Việt Nam — Đã duyệt', content: 'Chứng nhận Hữu cơ Việt Nam của bạn đã được duyệt.', type: 'success', type_label: 'Thành công', reference_type: 'certification', reference_type_label: 'Chứng nhận chất lượng', reference_id: 5, read_at: null, created_at: '2026-06-20T17:03:28.787981Z', reference_status: null, reference_order_code: null },
  { receipt_id: 408, id: 357, title: '[Phiếu nhập] PN-20260620-0002-0002 — Chờ xác nhận thanh toán cuối', content: 'Phiếu PN-20260620-0002-0002: Đã giao → Chờ xác nhận thanh toán cuối.', type: 'warning', type_label: 'Cảnh báo', reference_type: 'purchase_order', reference_type_label: 'Phiếu nhập hàng', reference_id: 33, read_at: null, created_at: '2026-06-20T16:38:43.334584Z', reference_status: 'completed', reference_order_code: 'PN-20260620-0002-0002' },
  { receipt_id: 41, id: 41, title: '[Giấy tờ] Giấy chứng nhận thuế — Đã duyệt', content: 'Giấy tờ Giấy chứng nhận thuế của bạn đã được duyệt.', type: 'success', type_label: 'Thành công', reference_type: 'supplier_document', reference_type_label: 'Giấy tờ nhà cung cấp', reference_id: 9, read_at: '2026-06-08T02:10:00.000000Z', created_at: '2026-06-08T01:33:27.760417Z', reference_status: null, reference_order_code: null },
  { receipt_id: 40, id: 40, title: '[Giấy tờ] CMND/CCCD — Đã duyệt', content: 'Giấy tờ CMND/CCCD của bạn đã được duyệt.', type: 'success', type_label: 'Thành công', reference_type: 'supplier_document', reference_type_label: 'Giấy tờ nhà cung cấp', reference_id: 8, read_at: '2026-06-08T02:10:00.000000Z', created_at: '2026-06-08T01:33:24.913520Z', reference_status: null, reference_order_code: null },
  { receipt_id: 39, id: 39, title: '[Giấy tờ] Giấy phép kinh doanh — Đã duyệt', content: 'Giấy tờ Giấy phép kinh doanh của bạn đã được duyệt.', type: 'success', type_label: 'Thành công', reference_type: 'supplier_document', reference_type_label: 'Giấy tờ nhà cung cấp', reference_id: 7, read_at: '2026-06-08T02:10:00.000000Z', created_at: '2026-06-08T01:33:21.174754Z', reference_status: null, reference_order_code: null },
];
