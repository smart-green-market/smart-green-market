import { useState, useEffect, useCallback } from "react";
import {
  X, Package, Tag, Hash, XCircle, Loader2, ShoppingCart,
  Clock, CheckCircle, Truck, Ban, ChevronLeft, ChevronRight,
  Store, Calendar, Layers,
} from "lucide-react";
import { purchaseOrderService } from "../../../services/api/purchaseOrderService";

/* ─── Status map ─── */
const STATUS_MAP = {
  pending_supplier_confirmation:      { label: "Chờ xác nhận",    cls: "bg-amber-100 text-amber-700 border-amber-200",     icon: Clock },
  confirmed:                          { label: "Đã xác nhận",     cls: "bg-blue-100 text-blue-700 border-blue-200",        icon: CheckCircle },
  deposit_pending_verification:       { label: "Chờ duyệt cọc",   cls: "bg-violet-100 text-violet-700 border-violet-200",  icon: Clock },
  deposit_paid:                       { label: "Đã cọc",          cls: "bg-indigo-100 text-indigo-700 border-indigo-200",  icon: CheckCircle },
  processing:                         { label: "Đang chuẩn bị",   cls: "bg-sky-100 text-sky-700 border-sky-200",           icon: Package },
  shipping:                           { label: "Đang giao",        cls: "bg-cyan-100 text-cyan-700 border-cyan-200",        icon: Truck },
  delivered:                          { label: "Đã giao",          cls: "bg-teal-100 text-teal-700 border-teal-200",        icon: CheckCircle },
  final_payment_pending_verification: { label: "Chờ duyệt TT",    cls: "bg-orange-100 text-orange-700 border-orange-200",  icon: Clock },
  completed:                          { label: "Hoàn tất",         cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
  cancelled:                          { label: "Đã hủy",           cls: "bg-red-100 text-red-700 border-red-200",           icon: Ban },
  rejected:                           { label: "Từ chối",          cls: "bg-rose-100 text-rose-700 border-rose-200",        icon: XCircle },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] ?? { label: status, cls: "bg-zinc-100 text-zinc-500 border-zinc-200", icon: Hash };
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${s.cls} whitespace-nowrap`}>
      <Icon className="w-3 h-3 flex-shrink-0" />
      {s.label}
    </span>
  );
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const fmtPrice = (v) =>
  v != null && v !== "" ? `${Number(v).toLocaleString("vi-VN")}đ` : "—";

const PAGE_SIZE = 10;

// Chỉ hiển thị và thống kê các trạng thái đang hoạt động
const ACTIVE_STATUSES = [ "confirmed"];

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center">
        <ShoppingCart className="w-7 h-7 text-zinc-300" />
      </div>
      <p className="text-sm font-semibold text-zinc-400">Chưa có đơn hàng nào cho sản phẩm này</p>
    </div>
  );
}

function OrderRow({ order, productId }) {
  const item = order.items?.find((i) => Number(i.supplier_product_id) === Number(productId));

  return (
    <div className="grid grid-cols-[1fr_120px_110px_130px_120px_100px] gap-3 items-center px-4 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
      {/* Mã đơn + đại lý */}
      <div className="min-w-0">
        <p className="font-mono font-semibold text-zinc-800 text-xs truncate">{order.order_code}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Store className="w-3 h-3 text-zinc-400 flex-shrink-0" />
          <span className="text-xs text-zinc-500 truncate">{order.dealer_name}</span>
        </div>
      </div>

      {/* Đơn giá */}
      <div className="text-right">
        <p className="text-xs text-zinc-400 mb-0.5">Đơn giá</p>
        <p className="font-semibold text-zinc-700 text-xs">{item ? fmtPrice(item.unit_price) : "—"}</p>
      </div>

      {/* Số lượng */}
      <div className="text-right">
        <p className="text-xs text-zinc-400 mb-0.5">Số lượng</p>
        <p className="font-semibold text-zinc-800 text-xs">
          {item ? `${Number(item.quantity).toLocaleString("vi-VN")} ${item.product_unit ?? "kg"}` : "—"}
        </p>
      </div>

      {/* Thành tiền */}
      <div className="text-right">
        <p className="text-xs text-zinc-400 mb-0.5">Thành tiền</p>
        <p className="font-semibold text-emerald-700 text-xs">{item ? fmtPrice(item.subtotal) : "—"}</p>
      </div>

      {/* Trạng thái */}
      <div className="flex justify-center">
        <StatusBadge status={order.status} />
      </div>

      {/* Ngày tạo */}
      <div className="text-right">
        <p className="text-xs text-zinc-400 mb-0.5">Ngày tạo</p>
        <p className="text-xs text-zinc-600">{fmt(order.created_at)}</p>
      </div>
    </div>
  );
}

function Pagination({ page, total, onChange }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-1">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}
        className="w-7 h-7 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed">
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => onChange(p)}
          className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${p === page ? "bg-green-700 text-white" : "border border-zinc-200 text-zinc-500 hover:bg-zinc-50"}`}>
          {p}
        </button>
      ))}
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}
        className="w-7 h-7 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed">
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function ListOrderModal({ isOpen, onClose, product }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    if (!product?.id) return;
    setLoading(true);
    setError("");
    try {
      // Fetch list (supplier đã được filter qua JWT token)
      const res = await purchaseOrderService.getAll({ page_size: 100 });
      const allOrders = res.results ?? [];

      // List không có items[], cần fetch detail từng đơn để lọc theo supplier_product_id
      const details = await Promise.all(
        allOrders.map((o) => purchaseOrderService.getById(o.id).catch(() => null))
      );

      const filtered = details
        .filter(Boolean)
        .filter((o) =>
          Array.isArray(o.items) &&
          o.items.some((i) => Number(i.supplier_product_id) === Number(product.id))
        )
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setOrders(filtered);
      setPage(1);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [product?.id]);

  useEffect(() => { if (isOpen) load(); }, [isOpen, load]);
  useEffect(() => { if (!isOpen) { setOrders([]); setError(""); setPage(1); } }, [isOpen]);
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

  if (!isOpen || !product) return null;

  // Chỉ hiện 3 trạng thái trong table
  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const paginated = activeOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalQty = activeOrders.reduce((sum, o) => {
    const item = o.items?.find((i) => Number(i.supplier_product_id) === Number(product.id));
    return sum + (item ? Number(item.quantity) : 0);
  }, 0);
  const totalRevenue = activeOrders.reduce((sum, o) => {
    const item = o.items?.find((i) => Number(i.supplier_product_id) === Number(product.id));
    return sum + (item ? Number(item.subtotal) : 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: "modalIn 0.18s ease-out both", maxHeight: "88vh" }}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-950">
                Đơn hàng — <span className="text-green-700">{product.name}</span>
              </h2>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-400 flex-wrap">
                <span className="flex items-center gap-1"><Hash className="w-3 h-3" />ID: {product.id}</span>
                <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{product.category?.name ?? "—"}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors ml-4 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        {!loading && activeOrders.length > 0 && (
          <div className="mx-6 mb-3 flex-shrink-0 grid grid-cols-3 gap-3">
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-400">Tổng đơn</p>
                <p className="text-sm font-bold text-zinc-800">{activeOrders.length} đơn</p>
              </div>
            </div>
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-400">Tổng sản lượng</p>
                <p className="text-sm font-bold text-zinc-800">{totalQty.toLocaleString("vi-VN")} {product.unit ?? "kg"}</p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <div>
                <p className="text-xs text-zinc-400">Tổng doanh thu</p>
                <p className="text-sm font-bold text-emerald-700">{fmtPrice(totalRevenue)}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-6 mb-2 flex-shrink-0 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        <div className="h-px bg-zinc-100 mx-6 flex-shrink-0" />

        {/* Table header */}
        {!loading && activeOrders.length > 0 && (
          <div className="grid grid-cols-[1fr_120px_110px_130px_120px_100px] gap-3 px-4 py-2 mx-6 mt-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide bg-zinc-50 rounded-lg flex-shrink-0">
            <div>Mã đơn / Đại lý</div>
            <div className="text-right">Đơn giá</div>
            <div className="text-right">Số lượng</div>
            <div className="text-right">Thành tiền</div>
            <div className="text-center">Trạng thái</div>
            <div className="text-right">Ngày tạo</div>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
              <span className="text-sm">Đang tải đơn hàng...</span>
              <span className="text-xs text-zinc-300">Quá trình này có thể mất vài giây</span>
            </div>
          ) : activeOrders.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="border border-zinc-100 rounded-xl overflow-hidden">
              {paginated.map((order) => (
                <OrderRow key={order.id} order={order} productId={product.id} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-px bg-zinc-100 mx-6 flex-shrink-0" />
        <div className="px-6 py-3 bg-stone-50 rounded-b-2xl flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-zinc-400">
            {activeOrders.length > 0
              ? `Hiển thị ${Math.min((page - 1) * PAGE_SIZE + 1, activeOrders.length)}–${Math.min(page * PAGE_SIZE, activeOrders.length)} / ${activeOrders.length} đơn`
              : ""}
          </span>
          <div className="flex items-center gap-3">
            <Pagination page={page} total={activeOrders.length} onChange={setPage} />
            <button onClick={onClose}
              className="px-4 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors">
              Đóng
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}