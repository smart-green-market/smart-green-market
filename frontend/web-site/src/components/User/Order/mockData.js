export const mockOrderItems = [
  {
    id: "order-item-1",
    name: "Rau 1",
    image: "https://placehold.co/60x60",
    unitPrice: 45000,
    unit: "kg",
    quantity: 2,
  },
  {
    id: "order-item-2",
    name: "Rau 2",
    image: "https://placehold.co/60x60",
    unitPrice: 40000,
    unit: "kg",
    quantity: 1.5,
  },
];

export const mockAddresses = [
  {
    id: "address-1",
    name: "Nguyễn Văn A",
    phone: "0901 234 567",
    address: "65 Huỳnh Thúc Kháng, Phường Sài Gòn, Tp.HCM",
    isDefault: true,
  },
  {
    id: "address-2",
    name: "Trần Thị B",
    phone: "0988 776 655",
    address: "65 Huỳnh Thúc Kháng, Phường Sài Gòn, Tp.HCM",
    isDefault: false,
  },
];

export const mockVouchers = [
  {
    id: "voucher-none",
    label: "Không áp dụng mã",
    discount: 0,
  },
  {
    id: "voucher-10k",
    label: "GREEN10 - Giảm 10.000đ",
    discount: 10000,
  },
];

export function formatCurrency(value) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}
