import ActiveOrderCard from "../../components/user/OrderStatus/ActiveOrderCard";
import CompletedOrderCard from "../../components/user/OrderStatus/CompletedOrderCard";
import {
  mockCompletedOrder,
  mockPreparingOrder,
} from "../../components/user/OrderStatus/mockData";

export default function OrderStatusPage() {
  return (
    <div className="mx-auto w-full max-w-[896px] pb-20 pt-[62px]">
      <section className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-emerald-950">Đơn hàng của bạn</h1>
          <p className="text-base font-normal text-neutral-700">
            Quản lý và theo dõi lộ trình nông sản từ trang trại đến bàn ăn.
          </p>
        </div>

        <div className="space-y-6">
          <ActiveOrderCard order={mockPreparingOrder} />
          <CompletedOrderCard order={mockCompletedOrder} />
        </div>
      </section>
    </div>
  );
}
