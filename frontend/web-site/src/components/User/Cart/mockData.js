export const mockCartItems = [
  {
    id: "rau-1",
    name: "Rau 1",
    price: 45000,
    unit: "kg",
    quantity: 2,
    selected: true,
    image: "./public/images/rau.jpg",
  },
  {
    id: "rau-2",
    name: "Rau 2",
    price: 45000,
    unit: "kg",
    quantity: 1,
    selected: true,
    image: "./public/images/rau.jpg",
  },
  {
    id: "rau-3",
    name: "Rau 3",
    price: 45000,
    unit: "kg",
    quantity: 1,
    selected: false,
    image: "./public/images/rau.jpg",
  },
];

export const mockSuggestedProducts = [
  {
    id: "goi-y-1",
    category: "Nông sản",
    name: "Rau 1",
    price: 45000,
    unit: "kg",
    image: "./public/images/rau.jpg",
  },
  {
    id: "goi-y-2",
    category: "Nông sản",
    name: "Rau 2",
    price: 45000,
    unit: "kg",
    image: "./public/images/rau.jpg",
  },
  {
    id: "goi-y-3",
    category: "Nông sản",
    name: "Rau 3",
    price: 45000,
    unit: "kg",
    image: "./public/images/rau.jpg",
  },
  {
    id: "goi-y-4",
    category: "Nông sản",
    name: "Rau 4",
    price: 45000,
    unit: "kg",
    image: "./public/images/rau.jpg",
  },
];

export function formatCurrency(value) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}
