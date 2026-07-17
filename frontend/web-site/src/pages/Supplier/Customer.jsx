import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  ChevronDown,
  X,
  Eye,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  ShoppingBag,
  Store,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from "lucide-react";
import { toast } from "sonner";
import { supplierService as supplierDealerService } from "../../services/api/Supplier/supplierService";
import { supplierService } from "../../services/api/suppilerService";
import SupplierPageHeader, { SUPPLIER_PAGE_CLASS } from "../../components/Supplier/UI/SupplierPageHeader";
import { PageSpinner } from "../../components/Supplier/UI/SupplierSpinner";

const FONT = "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// Pill tones copied from system mockup
const PILL_TONES = {
  g: { bg: "#EAF3DE", text: "#3B6D11" },
  gr: { bg: "#f3f4f6", text: "#565f6b" },
};

function SortIcon({ active, direction }) {
  if (!active) return <ArrowUpDown className="w-3 h-3 shrink-0" style={{ color: "#80899a" }} />;
  return direction === "asc" ? (
    <ArrowUp className="w-3 h-3 shrink-0" style={{ color: "#111827" }} />
  ) : (
    <ArrowDown className="w-3 h-3 shrink-0" style={{ color: "#111827" }} />
  );
}

function formatCurrency(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return "—";
  return `${amount.toLocaleString("vi-VN")} đ`;
}

function formatDateOnly(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN"); // dd/MM/yyyy
}

function formatDateTime(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MetricCard({ icon: Icon, value, label, tone }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };
  return (
    <div className="flex-1 min-w-[200px] rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 border ${tones[tone] || tones.emerald}`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-400 mt-1 font-medium">{label}</p>
    </div>
  );
}

