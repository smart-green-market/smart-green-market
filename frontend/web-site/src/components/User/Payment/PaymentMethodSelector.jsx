import { CircleDollarSign, Landmark } from "lucide-react";

function MethodOption({ id, label, description, icon, active, onSelect }) {
  const Icon = icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`w-full flex items-center justify-between rounded-lg p-4 text-left transition ${
        active
          ? "bg-zinc-100 outline outline-2 outline-teal-800"
          : "bg-zinc-100/60 opacity-80 outline outline-1 outline-teal-800/30"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`h-6 w-6 ${active ? "text-teal-800" : "text-neutral-700"}`} />
        <div>
          <p className={`text-base ${active ? "font-bold text-emerald-950" : "font-bold text-neutral-700"}`}>
            {label}
          </p>
          <p className="text-base font-normal text-neutral-700">{description}</p>
        </div>
      </div>

      {active ? (
        <div className="flex h-6 w-6 items-center justify-center rounded-full outline outline-2 outline-teal-800">
          <div className="h-3 w-3 rounded-full bg-teal-800" />
        </div>
      ) : (
        <div className="h-6 w-6 rounded-full border-2 border-stone-300" />
      )}
    </button>
  );
}

export default function PaymentMethodSelector({ selectedMethod, onSelectMethod }) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm outline outline-1 outline-stone-300/20">
      <div className="flex items-center gap-2">
        <CircleDollarSign className="h-5 w-5 text-teal-800" />
        <h2 className="text-2xl font-semibold text-zinc-900">Phương thức thanh toán</h2>
      </div>

      <div className="mt-4 space-y-3">
        <MethodOption
          id="cod"
          icon={CircleDollarSign}
          label="COD (Thanh toán khi nhận hàng)"
          description="Trả tiền trước, giao tận tay"
          active={selectedMethod === "cod"}
          onSelect={onSelectMethod}
        />
        <MethodOption
          id="banking"
          icon={Landmark}
          label="Thanh toán qua Ngân hàng"
          description="Trả tiền trước, giao tận tay"
          active={selectedMethod === "banking"}
          onSelect={onSelectMethod}
        />
      </div>
    </section>
  );
}
