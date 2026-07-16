import { Loader2, HelpCircle } from "lucide-react";

export default function LoyaltySettingsTab({
  settings,
  onChange,
  loadingSettings,
  savingSettings,
  onSave
}) {
  if (loadingSettings) {
    return (
      <div className="flex justify-center items-center py-20 bg-white rounded-2xl border border-emerald-100/50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-emerald-100/50 rounded-2xl p-6 shadow-xs">
      <h2 className="text-base font-extrabold text-emerald-950 mb-6 flex items-center gap-2">
        Quy tắc quy đổi &amp; Tích lũy
      </h2>

      <form onSubmit={onSave} className="space-y-6">
        {/* Active switch */}
        <div className="flex items-center justify-between p-4 bg-emerald-50/20 border border-emerald-100/50 rounded-xl">
          <div>
            <h3 className="text-xs font-black text-neutral-800 uppercase tracking-wide">Trạng thái hệ thống</h3>
            <p className="text-[11px] text-neutral-400 font-semibold mt-0.5">Bật để khách hàng của bạn bắt đầu tích lũy điểm khi mua hàng.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.is_active || false}
              onChange={(e) => onChange({ ...settings, is_active: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Exchange rate */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1">
              <label className="text-xs font-black text-neutral-800 uppercase tracking-wide">
                Số tiền tương ứng 1 điểm
              </label>
              <div className="group relative">
                <HelpCircle className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-neutral-900 text-white text-[10px] font-bold p-2 rounded-lg shadow-md scale-0 group-hover:scale-100 transition-all pointer-events-none z-15">
                  Ví dụ: Bạn điền 10,000 nghĩa là mỗi 10,000 VNĐ chi tiêu khách sẽ nhận được 1 điểm tích luỹ.
                </div>
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                value={settings?.points_per_unit || ""}
                onChange={(e) => onChange({ ...settings, points_per_unit: e.target.value })}
                className="w-full pl-3 pr-12 py-2.5 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs rounded-xl transition-all font-semibold text-neutral-700"
                min="1"
                required
                disabled={!settings?.is_active}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-400">VNĐ / điểm</span>
            </div>
          </div>

          {/* Include Shipping */}
          <div className="flex flex-col justify-end">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings?.include_shipping_in_points || false}
                onChange={(e) => onChange({ ...settings, include_shipping_in_points: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-neutral-300 mt-0.5 accent-emerald-600"
                disabled={!settings?.is_active}
              />
              <div>
                <span className="text-xs font-black text-neutral-800 block">Tích điểm cả tiền vận chuyển (Phí ship)</span>
                <span className="text-[10px] text-neutral-400 font-semibold block mt-0.5">
                  Nếu bật, điểm tích luỹ sẽ tính dựa trên tổng giá trị thanh toán cuối cùng của đơn hàng.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-6 flex justify-end">
          <button
            type="submit"
            disabled={savingSettings || !settings?.is_active}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            {savingSettings && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Lưu cấu hình
          </button>
        </div>
      </form>
    </div>
  );
}
