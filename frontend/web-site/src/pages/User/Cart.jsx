import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import CartTable from "../../components/User/Cart/CartTable";
import OrderSummary from "../../components/User/Cart/OrderSummary";
import SuggestedProducts from "../../components/User/Cart/SuggestedProducts";
import { mockCartItems, mockSuggestedProducts } from "../../components/User/Cart/mockData";

export default function CartPage() {
  const [cartItems, setCartItems] = useState(mockCartItems);

  const selectedItems = useMemo(
    () => cartItems.filter((item) => item.selected),
    [cartItems],
  );

  const allSelected = cartItems.length > 0 && selectedItems.length === cartItems.length;
  const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const toggleAll = () => {
    const next = !allSelected;
    setCartItems((prev) => prev.map((item) => ({ ...item, selected: next })));
  };

  const toggleSelectItem = (id) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)),
    );
  };

  const increaseQuantity = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  };

  const decreaseQuantity = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item,
      ),
    );
  };

  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCheckout = () => {
    // TODO: thay thế bằng API đặt hàng khi backend user cart sẵn sàng.
    console.log("Checkout payload (mock):", selectedItems);
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] px-10 py-8">
      <h1 className="text-base text-emerald-950">Giỏ hàng của tôi</h1>

      <div className="mt-8 space-y-8">
        <CartTable
          items={cartItems}
          allSelected={allSelected}
          onToggleAll={toggleAll}
          onToggleSelect={toggleSelectItem}
          onDecrease={decreaseQuantity}
          onIncrease={increaseQuantity}
          onRemove={removeItem}
        />

        <button
          type="button"
          className="inline-flex items-center gap-2 text-base font-semibold text-teal-800 hover:text-teal-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Tiếp tục mua hàng
        </button>

        <OrderSummary
          selectedCount={selectedCount}
          subtotal={subtotal}
          shippingFee={0}
          onCheckout={handleCheckout}
        />
      </div>

      <SuggestedProducts products={mockSuggestedProducts} />
    </div>
  );
}
