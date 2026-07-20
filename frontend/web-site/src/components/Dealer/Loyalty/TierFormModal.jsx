import { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";

export default function TierFormModal({
  isOpen,
  onClose,
  selectedTier,
  savingTier,
  onSave
}) {
  if (!isOpen) return null;

  // Form states
  const [tierCode, setTierCode] = useState("");
  const [tierName, setTierName] = useState("");
  const [tierLevel, setTierLevel] = useState("");
  const [tierMinPoints, setTierMinPoints] = useState("");
  const [tierDesc, setTierDesc] = useState("");
  const [tierBenefits, setTierBenefits] = useState([""]); // array of strings for benefits
  const [tierActive, setTierActive] = useState(true);

  // Initialize values when selectedTier changes or modal opens
  useEffect(() => {
    if (selectedTier) {
      setTierCode(selectedTier.code);
      setTierName(selectedTier.name);
      setTierLevel(selectedTier.level);
      setTierMinPoints(selectedTier.min_points);
      setTierDesc(selectedTier.description);
      setTierBenefits(selectedTier.benefits?.length > 0 ? selectedTier.benefits : [""]);
      setTierActive(selectedTier.is_active);
    } else {
      setTierCode("");
      setTierName("");
      setTierLevel("");
      setTierMinPoints("");
      setTierDesc("");
      setTierBenefits([""]);
      setTierActive(true);
    }
  }, [selectedTier, isOpen]);

  const handleBenefitChange = (index, value) => {
    const newBenefits = [...tierBenefits];
    newBenefits[index] = value;
    setTierBenefits(newBenefits);
  };

  const addBenefitField = () => {
    setTierBenefits([...tierBenefits, ""]);
  };

  const removeBenefitField = (index) => {
    const newBenefits = tierBenefits.filter((_, i) => i !== index);
    setTierBenefits(newBenefits.length > 0 ? newBenefits : [""]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      code: tierCode.trim().toUpperCase(),
      name: tierName.trim(),
      level: parseInt(tierLevel),
      min_points: parseInt(tierMinPoints),
      description: tierDesc.trim(),
      benefits: tierBenefits.filter(b => b.trim() !== ""),
      is_active: tierActive,
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 font-['Geist',sans-serif]">
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-neutral-50/50">
          <h2 className="text-base font-black text-neutral-900">
            {selectedTier ? `Chỉnh sửa hạng ${selectedTier.name}` : "Thêm hạng thành viên mới"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Mã hạng (Code)*</label>
              <input
                type="text"
                value={tierCode}
                onChange={(e) => setTierCode(e.target.value)}
                placeholder="Ví dụ: COPPER, GOLD_VIP..."
                className="px-3 py-2 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs rounded-xl transition-all font-semibold text-neutral-700 uppercase"
                required
                disabled={!!selectedTier}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Tên hạng hiển thị*</label>
              <input
                type="text"
                value={tierName}
                onChange={(e) => setTierName(e.target.value)}
                placeholder="Ví dụ: Đồng, Vàng Đặc Quyền..."
                className="px-3 py-2 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs rounded-xl transition-all font-semibold text-neutral-700"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Cấp độ hạng (Level)*</label>
              <input
                type="number"
                value={tierLevel}
                onChange={(e) => setTierLevel(e.target.value)}
                placeholder="Cấp độ từ 1 (Đồng), 2 (Bạc)..."
                className="px-3 py-2 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs rounded-xl transition-all font-semibold text-neutral-700"
                min="1"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Ngưỡng điểm tối thiểu*</label>
              <input
                type="number"
                value={tierMinPoints}
                onChange={(e) => setTierMinPoints(e.target.value)}
                placeholder="Ví dụ: 100, 500..."
                className="px-3 py-2 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs rounded-xl transition-all font-semibold text-neutral-700"
                min="0"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Mô tả ngắn</label>
            <textarea
              value={tierDesc}
              onChange={(e) => setTierDesc(e.target.value)}
              placeholder="Nhập giới thiệu ngắn về nhóm thành viên này..."
              className="px-3 py-2 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs rounded-xl transition-all font-semibold text-neutral-700 h-20"
            />
          </div>

          {/* Dynamic Benefits Array */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Đặc quyền, quyền lợi</label>
              <button
                type="button"
                onClick={addBenefitField}
                className="text-[10px] font-black text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm quyền lợi
              </button>
            </div>

            <div className="space-y-2">
              {tierBenefits.map((benefit, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={benefit}
                    onChange={(e) => handleBenefitChange(idx, e.target.value)}
                    placeholder={`Đặc quyền #${idx + 1} (Ví dụ: Miễn phí giao hàng, giảm 5% hóa đơn)`}
                    className="flex-1 px-3 py-2 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs rounded-xl transition-all font-semibold text-neutral-700"
                  />
                  <button
                    type="button"
                    onClick={() => removeBenefitField(idx)}
                    className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="tierActiveForm"
              checked={tierActive}
              onChange={(e) => setTierActive(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-neutral-300 accent-emerald-600 cursor-pointer"
            />
            <label htmlFor="tierActiveForm" className="text-xs font-bold text-neutral-700 cursor-pointer select-none">
              Kích hoạt hạng thành viên này
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={savingTier}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              {savingTier && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Xác nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
