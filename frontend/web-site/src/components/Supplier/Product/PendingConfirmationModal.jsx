import { useState, useEffect, useCallback } from "react";
import {
  X,
  Package,
  Layers,
  Search,
  Loader2,
  ShoppingCart,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  BarChart3,
  Tag,
} from "lucide-react";
import { productService } from "../../../services/api/productService";

/* helpers */
const fmtQty = (v, unit = "kg") =>
  v != null ? `${Number(v).toLocaleString("vi-VN")} ${unit}` : "—";
const fmtPrice = (v) =>
  v != null ? `${Number(v).toLocaleString("vi-VN")}đ` : "—";

const PAGE_SIZE = 10;

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
        <ShoppingCart className="w-8 h-8 text-emerald-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-zinc-500">Không có sản phẩm nào đang chờ</p>
        <p className="text-xs text-zinc-400 mt-1">Chưa có phiếu đặt hàng nào đang chờ xác nhận</p>
      </div>
    </div>
  );
}

function CapacityBar({ pending, capacity }) {
  if (!capacity || Number(capacity) === 0) return null;
  const pct = Math.min(100, (Number(pending) / Number(capacity)) * 100);
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-1.5">
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function ProductRow({ item }) {
  const thumb = Array.isArray(item.images)
    ? (item.images.find((img) => img.is_thumbnail) || item.images[0])?.image_url
    : null;

  return (
    <div className="grid grid-cols-[1fr_160px_140px_120px] gap-4 items-center px-4 py-3.5 border-b border-zinc-100 last:border-0 hover:bg-emerald-50/30 transition-colors">
      {/* Tên sản phẩm */}
      <div className="min-w-0 flex items-center gap-2.5">
        {thumb ? (
          <img src={thumb} alt={item.name} className="w-9 h-9 rounded-lg object-cover border border-zinc-200 flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-zinc-300" />
          </div>
        )}
        <p className="text-sm font-semibold text-zinc-800 truncate">{item.name}</p>
      </div>

      {/* Danh mục */}
      <div>
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 rounded-lg text-xs text-zinc-600 font-medium">
          <Tag className="w-3 h-3 text-zinc-400 flex-shrink-0" />
          {item.category?.name ?? "—"}
        </span>
      </div>

      {/* SL chờ xác nhận */}
      <div className="text-right">
        <p className="text-sm font-bold text-zinc-800">
          {fmtQty(item.pending_order_quantity, item.unit)}
        </p>
      </div>

      {/* Giá sỉ */}
      <div className="text-right">
        <p className="text-sm font-semibold text-emerald-700">{fmtPrice(item.wholesale_price)}</p>
        <p className="text-[10px] text-zinc-400">/{item.unit}</p>
      </div>
    </div>
  );
}

function Pagination({ page, total, onChange }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-1">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="w-7 h-7 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
            p === page ? "bg-green-700 text-white" : "border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="w-7 h-7 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function PendingConfirmationModal({ isOpen, onClose }) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await productService.getPendingConfirmation();
      const results = Array.isArray(res) ? res : (res?.results ?? []);
      setData(results);
      setSummary(res?.summary ?? null);
      setPage(1);
    } catch (err) {
      console.error("Loi khi tai danh sach cho xac nhan:", err);
      setError("Khong the tai du lieu. Vui long thu lai.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isOpen) load(); }, [isOpen, load]);
  useEffect(() => {
    if (!isOpen) { setData([]); setSummary(null); setError(""); setSearch(""); setPage(1); }
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isOpen, onClose]);
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = data.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.category?.name?.toLowerCase().includes(q);
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalPendingQty = summary?.pending_line_quantity_total
    ? Number(summary.pending_line_quantity_total)
    : data.reduce((s, p) => s + Number(p.pending_order_quantity ?? 0), 0);

  const totalOrders = summary?.pending_purchase_order_count ?? data.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: "pendingModalIn 0.18s ease-out both", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 flex-shrink-0 border-b border-zinc-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-950">
                Sản phẩm chờ xác nhận phiếu đặt
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Các sản phẩm có phiếu mua hàng từ đại lý đang chờ NCC xác nhận
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <button
              onClick={load}
              disabled={loading}
              className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-40"
              title="Tải lại"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary */}
        {!loading && data.length > 0 && (
          <div className="mx-6 mt-4 mb-3 flex-shrink-0 grid grid-cols-3 gap-3">
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Sản phẩm</p>
                <p className="text-lg font-bold text-zinc-800">{data.length} mặt hàng</p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Layers className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Tổng sản lượng chờ</p>
                <p className="text-lg font-bold text-emerald-700">
                  {totalPendingQty.toLocaleString("vi-VN")} kg
                </p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Tổng phiếu đặt</p>
                <p className="text-lg font-bold text-blue-700">{totalOrders} phiếu</p>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        {!loading && data.length > 0 && (
          <div className="mx-6 mb-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm theo tên sản phẩm hoặc danh mục..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-6 mb-3 flex-shrink-0 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={load} className="ml-auto text-red-700 underline font-semibold">Thử lại</button>
          </div>
        )}

        {/* Table header */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-[1fr_160px_140px_120px] gap-4 px-4 py-2 mx-6 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide bg-zinc-50 rounded-lg flex-shrink-0">
            <div>Tên sản phẩm</div>
            <div>Danh mục</div>
            <div className="text-right">Chờ xác nhận</div>
            <div className="text-right">Giá sỉ</div>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
              <span className="text-xs text-zinc-400">Đang tải dữ liệu...</span>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="border border-zinc-100 rounded-xl overflow-hidden">
              {paginated.map((item) => (
                <ProductRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-px bg-zinc-100 mx-6 flex-shrink-0" />
        <div className="px-6 py-3 bg-stone-50 rounded-b-2xl flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-zinc-400">
            {filtered.length > 0
              ? `Hiển thị ${Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–${Math.min(page * PAGE_SIZE, filtered.length)} / ${filtered.length} sản phẩm`
              : ""}
          </span>
          <div className="flex items-center gap-3">
            <Pagination page={page} total={filtered.length} onChange={setPage} />
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pendingModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
