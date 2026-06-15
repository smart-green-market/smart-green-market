import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag } from "lucide-react";
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
  const selectedCount = selectedItems.length;
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
    console.log("Checkout payload (mock):", selectedItems);
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
          <ShoppingBag className="h-5 w-5 text-emerald-800" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-emerald-950">Giỏ hàng của tôi</h1>
          <p className="text-sm text-neutral-600">
            {cartItems.length} sản phẩm trong giỏ
          </p>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <p className="text-neutral-600">Giỏ hàng trống.</p>
          <Link
            to="/trang-chu"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-800 no-underline hover:text-teal-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại cửa hàng
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
          <div className="space-y-4">
            <CartTable
              items={cartItems}
              allSelected={allSelected}
              onToggleAll={toggleAll}
              onToggleSelect={toggleSelectItem}
              onDecrease={decreaseQuantity}
              onIncrease={increaseQuantity}
              onRemove={removeItem}
            />

            <Link
              to="/trang-chu"
              className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800 no-underline hover:text-teal-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Tiếp tục mua hàng
            </Link>
          </div>

          <aside>
            <OrderSummary
              selectedCount={selectedCount}
              subtotal={subtotal}
              shippingFee={0}
              onCheckout={handleCheckout}
              sticky
            />
          </aside>
        </div>
      )}

      <SuggestedProducts products={mockSuggestedProducts} />
    </div>
  );
}
