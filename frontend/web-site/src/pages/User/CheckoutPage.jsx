import React, { useEffect, useMemo, useState } from "react";
import CheckoutHeader from "../../components/User/Checkout/CheckoutHeader";
import AddressSelector from "../../components/User/Checkout/AddressSelector";
import OrderItemsList from "../../components/User/Checkout/OrderItemsList";
import PaymentMethodSelector from "../../components/User/Checkout/PaymentMethodSelector";
import OrderNote from "../../components/User/Checkout/OrderNote";
import OrderSummary from "../../components/User/Checkout/OrderSummary";
import AddAddressModal from "../../components/User/Checkout/AddAddressModal";

/**
 * =========================================================================
 * CHECKOUT PAGE — trang đặt hàng
 * =========================================================================
 * Trang này hiện đang dùng MOCK DATA để dựng UI. Khi tích hợp backend,
 * tìm các comment "// [API]" bên dưới để biết chính xác chỗ cần thay
 * bằng lệnh gọi API thực tế (fetch / axios / react-query / v.v.)
 * =========================================================================
 */

const PAYMENT_METHODS = [
  {
    id: "cod",
    label: "Thanh toán khi nhận hàng",
    description: "Trả tiền mặt cho shipper",
  },
  {
    id: "bank",
    label: "Chuyển khoản ngân hàng",
    description: "Quét QR hoặc chuyển khoản",
  },
  {
    id: "wallet",
    label: "Ví điện tử",
    description: "Momo, ZaloPay, VNPay...",
  },
];

