import { useState } from "react";
import OrderInfoCard from "../../components/user/Payment/OrderInfoCard";
import ShippingAddressCard from "../../components/user/Payment/ShippingAddressCard";
import PaymentMethodSelector from "../../components/user/Payment/PaymentMethodSelector";
import BankingDetailsCard from "../../components/user/Payment/BankingDetailsCard";
import {
  mockBankingInfo,
  mockOrderItems,
  mockShippingAddress,
} from "../../components/user/Payment/mockData";

export default function PaymentPage() {
  const [selectedMethod, setSelectedMethod] = useState("cod");

  const handleConfirmPayment = () => {
    // TODO: thay bằng API thanh toán khi backend user sẵn sàng.
    console.log("Confirm payment", {
      method: selectedMethod,
      items: mockOrderItems,
      shippingAddress: mockShippingAddress,
    });
  };

  return (
    <div className="mx-auto w-full max-w-[768px] px-10 pb-20 pt-24">
      <h1 className="text-3xl font-semibold text-emerald-950">Thanh toán đơn hàng</h1>

      <div className="mt-2 space-y-6">
        <OrderInfoCard items={mockOrderItems} />
        <ShippingAddressCard address={mockShippingAddress} />
        <PaymentMethodSelector
          selectedMethod={selectedMethod}
          onSelectMethod={setSelectedMethod}
        />

        {selectedMethod === "banking" && <BankingDetailsCard bankingInfo={mockBankingInfo} />}

        <div className="pt-4">
          <button
            type="button"
            onClick={handleConfirmPayment}
            className="w-full rounded-lg bg-green-900 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:bg-green-950"
          >
            Xác nhận thanh toán
          </button>
        </div>
      </div>
    </div>
  );
}
