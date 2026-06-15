import { MOCK_DEALER_PRODUCTS } from "./dealerProductMockData";

function product(id) {
    return MOCK_DEALER_PRODUCTS.find((item) => item.id === id);
}

function buildItem(productId, quantity) {
    const p = product(productId);
    if (!p) return null;
    const unitPrice = Number(p.retail_price);
    return {
        id: `item-${p.id}`,
        dealer_product_id: p.id,
        product_name: p.title,
        product_unit: p.supplier_product_unit,
        product_thumbnail_url: p.thumbnail,
        quantity,
        unit_price: String(unitPrice),
        subtotal: String(unitPrice * quantity),
    };
}

function buildItems(entries) {
    return entries.map(([id, qty]) => buildItem(id, qty)).filter(Boolean);
}

const defaultAddress = {
    receiver: "Nguyễn Văn A",
    phone: "0901 234 567",
    detail: "65 Huỳnh Thúc Kháng, Phường Sài Gòn, TP.HCM",
};

export const MOCK_USER_ORDERS = [
    {
        id: 1,
        order_code: "ORD-2024-089",
        status: "preparing",
        created_at: "2024-05-24T08:30:00.000Z",
        dealer_name: "CKC Fresh Mart",
        payment_method: "Thanh toán khi nhận hàng (COD)",
        shipping_address: defaultAddress,
        note: "Giao buổi sáng, gọi trước 15 phút.",
        shipping_fee: "0",
        discount: "0",
        items: buildItems([
            [1, 2],
            [2, 3],
            [5, 1],
        ]),
        status_histories: [
            { status: "received", label: "Đã nhận đơn", at: "2024-05-24T08:30:00.000Z" },
            { status: "preparing", label: "Đang chuẩn bị hàng", at: "2024-05-24T09:00:00.000Z" },
        ],
    },
    {
        id: 2,
        order_code: "ORD-2024-076",
        status: "shipping",
        created_at: "2024-05-22T14:15:00.000Z",
        dealer_name: "GreenLand Store",
        payment_method: "Chuyển khoản ngân hàng",
        shipping_address: defaultAddress,
        note: "",
        shipping_fee: "15000",
        discount: "10000",
        items: buildItems([
            [4, 2],
            [8, 1],
        ]),
        status_histories: [
            { status: "received", label: "Đã nhận đơn", at: "2024-05-22T14:15:00.000Z" },
            { status: "preparing", label: "Đang chuẩn bị hàng", at: "2024-05-22T15:00:00.000Z" },
            { status: "shipping", label: "Đang giao hàng", at: "2024-05-23T07:30:00.000Z" },
        ],
    },
    {
        id: 3,
        order_code: "ORD-2024-065",
        status: "completed",
        created_at: "2024-05-20T10:00:00.000Z",
        dealer_name: "FarmFresh Đà Lạt",
        payment_method: "Thanh toán khi nhận hàng (COD)",
        shipping_address: defaultAddress,
        note: "",
        shipping_fee: "0",
        discount: "5000",
        items: buildItems([
            [3, 2],
            [6, 1],
        ]),
        status_histories: [
            { status: "received", label: "Đã nhận đơn", at: "2024-05-20T10:00:00.000Z" },
            { status: "preparing", label: "Đang chuẩn bị hàng", at: "2024-05-20T11:00:00.000Z" },
            { status: "shipping", label: "Đang giao hàng", at: "2024-05-21T08:00:00.000Z" },
            { status: "completed", label: "Giao hàng thành công", at: "2024-05-21T15:20:00.000Z" },
        ],
    },
    {
        id: 4,
        order_code: "ORD-2024-051",
        status: "cancelled",
        created_at: "2024-05-18T16:45:00.000Z",
        dealer_name: "CKC Fresh Mart",
        payment_method: "Ví GreenMarket",
        shipping_address: defaultAddress,
        note: "Khách hủy do đổi lịch",
        shipping_fee: "0",
        discount: "0",
        items: buildItems([[7, 2]]),
        status_histories: [
            { status: "received", label: "Đã nhận đơn", at: "2024-05-18T16:45:00.000Z" },
            { status: "cancelled", label: "Đã hủy đơn", at: "2024-05-18T17:10:00.000Z" },
        ],
    },
    {
        id: 5,
        order_code: "ORD-2024-042",
        status: "received",
        created_at: "2024-06-12T07:20:00.000Z",
        dealer_name: "GreenLand Store",
        payment_method: "Thanh toán khi nhận hàng (COD)",
        shipping_address: defaultAddress,
        note: "",
        shipping_fee: "0",
        discount: "0",
        items: buildItems([[1, 1]]),
        status_histories: [
            { status: "received", label: "Đã nhận đơn", at: "2024-06-12T07:20:00.000Z" },
        ],
    },
];

export function getMockUserOrderById(id) {
    return MOCK_USER_ORDERS.find((order) => String(order.id) === String(id)) ?? null;
}