export default function CheckoutPage() {
  // ----------------------------------------------------------------------
  // STATE
  // ----------------------------------------------------------------------
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [storeName, setStoreName] = useState("");
  const [items, setItems] = useState([]);

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [note, setNote] = useState("");

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // ----------------------------------------------------------------------
  // [API] Tải dữ liệu cần thiết khi vào trang:
  //   1. Danh sách địa chỉ nhận hàng đã lưu của user
  //      GET /api/users/me/addresses
  //   2. Các sản phẩm đang được chọn trong giỏ hàng để thanh toán
  //      GET /api/cart/checkout-items  (hoặc nhận qua state/query khi
  //      chuyển trang từ trang Giỏ hàng, ví dụ: ?cartItemIds=1,2,3)
  //
  // Gợi ý triển khai thực tế:
  //
  // useEffect(() => {
  //   const fetchCheckoutData = async () => {
  //     try {
  //       setIsLoading(true);
  //       const [addressRes, cartRes] = await Promise.all([
  //         fetch("/api/users/me/addresses").then((r) => r.json()),
  //         fetch("/api/cart/checkout-items").then((r) => r.json()),
  //       ]);
  //
  //       setAddresses(addressRes.data);
  //       const defaultAddr = addressRes.data.find((a) => a.isDefault);
  //       setSelectedAddressId(defaultAddr?.id ?? addressRes.data[0]?.id ?? null);
  //
  //       setStoreName(cartRes.data.storeName);
  //       setItems(cartRes.data.items);
  //     } catch (err) {
  //       setErrorMessage("Không thể tải thông tin đặt hàng. Vui lòng thử lại.");
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //
  //   fetchCheckoutData();
  // }, []);
  // ----------------------------------------------------------------------
  useEffect(() => {
    // MOCK: giả lập gọi API bằng setTimeout — XÓA khi đã nối API thật
    const timer = setTimeout(() => {
      const mockAddresses = [
        {
          id: "addr-1",
          name: "Nguyễn Văn A",
          phone: "0909123456",
          address: "12 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
          isDefault: true,
        },
        {
          id: "addr-2",
          name: "Nguyễn Văn A",
          phone: "0909123456",
          address: "45 Đường Nguyễn Huệ, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
          isDefault: false,
        },
      ];

      const mockItems = [
        {
          id: "item-1",
          name: "Rau cải thìa",
          image: null,
          unit: "kg",
          price: 45000,
          quantity: 2,
        },
        {
          id: "item-2",
          name: "Rau muống sạch",
          image: null,
          unit: "bó",
          price: 15000,
          quantity: 3,
        },
        {
          id: "item-3",
          name: "Xà lách lô lô",
          image: null,
          unit: "kg",
          price: 25000,
          quantity: 1,
        },
      ];

      setAddresses(mockAddresses);
      setSelectedAddressId(
        mockAddresses.find((a) => a.isDefault)?.id ?? mockAddresses[0]?.id
      );
      setStoreName("CKC Fresh Mart");
      setItems(mockItems);
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  // ----------------------------------------------------------------------
  // TÍNH TOÁN GIÁ TRỊ ĐƠN HÀNG
  // ----------------------------------------------------------------------
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const shippingFee = 0; // Miễn phí vận chuyển — có thể tính lại từ API tuỳ địa chỉ
  const discount = 0;
  const total = subtotal + shippingFee - discount;

  // ----------------------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------------------

  // [API] Lưu địa chỉ mới
  // POST /api/users/me/addresses  { name, phone, address, isDefault }
  // -> sau khi thành công, thêm vào state `addresses` (hoặc gọi lại GET list)
  const handleAddAddress = (newAddress) => {
    const addressWithId = { ...newAddress, id: `addr-${Date.now()}` };

    // MOCK: cập nhật state cục bộ — thay bằng kết quả trả về từ API thật
    setAddresses((prev) => [...prev, addressWithId]);
    setSelectedAddressId(addressWithId.id);
    setIsAddressModalOpen(false);
  };

  // [API] Tạo đơn hàng
  // POST /api/orders
  // Body mẫu:
  // {
  //   addressId: selectedAddressId,
  //   paymentMethod,
  //   note,
  //   items: items.map(i => ({ productId: i.id, quantity: i.quantity })),
  // }
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // MOCK: giả lập gọi API — thay bằng đoạn dưới khi có backend thật
      //
      // const res = await fetch("/api/orders", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     addressId: selectedAddressId,
      //     paymentMethod,
      //     note,
      //     items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      //   }),
      // });
      // if (!res.ok) throw new Error("Đặt hàng thất bại");
      // const order = await res.json();
      // navigate(`/orders/${order.id}`); // điều hướng sang trang chi tiết đơn hàng

      await new Promise((resolve) => setTimeout(resolve, 800)); // mock delay
      alert("Đặt hàng thành công! (mock) — Mã đơn: ORD-2026-001");
    } catch (err) {
      setErrorMessage("Đặt hàng không thành công. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-400">Đang tải thông tin đặt hàng...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <CheckoutHeader />

        {errorMessage && (
          <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Cột trái: địa chỉ, sản phẩm, thanh toán, ghi chú */}
          <div className="space-y-6 lg:col-span-2">
            <AddressSelector
              addresses={addresses}
              selectedId={selectedAddressId}
              onSelect={setSelectedAddressId}
              onAddNew={() => setIsAddressModalOpen(true)}
            />

            <OrderItemsList storeName={storeName} items={items} />

            <PaymentMethodSelector
              methods={PAYMENT_METHODS}
              selectedId={paymentMethod}
              onSelect={setPaymentMethod}
            />

            <OrderNote value={note} onChange={setNote} />
          </div>

          {/* Cột phải: tóm tắt đơn hàng */}
          <div className="lg:col-span-1">
            <OrderSummary
              itemCount={items.length}
              subtotal={subtotal}
              shippingFee={shippingFee}
              discount={discount}
              total={total}
              onSubmit={handlePlaceOrder}
              submitting={isSubmitting}
              disabled={!selectedAddressId}
            />
          </div>
        </div>
      </div>

      <AddAddressModal
        open={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleAddAddress}
      />
    </div>
  );
}
