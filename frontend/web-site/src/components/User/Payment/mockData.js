export const mockOrderItems = [
  {
    id: "payment-item-1",
    name: "Rau 1",
    image: "https://placehold.co/64x64",
    quantity: 2,
    unit: "kg",
    totalPrice: 90000,
  },
  {
    id: "payment-item-2",
    name: "Rau 2",
    image: "https://placehold.co/64x64",
    quantity: 1.5,
    unit: "kg",
    totalPrice: 60000,
  },
];

export const mockShippingAddress = {
  receiver: "Nguyễn Văn A",
  phone: "0901 234 567",
  detail: "65 Huỳnh Thúc Kháng, Phường Sài Gòn, Tp.HCM",
};

export const mockBankingInfo = {
  receiverName: "Smart Green Market - VNPay",
  transferCode: "GMKT_2024_8892",
  qrImage: "https://placehold.co/240x240",
  note: "Hệ thống sẽ tự động xác nhận sau 1-2 phút kể từ khi giao dịch thành công.",
};

export function formatCurrency(value) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}