export default function CustomerSupplierPage() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supplierId, setSupplierId] = useState(null);
  
  // Stats summary for metrics cards
  const [totalSpentStats, setTotalSpentStats] = useState(0);
  const [totalOrdersStats, setTotalOrdersStats] = useState(0);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState({ key: "last_order_at", dir: "desc" });
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  // Selected dealer for detail modal
  const [selectedDealer, setSelectedDealer] = useState(null);

  // Debounce search text
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Load supplier details
  useEffect(() => {
    const loadSupplier = async () => {
      try {
        const userStr = localStorage.getItem("user");
        let sid = null;
        if (userStr) {
          const user = JSON.parse(userStr);
          sid = user?.supplier_profile?.id || user?.supplier_id || user?.supplier?.id || user?.supplier;
        }
        
        if (!sid) {
          const list = await supplierService.getAll();
          if (list && list.length > 0) {
            sid = list[0].id;
          }
        }
        
        if (sid) {
          setSupplierId(sid);
        } else {
          toast.error("Không tìm thấy thông tin nhà cung cấp.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Lỗi khi tải nhà cung cấp:", err);
        toast.error("Lỗi khi kết nối hệ thống.");
        setLoading(false);
      }
    };
    
    loadSupplier();
  }, []);

  // Fetch dealers from API
  const fetchDealers = useCallback(async (sid) => {
    if (!sid) return;
    try {
      setLoading(true);
      const params = {
        page,
        page_size: pageSize,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      
      if (sort) {
        const prefix = sort.dir === "desc" ? "-" : "";
        params.ordering = `${prefix}${sort.key}`;
      }

      const response = await supplierDealerService.getDealers(sid, params);
      setDealers(response.results || []);
      setTotalCount(response.count || 0);

      // Compute simple dashboard metrics from all loaded items (just aggregate what we have for preview or show count)
      if (response.results && response.results.length > 0) {
        // If it is page 1 and no search filter, we can calculate general aggregate estimation
        const totalPurch = response.results.reduce((sum, item) => sum + Number(item.total_purchase_amount || 0), 0);
        const totalOrds = response.results.reduce((sum, item) => sum + Number(item.order_count || 0), 0);
        setTotalSpentStats(totalPurch);
        setTotalOrdersStats(totalOrds);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách đại lý:", error);
      toast.error("Không thể tải danh sách đại lý.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, sort]);

  useEffect(() => {
    if (supplierId) {
      fetchDealers(supplierId);
    }
  }, [supplierId, fetchDealers]);

  // Handle columns sorting
  const toggleSort = (key) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc")  return { key, dir: "desc" };
      return null;
    });
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
  };

  return (
    <div className={SUPPLIER_PAGE_CLASS}>
      <SupplierPageHeader 
        title="Quản lý khách hàng"
        description="Xem danh sách các đại lý đã từng mua hàng từ nhà vườn của bạn, thông tin liên hệ và số liệu giao dịch của họ."
      />

      {/* Metrics Section */}
      <div className="flex flex-wrap gap-4">
        <MetricCard 
          icon={Users} 
          value={totalCount} 
          label="Tổng số khách hàng (đại lý)" 
          tone="blue" 
        />
        <MetricCard 
          icon={ShoppingBag} 
          value={totalOrdersStats} 
          label="Tổng số đơn đã giao dịch (trang này)" 
          tone="emerald" 
        />
        <MetricCard 
          icon={DollarSign} 
          value={formatCurrency(totalSpentStats)} 
          label="Tổng giá trị giao dịch (trang này)" 
          tone="amber" 
        />
      </div>

      {/* Search & Actions Toolbar */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex items-center max-w-md w-full">
          <Search className="absolute left-3 w-4 h-4 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tên cửa hàng, địa chỉ, tên, SĐT liên hệ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10 py-2 w-full border border-neutral-200 rounded-lg text-sm bg-neutral-50 hover:bg-neutral-50/50 focus:bg-white outline-none focus:border-emerald-600 transition-all placeholder-neutral-400"
          />
          {search && (
            <button 
              onClick={clearFilters}
              className="absolute right-3 p-1 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-neutral-400 font-medium">
          Hiển thị tối đa {pageSize} khách hàng trên mỗi trang
        </div>
      </div>

      {/* Table Section formatted like Order Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#ffffff", border: "0.5px solid #e5e7eb", fontFamily: FONT }}
      >
        {/* Header row inside card */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "0.5px solid #e5e7eb" }}
        >
          <span className="text-[13px] font-medium" style={{ color: "#111827" }}>
            Danh sách đại lý đã mua hàng
          </span>
          <span className="text-[11px]" style={{ color: "#80899a" }}>
            {totalCount} đại lý
          </span>
        </div>

        <div className="overflow-x-auto">
          {/* Header titles row */}
          <div
            className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wide"
            style={{ minWidth: 980, color: "#80899a", borderBottom: "0.5px solid #e5e7eb" }}
          >
            <div style={{ flex: 1, minWidth: 140 }}>
              <span
                className="inline-flex items-center gap-1 cursor-pointer select-none hover:text-[#111827] transition-colors"
                onClick={() => toggleSort("store_name")}
              >
                Cửa hàng / Đại lý
                <SortIcon active={sort?.key === "store_name"} direction={sort?.dir} />
              </span>
            </div>
            <div style={{ width: 140, flexShrink: 0 }}>Người liên hệ</div>
            <div style={{ width: 90, flexShrink: 0, textAlign: "center" }}>
              <span
                className="inline-flex items-center justify-center gap-1 cursor-pointer select-none hover:text-[#111827] transition-colors w-full"
                onClick={() => toggleSort("order_count")}
              >
                Tổng đơn
                <SortIcon active={sort?.key === "order_count"} direction={sort?.dir} />
              </span>
            </div>
            <div style={{ width: 110, flexShrink: 0, textAlign: "center" }}>Đơn thành công</div>
            <div style={{ width: 120, flexShrink: 0, textAlign: "right" }}>
              <span
                className="inline-flex items-center justify-end gap-1 cursor-pointer select-none hover:text-[#111827] transition-colors w-full"
                onClick={() => toggleSort("total_purchase_amount")}
              >
                Tổng chi tiêu
                <SortIcon active={sort?.key === "total_purchase_amount"} direction={sort?.dir} />
              </span>
            </div>
            <div style={{ width: 110, flexShrink: 0, textAlign: "center" }}>
              <span
                className="inline-flex items-center justify-center gap-1 cursor-pointer select-none hover:text-[#111827] transition-colors w-full"
                onClick={() => toggleSort("last_order_at")}
              >
                Đơn gần nhất
                <SortIcon active={sort?.key === "last_order_at"} direction={sort?.dir} />
              </span>
            </div>
            <div style={{ width: 100, flexShrink: 0, textAlign: "center" }}>Trạng thái</div>
            <div style={{ width: 44, flexShrink: 0 }} />
          </div>

          {loading ? (
            <div
              className="py-16 text-center text-sm"
              style={{ minWidth: 980, color: "#80899a" }}
            >
              Đang tải danh sách khách hàng...
            </div>
          ) : dealers.length === 0 ? (
            <div
              className="py-16 text-center text-sm"
              style={{ minWidth: 980, color: "#80899a" }}
            >
              Chưa có khách hàng nào.
            </div>
          ) : (
            dealers.map((row, idx) => {
              return (
                <div
                  key={row.id ?? idx}
                  className="flex items-center gap-2 px-3 py-2 transition-colors bg-white hover:bg-[#f9fafb]"
                  style={{
                    minWidth: 980,
                    borderBottom: idx === dealers.length - 1 ? "none" : "0.5px solid #e5e7eb",
                  }}
                >
                  {/* Store Info */}
                  <div style={{ flex: 1, minWidth: 140, display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {row.logo_url ? (
                        <img
                          src={row.logo_url}
                          alt={row.store_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-900 truncate" title={row.store_name}>
                        {row.store_name}
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate max-w-[180px]" title={row.store_address}>
                        {row.store_address || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Contact Person */}
                  <div style={{ width: 140, flexShrink: 0 }}>
                    {row.contact ? (
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-neutral-800 truncate" title={row.contact.full_name}>
                          {row.contact.full_name || "—"}
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate">
                          {row.contact.phone || "—"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-neutral-400 text-xs">—</span>
                    )}
                  </div>

                  {/* Order Count */}
                  <div style={{ width: 90, flexShrink: 0, textAlign: "center" }} className="text-xs font-medium text-neutral-800">
                    {row.order_count}
                  </div>

                  {/* Completed Order Count */}
                  <div style={{ width: 110, flexShrink: 0, textAlign: "center" }}>
                    <span 
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
                      style={PILL_TONES.g}
                    >
                      {row.completed_order_count} đơn
                    </span>
                  </div>

                  {/* Total Purchase Amount */}
                  <div style={{ width: 120, flexShrink: 0, textAlign: "right" }} className="text-xs font-bold text-neutral-900">
                    {formatCurrency(row.total_purchase_amount)}
                  </div>

                  {/* Last Order date */}
                  <div style={{ width: 110, flexShrink: 0, textAlign: "center" }} className="text-xs text-neutral-500">
                    {formatDateOnly(row.last_order_at)}
                  </div>

                  {/* Status */}
                  <div style={{ width: 100, flexShrink: 0, textAlign: "center" }}>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
                      style={row.status === "active" ? PILL_TONES.g : PILL_TONES.gr}
                    >
                      {row.status === "active" ? "Hoạt động" : "Tạm khóa"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ width: 44, flexShrink: 0, textAlign: "center" }}>
                    <button 
                      onClick={() => setSelectedDealer(row)}
                      className="w-[28px] h-[28px] rounded-md inline-flex items-center justify-center transition-colors hover:bg-[#e5e7eb] cursor-pointer"
                      style={{ color: "#374151" }}
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination footer formatted like Order Table */}
        {!loading && totalCount > pageSize && (
          <div
            className="flex items-center justify-between px-3 py-2 bg-white"
            style={{ borderTop: "0.5px solid #e5e7eb" }}
          >
            <span className="text-[11px]" style={{ color: "#80899a" }}>
              Trang {page} / {Math.ceil(totalCount / pageSize)}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 h-[30px] rounded-md text-xs font-medium disabled:opacity-40 cursor-pointer"
                style={{ background: "#ffffff", color: "#565f6b", border: "0.5px solid #e5e7eb" }}
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(Math.ceil(totalCount / pageSize), p + 1))}
                disabled={page === Math.ceil(totalCount / pageSize)}
                className="px-3 h-[30px] rounded-md text-xs font-medium disabled:opacity-40 cursor-pointer"
                style={{ background: "#ffffff", color: "#565f6b", border: "0.5px solid #e5e7eb" }}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dealer Detail Modal Overlay */}
      {selectedDealer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-neutral-50">
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-emerald-700" />
                <h2 className="text-lg font-bold text-neutral-900">Chi tiết thông tin đại lý</h2>
              </div>
              <button
                onClick={() => setSelectedDealer(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 max-h-[75vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Store Details */}
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {selectedDealer.logo_url ? (
                      <img
                        src={selectedDealer.logo_url}
                        alt={selectedDealer.store_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-8 h-8 text-neutral-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">{selectedDealer.store_name}</h3>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">Slug: {selectedDealer.slug}</p>
                    <div className="mt-1.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        selectedDealer.status === "active" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-neutral-50 text-neutral-500 border-neutral-250"
                      }`}>
                        {selectedDealer.status === "active" ? "Hoạt động" : "Ngừng hoạt động"}
                      </span>
                    </div>
                  </div>
                </div>

                <hr className="border-neutral-100" />

                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Địa chỉ & Liên hệ cửa hàng</h4>
                  <div className="flex items-start gap-3 text-sm text-neutral-600">
                    <MapPin className="w-4 h-4 mt-0.5 text-neutral-400 flex-shrink-0" />
                    <span>{selectedDealer.store_address || "Chưa cập nhật địa chỉ"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-600">
                    <Phone className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <span>{selectedDealer.contact?.phone || "—"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-600">
                    <Mail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <span className="truncate">{selectedDealer.contact?.email || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Contact Person & Trans stats */}
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Người đại diện liên hệ</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 overflow-hidden flex items-center justify-center">
                      {selectedDealer.contact?.avatar_url ? (
                        <img
                          src={selectedDealer.contact.avatar_url}
                          alt={selectedDealer.contact.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-emerald-700">
                          {selectedDealer.contact?.full_name?.charAt(0) || "D"}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900">{selectedDealer.contact?.full_name || "—"}</p>
                      <p className="text-xs text-neutral-500">Đại diện giao dịch</p>
                    </div>
                  </div>
                </div>

                <hr className="border-neutral-100" />

                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Số liệu giao dịch</h4>
                  
                  {/* Aggregated values cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
                      <p className="text-[11px] text-neutral-400 font-medium">Tổng số đơn hàng</p>
                      <p className="text-base font-bold text-neutral-900 mt-1">{selectedDealer.order_count} đơn</p>
                    </div>
                    <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
                      <p className="text-[11px] text-neutral-400 font-medium">Đơn đã hoàn thành</p>
                      <p className="text-base font-bold text-emerald-700 mt-1">{selectedDealer.completed_order_count} đơn</p>
                    </div>
                  </div>

                  {/* Purchase stats */}
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-xl">
                    <p className="text-xs text-emerald-800/80 font-semibold">Tổng số tiền mua hàng gộp</p>
                    <p className="text-xl font-black text-emerald-950 mt-1">
                      {formatCurrency(selectedDealer.total_purchase_amount)}
                    </p>
                  </div>

                  {/* Order completion rate progress bar */}
                  <div>
                    <div className="flex justify-between items-center text-xs text-neutral-500 mb-1">
                      <span>Tỷ lệ hoàn thành đơn</span>
                      <span className="font-semibold text-neutral-800">
                        {selectedDealer.order_count > 0 
                          ? ((selectedDealer.completed_order_count / selectedDealer.order_count) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          (selectedDealer.completed_order_count / selectedDealer.order_count) >= 0.7 
                            ? "bg-emerald-600" 
                            : (selectedDealer.completed_order_count / selectedDealer.order_count) >= 0.4
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{ 
                          width: `${selectedDealer.order_count > 0 
                            ? (selectedDealer.completed_order_count / selectedDealer.order_count) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Detailed dates details */}
                  <div className="flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-100 pt-3">
                    <span>Đơn hàng gần nhất:</span>
                    <span className="font-semibold text-neutral-800">{formatDateTime(selectedDealer.last_order_at)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>Ngày hợp tác:</span>
                    <span className="font-semibold text-neutral-800">{formatDateOnly(selectedDealer.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-neutral-100 bg-neutral-50">
              <button
                onClick={() => setSelectedDealer(null)}
                className="px-5 py-2.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
