import { useState, useEffect, useCallback } from "react";
import { Ticket, Calendar, Info, BookmarkCheck, Trash2, ArrowRight } from "lucide-react";
import { buyerVoucherService, handleApiError } from "../../../services/api/Buyer/buyerVoucherService";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";
import { appToast } from "../../../components/common/toast";
import Pagination from "../../../components/common/Pagination";

const formatCurrency = (val) => {
    if (val == null || isNaN(Number(val))) return "—";
    return new Intl.NumberFormat('vi-VN').format(Number(val)) + 'đ';
};

const formatDate = (val) => {
    if (!val) return "—";
    const date = new Date(val);
    if (isNaN(date.getTime())) return val;
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

export default function UserVoucherPage() {
    const paths = useStorefrontPaths();
    const dealerSlug = paths.slug;

    const [activeTab, setActiveTab] = useState("available"); // "available" | "saved"
    const [availableVouchers, setAvailableVouchers] = useState([]);
    const [savedVouchers, setSavedVouchers] = useState([]);
    
    // Complete saved list for checking saved status on available tab
    const [allSavedVouchers, setAllSavedVouchers] = useState([]);

    // Counts for pagination
    const [availableCount, setAvailableCount] = useState(0);
    const [savedCount, setSavedCount] = useState(0);

    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null); // Tracks action status per voucher ID

    // ── FETCH DATA HELPERS ────────────────────────────────
    const fetchAllSaved = useCallback(async () => {
        if (!dealerSlug) return [];
        try {
            const res = await buyerVoucherService.getAll({
                dealer_slug: dealerSlug,
                page_size: 100 // Large limit to get all saved vouchers for checking status
            });
            const list = res?.results || (Array.isArray(res) ? res : []);
            setAllSavedVouchers(list);
            return list;
        } catch (error) {
            console.error("Failed to load all saved vouchers:", error);
            return [];
        }
    }, [dealerSlug]);

    const fetchAvailable = useCallback(async (page) => {
        if (!dealerSlug) return;
        try {
            const res = await buyerVoucherService.getVoucherAvailable({
                dealer_slug: dealerSlug,
                page,
                page_size: 6
            });
            const list = res?.results || (Array.isArray(res) ? res : []);
            const count = res?.count || list.length;
            setAvailableVouchers(list);
            setAvailableCount(count);
        } catch (error) {
            console.error("Failed to load available vouchers:", error);
            appToast.error(handleApiError(error, "Không thể tải danh sách voucher khả dụng"));
        }
    }, [dealerSlug]);

    const fetchSaved = useCallback(async (page) => {
        if (!dealerSlug) return;
        try {
            const res = await buyerVoucherService.getAll({
                dealer_slug: dealerSlug,
                page,
                page_size: 6
            });
            const list = res?.results || (Array.isArray(res) ? res : []);
            const count = res?.count || list.length;
            setSavedVouchers(list);
            setSavedCount(count);
        } catch (error) {
            console.error("Failed to load saved vouchers:", error);
            appToast.error(handleApiError(error, "Không thể tải danh sách voucher đã lưu"));
        }
    }, [dealerSlug]);

    const loadData = useCallback(async (tab = activeTab, page = currentPage) => {
        if (!dealerSlug) return;
        setLoading(true);
        try {
            if (tab === "available") {
                await Promise.all([
                    fetchAllSaved(),
                    fetchAvailable(page)
                ]);
            } else {
                await fetchSaved(page);
            }
        } finally {
            setLoading(false);
        }
    }, [dealerSlug, activeTab, currentPage, fetchAllSaved, fetchAvailable, fetchSaved]);

    // Trigger loading on tab/page change
    useEffect(() => {
        loadData(activeTab, currentPage);
    }, [activeTab, currentPage, loadData]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    // ── ACTIONS ────────────────────────────────────────────
    const handleSave = async (voucher) => {
        setActionId(voucher.id);
        try {
            await buyerVoucherService.saveVoucher(voucher.id);
            appToast.success(`Lưu mã ${voucher.code} thành công!`);
            await loadData(activeTab, currentPage);
        } catch (error) {
            appToast.error(handleApiError(error, "Lưu voucher thất bại"));
        } finally {
            setActionId(null);
        }
    };

    const handleUnsave = async (savedId, code) => {
        setActionId(savedId);
        try {
            await buyerVoucherService.unsaveVoucher(savedId);
            appToast.success(`Hủy lưu mã ${code} thành công!`);
            
            let targetPage = currentPage;
            // If we unsaved the last voucher on the current page, go back 1 page
            if (activeTab === "saved" && savedVouchers.length === 1 && currentPage > 1) {
                targetPage = currentPage - 1;
                setCurrentPage(targetPage);
            } else {
                await loadData(activeTab, targetPage);
            }
        } catch (error) {
            appToast.error(handleApiError(error, "Hủy lưu voucher thất bại"));
        } finally {
            setActionId(null);
        }
    };

    const totalCount = activeTab === "available" ? availableCount : savedCount;
    const totalPages = Math.ceil(totalCount / 6);

    return (
        <div className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-sm font-['Geist',sans-serif]">
            {/* Header */}
            <div className="border-b border-stone-100 pb-4">
                <h1 className="text-2xl font-bold text-emerald-950 flex items-center gap-2">
                    <Ticket className="w-6 h-6 text-emerald-600" />
                    Kho Voucher ưu đãi
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                    Lưu các ưu đãi hấp dẫn từ cửa hàng đại lý của bạn để áp dụng giảm giá khi đặt hàng.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-stone-200">
                <button
                    onClick={() => handleTabChange("available")}
                    className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
                        activeTab === "available"
                            ? "border-emerald-600 text-emerald-700"
                            : "border-transparent text-neutral-500 hover:text-neutral-700"
                    }`}
                >
                    Voucher cửa hàng ({availableCount})
                </button>
                <button
                    onClick={() => handleTabChange("saved")}
                    className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
                        activeTab === "saved"
                            ? "border-emerald-600 text-emerald-700"
                            : "border-transparent text-neutral-500 hover:text-neutral-700"
                    }`}
                >
                    Voucher của tôi ({savedCount})
                </button>
            </div>

            {/* Content list */}
            {loading ? (
                <div className="py-20 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {activeTab === "available" ? (
                            availableVouchers.length > 0 ? (
                                availableVouchers.map((voucher) => {
                                    // Check if this voucher is saved in our complete list of saved vouchers
                                    const savedRecord = allSavedVouchers.find(
                                        (sv) => sv.code?.toLowerCase() === voucher.code?.toLowerCase()
                                    );
                                    const isSaved = !!savedRecord;

                                    return (
                                        <VoucherCard
                                            key={voucher.id}
                                            voucher={voucher}
                                            isSaved={isSaved}
                                            actionLoading={actionId === voucher.id || (isSaved && actionId === savedRecord.id)}
                                            onAction={() => {
                                                if (isSaved) {
                                                    handleUnsave(savedRecord.id, voucher.code);
                                                } else {
                                                    handleSave(voucher);
                                                }
                                            }}
                                        />
                                    );
                                })
                            ) : (
                                <EmptyState message="Cửa hàng hiện chưa có voucher khả dụng nào." />
                            )
                        ) : (
                            savedVouchers.length > 0 ? (
                                savedVouchers.map((voucher) => (
                                    <VoucherCard
                                        key={voucher.id}
                                        voucher={voucher}
                                        isSaved={true}
                                        actionLoading={actionId === voucher.id}
                                        onAction={() => handleUnsave(voucher.id, voucher.code)}
                                        showDeleteOnly
                                    />
                                ))
                            ) : (
                                <EmptyState message="Bạn chưa lưu mã giảm giá nào. Hãy chuyển sang tab 'Voucher cửa hàng' để nhận voucher nhé!" />
                            )
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pt-4 border-t border-stone-100">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={(page) => setCurrentPage(page)}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── SUBCOMPONENT VOUCHER CARD ────────────────────────────────
function VoucherCard({ voucher, isSaved, actionLoading, onAction, showDeleteOnly = false }) {
    const isPercent = voucher.discount_type === "percent";
    const discountVal = Number(voucher.discount_value || 0);

    return (
        <div className="relative flex bg-[#fbfcfc] border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            {/* Cutout half circles for ticket design style */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-2.5 w-5 h-5 bg-white rounded-full border-r border-stone-200 z-10"></div>
            <div className="absolute top-1/2 -translate-y-1/2 left-[110px] w-5 h-5 bg-white rounded-full border border-stone-200 z-10 -ml-2.5"></div>

            {/* Left section: Gradient badge */}
            <div className="w-[110px] shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600 flex flex-col items-center justify-center p-3 text-white text-center relative border-r-2 border-dashed border-stone-200/60 pl-5">
                <Ticket className="w-7 h-7 mb-1 opacity-90 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-base tracking-wide leading-none mb-1">
                    {isPercent ? `${discountVal}%` : formatCurrency(discountVal).replace("đ", "")}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 leading-none">
                    {isPercent ? "Giảm giá" : "Giảm tiền"}
                </span>
            </div>

            {/* Right section: Details */}
            <div className="flex-1 p-4 pl-6 flex flex-col justify-between min-w-0 pr-4">
                <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded">
                            {voucher.code}
                        </span>
                        {isSaved && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <BookmarkCheck className="w-3 h-3 shrink-0" />
                                Đã lưu
                            </span>
                        )}
                    </div>
                    <h3 className="font-bold text-sm text-neutral-800 line-clamp-1">
                        {voucher.title}
                    </h3>
                    {voucher.description && (
                        <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                            {voucher.description}
                        </p>
                    )}
                </div>

                {/* Footer specs */}
                <div className="mt-3.5 pt-3 border-t border-stone-100 flex flex-col gap-1.5 text-[11px] text-neutral-500">
                    <div className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                        <span>Đơn tối thiểu: <strong>{formatCurrency(voucher.min_order_amount)}</strong></span>
                        {voucher.max_discount_amount && Number(voucher.max_discount_amount) > 0 && (
                            <span> • Tối đa: <strong>{formatCurrency(voucher.max_discount_amount)}</strong></span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                        <span>Hạn dùng: {formatDate(voucher.start_date)} - {formatDate(voucher.end_date)}</span>
                    </div>
                </div>

                {/* Action button */}
                <div className="mt-4 flex justify-end shrink-0">
                    {showDeleteOnly ? (
                        <button
                            disabled={actionLoading}
                            onClick={onAction}
                            className="cursor-pointer text-xs font-semibold px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50"
                        >
                            {actionLoading ? (
                                <div className="w-3.5 h-3.5 border-2 border-red-600 border-b-transparent animate-spin rounded-full"></div>
                            ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                            )}
                            Hủy lưu
                        </button>
                    ) : (
                        <button
                            disabled={actionLoading}
                            onClick={onAction}
                            className={`cursor-pointer text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50 ${
                                isSaved
                                    ? "border border-stone-300 bg-stone-100 text-stone-600 hover:bg-stone-200"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow"
                            }`}
                        >
                            {actionLoading ? (
                                <div className="w-3.5 h-3.5 border-2 border-current border-b-transparent animate-spin rounded-full"></div>
                            ) : isSaved ? (
                                <>
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Hủy lưu
                                </>
                            ) : (
                                <>
                                    Nhận Voucher
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── SUBCOMPONENT EMPTY STATE ────────────────────────────────
function EmptyState({ message }) {
    return (
        <div className="col-span-full py-16 flex flex-col items-center justify-center text-center px-4 bg-[#fafbfc] rounded-xl border border-stone-100">
            <Ticket className="w-12 h-12 text-stone-300 mb-3" />
            <p className="text-neutral-500 text-sm max-w-md leading-relaxed">{message}</p>
        </div>
    );
}
