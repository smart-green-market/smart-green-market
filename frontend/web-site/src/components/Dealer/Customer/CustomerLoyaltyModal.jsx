import { useState, useEffect } from "react";
import { X, Loader2, AlertTriangle, PlusCircle, MinusCircle, History, Award, Coins } from "lucide-react";
import { loyaltyService } from "../../../services/api/loyaltyService";
import { toast } from "sonner";
import Pagination from "../../common/Pagination";

export default function CustomerLoyaltyModal({ customer, isOpen, onClose, onSuccess }) {
  if (!isOpen || !customer) return null;

  const [activeTab, setActiveTab] = useState("transactions"); // "transactions" | "tiers"
  
  // States for point transactions
  const [trans, setTrans] = useState([]);
  const [loadingTrans, setLoadingTrans] = useState(false);
  const [transPage, setTransPage] = useState(1);
  const [transTotal, setTransTotal] = useState(0);

  // States for tier histories
  const [tiers, setTiers] = useState([]);
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [tiersPage, setTiersPage] = useState(1);
  const [tiersTotal, setTiersTotal] = useState(0);

  // States for adjusting points
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [action, setAction] = useState("add"); // "add" | "deduct"
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Customer current points
  const [currentPoints, setCurrentPoints] = useState(customer.loyalty_points || 0);
  const [currentTier, setCurrentTier] = useState(customer.current_tier);

  useEffect(() => {
    fetchTransactions(1);
    fetchTierHistories(1);
    setCurrentPoints(customer.loyalty_points || 0);
    setCurrentTier(customer.current_tier);
  }, [customer]);

  const fetchTransactions = async (page = 1) => {
    setLoadingTrans(true);
    try {
      const data = await loyaltyService.getCustomerTransactions(customer.id, { page, page_size: 5 });
      setTrans(data.results || []);
      setTransTotal(data.count || 0);
      setTransPage(page);
    } catch (err) {
      console.error("Lỗi khi tải lịch sử giao dịch điểm:", err);
    } finally {
      setLoadingTrans(false);
    }
  };

  const fetchTierHistories = async (page = 1) => {
    setLoadingTiers(true);
    try {
      const data = await loyaltyService.getCustomerTierHistories(customer.id, { page, page_size: 5 });
      setTiers(data.results || []);
      setTiersTotal(data.count || 0);
      setTiersPage(page);
    } catch (err) {
      console.error("Lỗi khi tải lịch sử hạng:", err);
    } finally {
      setLoadingTiers(false);
    }
  };

  const handleAdjustPoints = async (e) => {
    e.preventDefault();
    if (!points || parseInt(points) <= 0) {
      toast.warning("Vui lòng nhập số điểm hợp lệ (> 0)");
      return;
    }
    if (!reason.trim()) {
      toast.warning("Vui lòng điền lý do điều chỉnh");
      return;
    }

    setAdjustLoading(true);
    try {
      const res = await loyaltyService.adjustCustomerPoints(customer.id, {
        points: parseInt(points),
        reason: reason.trim(),
        action: action
      });
      
      toast.success(action === "add" ? `Đã cộng ${points} điểm cho khách hàng` : `Đã trừ ${points} điểm của khách hàng`);
      
      // Update local states
      if (res.loyalty) {
        setCurrentPoints(res.loyalty.loyalty_points);
        setCurrentTier(res.loyalty.current_tier);
      }
      
      // Reset form
      setPoints("");
      setReason("");
      setIsAdjustOpen(false);
      
      // Refresh transactions and tier history list
      fetchTransactions(1);
      fetchTierHistories(1);
      
      // Trigger parent callback to update list points
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Lỗi điều chỉnh điểm:", err);
      toast.error(err.response?.data?.detail || "Không thể điều chỉnh điểm");
    } finally {
      setAdjustLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getTransactionTypeBadge = (type) => {
    switch (type) {
      case "ORDER_REWARD":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "RETURN_DEDUCTION":
        return "bg-red-50 text-red-700 border-red-200";
      case "MANUAL_ADD":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "MANUAL_DEDUCT":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-neutral-50 text-neutral-600 border-neutral-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 font-['Geist',sans-serif]">
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-neutral-900">Chi tiết tích điểm khách hàng</h2>
              <p className="text-xs font-medium text-neutral-500 mt-0.5">{customer.full_name} · {customer.phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status summary */}
        <div className="p-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">Điểm tích luỹ hiện tại</span>
            <h3 className="text-3xl font-black mt-1">{currentPoints} <span className="text-sm font-semibold">điểm</span></h3>
          </div>
          <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-xl border border-white/15">
            <Award className="w-5 h-5 text-amber-300" />
            <div>
              <span className="text-[9px] uppercase font-bold tracking-wider opacity-85 block">Hạng hiện tại</span>
              <span className="text-sm font-extrabold">{currentTier?.name || "Thành viên mới"}</span>
            </div>
          </div>
          <button 
            onClick={() => setIsAdjustOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 transition-all text-xs font-black rounded-xl shadow-sm cursor-pointer"
          >
            Điều chỉnh điểm số
          </button>
        </div>

        {/* Adjust points inline modal overlay */}
        {isAdjustOpen && (
          <div className="p-6 bg-neutral-50 border-b border-neutral-100 animate-in slide-in-from-top-4 duration-200">
            <h4 className="text-sm font-black text-neutral-800 mb-4 flex items-center gap-2">
              Điều chỉnh điểm cho {customer.full_name}
            </h4>
            <form onSubmit={handleAdjustPoints} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Hành động</label>
                  <select 
                    value={action} 
                    onChange={(e) => setAction(e.target.value)}
                    className="px-3 py-2 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs rounded-xl transition-all font-semibold text-neutral-700 cursor-pointer"
                  >
                    <option value="add">Cộng điểm (+)</option>
                    <option value="deduct">Trừ điểm (-)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Số điểm</label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    placeholder="Nhập số điểm cần đổi"
                    className="px-3 py-2 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs rounded-xl transition-all font-semibold text-neutral-700"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Lý do</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ghi rõ lý do (ví dụ: đền bù đơn hàng hỏng, tặng sinh nhật...)"
                  className="px-3 py-2 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs rounded-xl transition-all font-semibold text-neutral-700"
                  required
                />
              </div>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAdjustOpen(false)}
                  className="px-4 py-2 border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  {adjustLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-neutral-100">
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex-1 py-4 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "transactions"
                ? "border-emerald-600 text-emerald-700 bg-emerald-50/10"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            <History className="w-4 h-4" /> Lịch sử tích lũy
          </button>
          <button
            onClick={() => setActiveTab("tiers")}
            className={`flex-1 py-4 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "tiers"
                ? "border-emerald-600 text-emerald-700 bg-emerald-50/10"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            <Award className="w-4 h-4" /> Lịch sử hạng
          </button>
        </div>

        {/* List Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === "transactions" ? (
            <div>
              {loadingTrans && trans.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                </div>
              ) : trans.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-xs font-medium">
                  Chưa có lịch sử tích luỹ điểm
                </div>
              ) : (
                <div className="space-y-3">
                  {trans.map((t) => (
                    <div key={t.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex justify-between items-center gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded border uppercase ${getTransactionTypeBadge(t.transaction_type)}`}>
                            {t.transaction_type_label}
                          </span>
                          {t.order_code && (
                            <span className="text-[10px] font-bold text-neutral-400">
                              Đơn #{t.order_code}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-neutral-700 truncate">{t.reason || "Không ghi rõ lý do"}</p>
                        <span className="text-[10px] font-medium text-neutral-400 mt-1 block">{formatDate(t.created_at)}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-sm font-black flex items-center justify-end gap-1 ${
                          ["ORDER_REWARD", "MANUAL_ADD"].includes(t.transaction_type) ? "text-emerald-600" : "text-rose-600"
                        }`}>
                          {["ORDER_REWARD", "MANUAL_ADD"].includes(t.transaction_type) ? (
                            <PlusCircle className="w-4 h-4 shrink-0" />
                          ) : (
                            <MinusCircle className="w-4 h-4 shrink-0" />
                          )}
                          {t.points} điểm
                        </span>
                        <span className="text-[10px] text-neutral-400 font-medium mt-0.5 block">
                          Số dư: {t.balance_after}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {transTotal > 5 && (
                    <div className="mt-4">
                      <Pagination
                        currentPage={transPage}
                        totalPages={Math.ceil(transTotal / 5)}
                        onPageChange={fetchTransactions}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              {loadingTiers && tiers.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                </div>
              ) : tiers.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-xs font-medium">
                  Chưa có lịch sử thăng hạng/hạ hạng
                </div>
              ) : (
                <div className="space-y-3">
                  {tiers.map((t) => (
                    <div key={t.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-neutral-600">{t.old_tier?.name || "Bắt đầu"}</span>
                          <span className="text-neutral-400">→</span>
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            {t.new_tier?.name}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-neutral-500 mt-1.5">{t.reason || "Cập nhật tự động từ hệ thống"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-medium text-neutral-400">{formatDate(t.changed_at)}</span>
                      </div>
                    </div>
                  ))}

                  {tiersTotal > 5 && (
                    <div className="mt-4">
                      <Pagination
                        currentPage={tiersPage}
                        totalPages={Math.ceil(tiersTotal / 5)}
                        onPageChange={fetchTierHistories}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
