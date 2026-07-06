// Danh sách các kỳ thống kê hiển thị trên thanh chip lọc
export const ORDER_STATS_PERIODS = [
  { key: 'day', label: 'Theo ngày' },
  { key: 'month', label: 'Theo tháng' },
  { key: 'year', label: 'Theo năm' },
];

// Nhãn mô tả khoảng thời gian hiển thị cạnh biểu đồ
export const PERIOD_LABEL = {
  day: '7 ngày gần nhất',
  month: '6 tháng gần nhất',
  year: '5 năm gần nhất',
};

// Đơn vị dùng để tính "TB đơn / <đơn vị>"
export const PERIOD_UNIT = {
  day: 'ngày',
  month: 'tháng',
  year: 'năm',
};

// Dữ liệu mẫu dùng tạm khi API lỗi hoặc đang phát triển UI (fallback)
export const FALLBACK_ORDER_STATS = {
  day: {
    labels: ['26/06', '27/06', '28/06', '29/06', '30/06', '01/07', '02/07'],
    sold: [9, 12, 7, 14, 10, 16, 13],
    cancelled: [1, 0, 2, 1, 0, 1, 0],
  },
  month: {
    labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    sold: [62, 58, 71, 80, 76, 91],
    cancelled: [4, 3, 5, 2, 3, 4],
  },
  year: {
    labels: ['2022', '2023', '2024', '2025', '2026'],
    sold: [320, 410, 505, 640, 410],
    cancelled: [22, 25, 18, 30, 14],
  },
};
