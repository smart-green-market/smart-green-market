import { Loader2, Plus, Edit3, Check } from "lucide-react";

export default function LoyaltyTiersTab({
  tiers = [],
  loadingTiers,
  onAddTier,
  onEditTier
}) {
  return (
    <div className="space-y-6">
      {/* Header section with add button */}
      <div className="flex justify-between items-center bg-white border border-emerald-100/50 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-emerald-950">Quy chuẩn hạng thành viên</h2>
          <p className="text-xs text-neutral-400 font-medium mt-0.5">Quản lý các cấp bậc và ưu đãi đặc quyền cho khách hàng.</p>
        </div>
        <button
          onClick={onAddTier}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Thêm hạng mới
        </button>
      </div>

      {loadingTiers ? (
        <div className="flex justify-center items-center py-20 bg-white rounded-2xl border border-emerald-100/50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : tiers.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-emerald-100/50 text-neutral-400 text-xs font-semibold">
          Chưa có hạng thành viên nào được cài đặt.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tiers.map((tier) => (
            <div key={tier.id} className={`bg-white border rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between hover:shadow-md ${tier.is_active ? "border-neutral-100" : "border-neutral-200 opacity-60 bg-neutral-50/50"}`}>
              <div>
                {/* Name & Badge Info */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-sm font-black text-neutral-900 truncate">{tier.name}</h3>
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-neutral-100 text-neutral-500 uppercase tracking-wide shrink-0">
                      Cấp {tier.level}
                    </span>
                  </div>
                  {tier.is_system ? (
                    <span className="px-2 py-0.5 text-[9px] font-black rounded bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase shrink-0">
                      Mặc định hệ thống
                    </span>
                  ) : (
                    <button
                      onClick={() => onEditTier(tier)}
                      className="p-1.5 hover:bg-neutral-100 text-neutral-400 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Threshold point */}
                <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl mb-4">
                  <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">Yêu cầu điểm số tối thiểu</span>
                  <span className="text-base font-black text-neutral-800 block mt-0.5">{tier.min_points} điểm</span>
                </div>

                {/* Description */}
                <p className="text-xs text-neutral-500 font-medium mb-4 leading-relaxed">{tier.description || "Chưa có mô tả chi tiết."}</p>

                {/* Benefits */}
                {(() => {
                  const benefitsArray = Array.isArray(tier.benefits)
                    ? tier.benefits
                    : typeof tier.benefits === "string" && tier.benefits.trim()
                    ? [tier.benefits]
                    : [];

                  if (benefitsArray.length === 0) return null;

                  return (
                    <div>
                      <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Đặc quyền được hưởng</h4>
                      <ul className="space-y-1.5">
                        {benefitsArray.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-neutral-600">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
