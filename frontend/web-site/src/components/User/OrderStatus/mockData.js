export const orderStatusSteps = [
  { key: "received", label: "Đã nhận" },
  { key: "preparing", label: "Chuẩn bị" },
  { key: "shipping", label: "Giao hàng" },
  { key: "completed", label: "Hoàn thành" },
];

export const mockPreparingOrder = {
  id: "#ORD-2023-089",
  customerName: "Nhà hàng Sen Việt",
  orderedAt: "Ngày đặt: 24/05/2024 • 08:30 AM",
  statusLabel: "Đang chuẩn bị",
  statusTone: "preparing",
  currentStep: "preparing",
  items: [
    { id: "p-1", name: "50kg Rau cải thìa hữu cơ", price: 1250000 },
    { id: "p-2", name: "20kg Cà chua cherry", price: 1200000 },
    { id: "p-3", name: "15kg Hành tây Đà Lạt", price: 800000 },
  ],
};

export const mockCompletedOrder = {
  id: "#ORD-2023-085",
  customerName: "Farm Fresh Gia Lai",
  orderedAt: "Ngày đặt: 20/05/2024 • 02:15 PM",
  statusLabel: "Đã hoàn thành",
  statusTone: "completed",
  image: "https://placehold.co/80x80",
  title: "Gói Rau Củ",
  subtitle: "Và 2 sản phẩm khác...",
  total: 1450000,
};

export const formatCurrency = (value) =>
  `${new Intl.NumberFormat("vi-VN").format(value)} đ`;
