import { useMemo, useState } from "react";
import OrderInfoCard from "../../components/User/Order/OrderInfoCard";
import ShippingAddressSection from "../../components/User/Order/ShippingAddressSection";
import VoucherCard from "../../components/User/Order/VoucherCard";
import PaymentSummaryCard from "../../components/User/Order/PaymentSummaryCard";
import {
  mockAddresses,
  mockOrderItems,
  mockVouchers,
} from "../../components/User/Order/mockData";

export default function OrderPage() {
  const [selectedAddressId, setSelectedAddressId] = useState(
    mockAddresses.find((address) => address.isDefault)?.id || mockAddresses[0]?.id || "",
  );
  const [selectedVoucherId, setSelectedVoucherId] = useState(mockVouchers[0]?.id || "");

  const subtotal = useMemo(
    () =>
      mockOrderItems.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      ),
    [],
  );

  const selectedVoucher = useMemo(
    () => mockVouchers.find((voucher) => voucher.id === selectedVoucherId),
    [selectedVoucherId],
  );

  const shippingFee = 0;
  const discount = selectedVoucher?.discount || 0;

  const handleAddAddress = () => {
    // TODO: thay bằng modal/form + API tạo địa chỉ khi backend user sẵn sàng.
    console.log("Add new shipping address");
  };

  const handlePay = () => {
    // TODO: thay bằng API thanh toán khi backend user sẵn sàng.
    console.log("Submit order", {
      selectedAddressId,
      selectedVoucherId,
      items: mockOrderItems,
    });
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] px-10 py-12">
      <h1 className="text-5xl font-bold leading-[56px] text-emerald-950">Xác nhận đơn hàng</h1>

      <div className="mt-10 grid grid-cols-1 gap-10 xl:grid-cols-[696px_464px]">
        <div className="space-y-12">
          <OrderInfoCard items={mockOrderItems} subtotal={subtotal} />

          <ShippingAddressSection
            addresses={mockAddresses}
            selectedAddressId={selectedAddressId}
            onSelectAddress={setSelectedAddressId}
            onAddAddress={handleAddAddress}
          />
        </div>

        <div>
          <div className="space-y-4">
            <VoucherCard
              vouchers={mockVouchers}
              selectedVoucherId={selectedVoucherId}
              onChangeVoucher={setSelectedVoucherId}
            />
            <PaymentSummaryCard
              subtotal={subtotal}
              shippingFee={shippingFee}
              discount={discount}
              onPay={handlePay}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
