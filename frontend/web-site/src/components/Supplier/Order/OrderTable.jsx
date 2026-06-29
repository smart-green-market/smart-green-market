import { formatDateTime } from "../../common/formatDateTime";
import { useState, useMemo } from "react";
import { Eye, ChevronDown, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { extractOrderItems, normalizeOrderItem } from "../../../services/api/orderService";

const getOrderItemsSummary = (row) => {
  const rawItems = extractOrderItems(row);
  const items = Array.isArray(rawItems) ? rawItems.map(normalizeOrderItem) : [];
  if (!items.length) return "—";
  return items.map(item => `${item.product_name} x${item.quantity}`).join(", ");
};

const getOrderItemsQty = (row) => {
  const rawItems = extractOrderItems(row);
  const items = Array.isArray(rawItems) ? rawItems.map(normalizeOrderItem) : [];
  if (!items.length) return 0;
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
};

// Status -> pill tone + label, matching the .pill.{g|a|b|gr|r} classes in the mockup
const ORDER_STATUS_CONFIG = {
  pending_supplier_confirmation: { label: "Chờ duyệt", tone: "a" },
  rejected: { label: "Từ chối", tone: "r" },
  confirmed: { label: "Đã xác nhận", tone: "b" },
  deposit_pending_verification: { label: "Chờ xác nhận cọc", tone: "a" },
  deposit_paid: { label: "Đã cọc", tone: "b" },
  processing: { label: "Chuẩn bị hàng", tone: "b" },
  shipping: { label: "Đang giao", tone: "a" },
  delivered: { label: "Đã giao", tone: "g" },
  final_payment_pending_verification: { label: "Chờ thanh toán cuối", tone: "a" },
  completed: { label: "Hoàn tất", tone: "g" },
  cancelled: { label: "Đã hủy", tone: "gr" },
};

// Tinh gọn danh sách bộ lọc theo yêu cầu
const STATUS_FILTERS = [
  { key: "all", label: "Tất cả trạng thái" },
  { key: "pending_supplier_confirmation", label: "Chờ duyệt" },
  { key: "deposit_pending_verification", label: "Chờ xác nhận cọc" },
  { key: "final_payment_pending_verification", label: "Chờ thanh toán cuối" },
  { key: "completed", label: "Hoàn tất" },
  { key: "cancelled", label: "Hủy / Từ chối", statuses: ["cancelled", "rejected"] },
];

// Pill tones copied 1:1 from the mockup's :root variables.
const PILL_TONES = {
  g: { bg: "#EAF3DE", text: "#3B6D11" },
  a: { bg: "#FAEEDA", text: "#854F0B" },
  b: { bg: "#E6F1FB", text: "#185FA5" },
  p: { bg: "#EEEDFE", text: "#534AB7" },
  r: { bg: "#FCEBEB", text: "#A32D2D" },
  gr: { bg: "#f3f4f6", text: "#565f6b" },
};

const FONT = "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// Sortable columns: key -> accessor function returning a comparable value
const SORT_ACCESSORS = {
  order_code: (row) => row.order_code ?? "",
  dealer_name: (row) => row.dealer_name ?? "",
  total_amount: (row) => Number(row.total_amount) || 0,
  requested_delivery_time: (row) => row.requested_delivery_time ?? "",
  created_at: (row) => row.created_at ?? "",
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

function StatusPill({ status }) {
  const cfg = ORDER_STATUS_CONFIG[status] ?? { label: status || "Không xác định", tone: "gr" };
  const { bg, text } = PILL_TONES[cfg.tone];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
      style={{ background: bg, color: text, fontFamily: FONT }}
    >
      {cfg.label}
    </span>
  );
}

const PAGE_SIZE = 10;

export default function OrderTable({ data, search, loading, onView }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(null);

  const toggleSort = (key) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc")  return { key, dir: "desc" };
      return null; // reset
    });
  };

  const keyword = (search ?? "").trim().toLowerCase();

  const filtered = data.filter((row) => {
    const matchSearch =
      !keyword ||
      row.order_code?.toLowerCase().includes(keyword) ||
      row.dealer_name?.toLowerCase().includes(keyword);

    const activeFilter = STATUS_FILTERS.find((f) => f.key === statusFilter);
    const matchStatus =
      statusFilter === "all" ||
      (activeFilter?.statuses
        ? activeFilter.statuses.includes(row.status)
        : row.status === statusFilter);

    return matchSearch && matchStatus;
  });

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const { key, dir } = sort;
    const accessor = SORT_ACCESSORS[key];
    if (!accessor) return filtered;

    return [...filtered].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av === bv) return 0;
      const factor = dir === "asc" ? 1 : -1;
      return av > bv ? factor : -factor;
    });
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="w-full flex flex-col gap-3" style={{ fontFamily: FONT }}>
      {/* Giao diện bộ lọc Dropdown thay thế cho hàng Chip cũ */}
      <div className="flex items-center gap-2 self-start">
        <div className="relative inline-block w-52">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full pl-3.5 pr-9 py-2 text-xs font-medium rounded-lg border appearance-none cursor-pointer focus:outline-none transition-all shadow-sm"
            style={
              statusFilter !== "all"
                ? { background: "#0f3d20", color: "#d1fae5", border: "0.5px solid #0f3d20" }
                : { background: "#ffffff", color: "#565f6b", border: "0.5px solid #e5e7eb" }
            }
          >
            {STATUS_FILTERS.map(({ key, label }) => (
              <option 
                key={key} 
                value={key} 
                style={{ background: "#ffffff", color: "#111827" }}
              >
                {label}
              </option>
            ))}
          </select>
          {/* Custom Chevron Icon gọn gàng */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
            <ChevronDown
              className="w-4 h-4 transition-colors"
              style={{ color: statusFilter !== "all" ? "#d1fae5" : "#80899a" }}
            />
          </div>
        </div>
      </div>

      {/* Card wrapper — mirrors .card */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#ffffff", border: "0.5px solid #e5e7eb" }}
      >
        {/* Header row inside card — mirrors .ch */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "0.5px solid #e5e7eb" }}
        >
          <span className="text-[13px] font-medium" style={{ color: "#111827" }}>
            Danh sách đơn hàng
          </span>
          <span className="text-[11px]" style={{ color: "#80899a" }}>
            {filtered.length} đơn hàng
          </span>
        </div>

        {/* Row list — mirrors .pl-wrap / .plh / .plr */}
        <div className="overflow-x-auto">
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 text-[10px] uppercase tracking-wide"
            style={{ minWidth: 760, color: "#80899a", borderBottom: "0.5px solid #e5e7eb" }}
          >
            <div style={{ flex: 1, minWidth: 140 }}>
              <span
                className="inline-flex items-center gap-1 cursor-pointer select-none hover:text-[#111827] transition-colors"
                onClick={() => toggleSort("order_code")}
              >
                Mã đơn
                <SortIcon active={sort?.key === "order_code"} direction={sort?.dir} />
              </span>
            </div>
            <div style={{ width: 160, flexShrink: 0 }}>
              <span
                className="inline-flex items-center gap-1 cursor-pointer select-none hover:text-[#111827] transition-colors"
                onClick={() => toggleSort("dealer_name")}
              >
                Đại lý
                <SortIcon active={sort?.key === "dealer_name"} direction={sort?.dir} />
              </span>
            </div>
            <div style={{ width: 110, flexShrink: 0, textAlign: "right" }}>
              <span
                className="inline-flex items-center justify-end gap-1 cursor-pointer select-none hover:text-[#111827] transition-colors w-full"
                onClick={() => toggleSort("total_amount")}
              >
                Tổng tiền
                <SortIcon active={sort?.key === "total_amount"} direction={sort?.dir} />
              </span>
            </div>
            <div style={{ width: 150, flexShrink: 0 }}>
              <span
                className="inline-flex items-center gap-1 cursor-pointer select-none hover:text-[#111827] transition-colors"
                onClick={() => toggleSort("requested_delivery_time")}
              >
                Ngày giao mong muốn
                <SortIcon active={sort?.key === "requested_delivery_time"} direction={sort?.dir} />
              </span>
            </div>
            <div style={{ width: 130, flexShrink: 0 }}>
              <span
                className="inline-flex items-center gap-1 cursor-pointer select-none hover:text-[#111827] transition-colors"
                onClick={() => toggleSort("created_at")}
              >
                Ngày tạo
                <SortIcon active={sort?.key === "created_at"} direction={sort?.dir} />
              </span>
            </div>
            <div style={{ width: 130, flexShrink: 0, textAlign: "center" }}>Trạng thái</div>
            <div style={{ width: 56, flexShrink: 0 }} />
          </div>

          {loading ? (
            <div
              className="py-16 text-center text-sm"
              style={{ minWidth: 760, color: "#80899a" }}
            >
              Đang tải đơn hàng...
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="py-16 text-center text-sm"
              style={{ minWidth: 760, color: "#80899a" }}
            >
              Chưa có đơn hàng nào.
            </div>
          ) : (
            pageRows.map((row, idx) => (
              <div
                key={row.id ?? row.order_code ?? idx}
                className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-[#f9fafb]"
                style={{
                  minWidth: 760,
                  borderBottom: idx === pageRows.length - 1 ? "none" : "0.5px solid #e5e7eb",
                }}
              >
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div className="text-xs font-medium" style={{ color: "#111827" }}>
                    {row.order_code}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: "#80899a" }}>
                    {formatDateTime(row.created_at)}
                  </div>
                </div>
                <div
                  className="text-xs whitespace-nowrap overflow-hidden text-ellipsis"
                  style={{ width: 160, flexShrink: 0, color: "#565f6b" }}
                >
                  {row.dealer_name || "—"}
                </div>
                <div
                  className="text-xs font-medium text-right"
                  style={{ width: 110, flexShrink: 0, color: "#111827" }}
                >
                  {formatCurrency(row.total_amount)}
                </div>
                <div className="text-xs" style={{ width: 150, flexShrink: 0, color: "#565f6b" }}>
                  {formatDateTime(row.requested_delivery_time)}
                </div>
                <div className="text-xs" style={{ width: 130, flexShrink: 0, color: "#565f6b" }}>
                  {formatDateTime(row.created_at)}
                </div>
                <div style={{ width: 130, flexShrink: 0, textAlign: "center" }}>
                  <StatusPill status={row.status} />
                </div>
                <div style={{ width: 56, flexShrink: 0, textAlign: "right" }}>
                  <button
                    onClick={() => onView?.(row)}
                    title="Xem chi tiết"
                    className="w-[26px] h-[26px] rounded-md inline-flex items-center justify-center transition-colors hover:bg-[#e5e7eb]"
                    style={{ color: "#565f6b" }}
                  >
                    <Eye className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination footer */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderTop: "0.5px solid #e5e7eb" }}
          >
            <span className="text-[11px]" style={{ color: "#80899a" }}>
              Trang {safePage} / {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="px-3 h-[30px] rounded-md text-xs font-medium disabled:opacity-40"
                style={{ background: "#ffffff", color: "#565f6b", border: "0.5px solid #e5e7eb" }}
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="px-3 h-[30px] rounded-md text-xs font-medium disabled:opacity-40"
                style={{ background: "#ffffff", color: "#565f6b", border: "0.5px solid #e5e7eb" }}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}