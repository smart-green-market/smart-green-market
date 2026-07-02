import { useState, useMemo, useEffect, useRef } from "react";
import { Eye, ChevronDown, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { extractOrderItems, normalizeOrderItem, orderService, getSuccessfullyReturnedItemIds, orderMayHaveReturnHistory } from "../../../services/api/orderService";
import {
  getSupplierOrderStatusConfig,
  SUPPLIER_ORDER_STATUS_FILTERS,
} from "./orderStatusConfig";

const ITEMS_SUMMARY_LIMIT = 3;
const RETURNED_ITEM_COLOR = "#A32D2D";

function getOrderItemsList(row) {
  const rawItems = extractOrderItems(row);
  return Array.isArray(rawItems) ? rawItems.map(normalizeOrderItem) : [];
}

// Plain-text summary (title tooltip)
const getOrderItemsSummaryText = (row) => {
  const items = getOrderItemsList(row);
  if (!items.length) return "—";
  const names = items.map((item) => item.product_name);
  if (names.length <= ITEMS_SUMMARY_LIMIT) return names.join(", ");
  return `${names.slice(0, ITEMS_SUMMARY_LIMIT).join(", ")}, ...`;
};

function OrderItemsCell({ row }) {
  const items = getOrderItemsList(row);
  const returnedIds = getSuccessfullyReturnedItemIds(row);

  if (!items.length) return "—";

  const visible = items.slice(0, ITEMS_SUMMARY_LIMIT);
  const hasMore = items.length > ITEMS_SUMMARY_LIMIT;

  return (
    <>
      {visible.map((item, i) => {
        const isReturned = returnedIds.has(String(item.id));
        return (
          <span key={item.id ?? i}>
            {i > 0 && ", "}
            <span
              style={{
                color: isReturned ? RETURNED_ITEM_COLOR : "#565f6b",
                fontWeight: isReturned ? 600 : 400,
              }}
            >
              {item.product_name}
            </span>
          </span>
        );
      })}
      {hasMore && <span style={{ color: "#565f6b" }}>, ...</span>}
    </>
  );
}

const getOrderItemsQty = (row) => {
  const items = getOrderItemsList(row);
  if (!items.length) return "0 kg";
  const total = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const unit = items[0]?.product_unit || "kg";
  return `${total.toLocaleString("vi-VN")} ${unit}`;
};

const RETURN_STATUS_ALIASES = {
  return_request: "return_requested",
  return_pending_review: "return_requested",
};

function normalizeOrderStatus(status) {
  const value = String(status ?? "").trim();
  return RETURN_STATUS_ALIASES[value] ?? value;
}

function matchesStatusFilter(row, statusFilter) {
  if (statusFilter === "all") return true;

  const rowStatus = normalizeOrderStatus(row?.status);
  const activeFilter = STATUS_FILTERS.find((f) => f.key === statusFilter);
  if (!activeFilter) return rowStatus === normalizeOrderStatus(statusFilter);

  if (activeFilter.statuses) {
    return activeFilter.statuses.some(
      (status) => normalizeOrderStatus(status) === rowStatus,
    );
  }

  return normalizeOrderStatus(statusFilter) === rowStatus;
}

const STATUS_FILTERS = SUPPLIER_ORDER_STATUS_FILTERS;

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
  confirmed_delivery_time: (row) => row.confirmed_delivery_time ?? "",
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

// Chỉ hiển thị ngày/tháng/năm, không hiện giờ
function formatDateOnly(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN"); // dd/MM/yyyy
}

function StatusPill({ status }) {
  const cfg = getSupplierOrderStatusConfig(status);
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
const TABLE_MIN_WIDTH = 980;
const DATE_COL_WIDTH = 88;
const ACTION_COL_WIDTH = 44;

export default function OrderTable({ data, search, loading, onView }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(null);

  // Cache items + returns theo order id
  const [detailCache, setDetailCache] = useState({}); // { [orderId]: { items, returns } }
  const fetchingIds = useRef(new Set());

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

    const matchStatus = matchesStatusFilter(row, statusFilter);

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

  // Fetch detail khi thiếu items hoặc thiếu returns (đơn có lịch sử trả hàng)
  useEffect(() => {
    const idsToFetch = pageRows
      .filter((row) => {
        if (fetchingIds.current.has(row.id)) return false;

        const cached = detailCache[row.id];
        const hasItems = extractOrderItems(row).length > 0 || (cached?.items?.length > 0);
        const hasReturns = Array.isArray(row.returns) && row.returns.length > 0;
        const returnsCached = cached?.returns !== undefined;

        if (!hasItems) return true;
        if (orderMayHaveReturnHistory(row) && !hasReturns && !returnsCached) return true;
        return false;
      })
      .map((row) => row.id);

    if (idsToFetch.length === 0) return;

    idsToFetch.forEach((id) => fetchingIds.current.add(id));

    Promise.all(
      idsToFetch.map(async (id) => {
        try {
          const detail = await orderService.getById(id);
          return [id, { items: detail?.items ?? [], returns: detail?.returns ?? [] }];
        } catch (error) {
          console.error(`Lỗi khi tải chi tiết đơn ${id}:`, error);
          return [id, { items: [], returns: [] }];
        } finally {
          fetchingIds.current.delete(id);
        }
      }),
    ).then((results) => {
      setDetailCache((prev) => {
        const next = { ...prev };
        for (const [id, detail] of results) next[id] = detail;
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safePage, data]);

  const getDisplayRow = (row) => {
    const cached = detailCache[row.id];
    const merged = { ...row };

    if (extractOrderItems(row).length === 0 && cached?.items?.length) {
      merged.items = cached.items;
    }
    if ((!Array.isArray(row.returns) || row.returns.length === 0) && cached?.returns !== undefined) {
      merged.returns = cached.returns;
    }
    return merged;
  };

  return (
    <div className="w-full flex flex-col gap-3" style={{ fontFamily: FONT }}>
      {/* Giao diện bộ lọc Dropdown thay thế cho hàng Chip cũ */}
      <div className="flex items-center gap-2 self-start">
        <div className="relative inline-block w-56 min-w-[13rem]">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full pl-3.5 pr-9 py-2 text-xs font-medium rounded-lg border appearance-none cursor-pointer focus:outline-none transition-all shadow-sm"
            style={
              statusFilter !== "all"
                ? { background: "#0f3d20", color: "#d1fae5", border: "0.5px solid #0f3d20", minWidth: "13rem" }
                : { background: "#ffffff", color: "#565f6b", border: "0.5px solid #e5e7eb", minWidth: "13rem" }
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
            className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wide"
            style={{ minWidth: TABLE_MIN_WIDTH, color: "#80899a", borderBottom: "0.5px solid #e5e7eb" }}
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
            <div style={{ width: 130, flexShrink: 0 }}>
              <span
                className="inline-flex items-center gap-1 cursor-pointer select-none hover:text-[#111827] transition-colors"
                onClick={() => toggleSort("dealer_name")}
              >
                Đại lý
                <SortIcon active={sort?.key === "dealer_name"} direction={sort?.dir} />
              </span>
            </div>
            <div style={{ width: 180, flexShrink: 0 }}>Sản phẩm</div>
            <div style={{ width: 60, flexShrink: 0, textAlign: "center" }}>Tổng SL</div>
            <div style={{ width: 95, flexShrink: 0, textAlign: "right" }}>
              <span
                className="inline-flex items-center justify-end gap-1 cursor-pointer select-none hover:text-[#111827] transition-colors w-full"
                onClick={() => toggleSort("total_amount")}
              >
                Tổng tiền
                <SortIcon active={sort?.key === "total_amount"} direction={sort?.dir} />
              </span>
            </div>
            <div style={{ width: DATE_COL_WIDTH, flexShrink: 0 }}>
              <span
                className="inline-flex items-center gap-1 cursor-pointer select-none hover:text-[#111827] transition-colors"
                onClick={() => toggleSort("created_at")}
              >
                Ngày tạo
                <SortIcon active={sort?.key === "created_at"} direction={sort?.dir} />
              </span>
            </div>
            <div style={{ width: DATE_COL_WIDTH, flexShrink: 0 }}>
              <span
                className="inline-flex items-center gap-1 cursor-pointer select-none hover:text-[#111827] transition-colors"
                onClick={() => toggleSort("requested_delivery_time")}
              >
                Ngày mong muốn
                <SortIcon active={sort?.key === "requested_delivery_time"} direction={sort?.dir} />
              </span>
            </div>
            <div style={{ width: DATE_COL_WIDTH, flexShrink: 0 }}>
              <span
                className="inline-flex items-center gap-1 cursor-pointer select-none hover:text-[#111827] transition-colors"
                onClick={() => toggleSort("confirmed_delivery_time")}
              >
                Giao cam kết
                <SortIcon active={sort?.key === "confirmed_delivery_time"} direction={sort?.dir} />
              </span>
            </div>
            <div style={{ width: 100, flexShrink: 0, textAlign: "center" }}>Trạng thái</div>
            <div style={{ width: ACTION_COL_WIDTH, flexShrink: 0 }} />
          </div>

          {loading ? (
            <div
              className="py-16 text-center text-sm"
              style={{ minWidth: TABLE_MIN_WIDTH, color: "#80899a" }}
            >
              Đang tải đơn hàng...
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="py-16 text-center text-sm"
              style={{ minWidth: TABLE_MIN_WIDTH, color: "#80899a" }}
            >
              Chưa có đơn hàng nào.
            </div>
          ) : (
            pageRows.map((rawRow, idx) => {
              const row = getDisplayRow(rawRow);
              const itemsLoaded = extractOrderItems(row).length > 0;

              return (
                <div
                  key={row.id ?? row.order_code ?? idx}
                  className="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-[#f9fafb] group"
                  style={{
                    minWidth: TABLE_MIN_WIDTH,
                    borderBottom: idx === pageRows.length - 1 ? "none" : "0.5px solid #e5e7eb",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div className="text-xs font-medium" style={{ color: "#111827" }}>
                      {row.order_code}
                    </div>
                  </div>
                  <div
                    className="text-xs whitespace-nowrap overflow-hidden text-ellipsis"
                    style={{ width: 130, flexShrink: 0, color: "#565f6b" }}
                  >
                    {row.dealer_name || "—"}
                  </div>
                  <div
                    className="text-xs whitespace-nowrap overflow-hidden text-ellipsis"
                    style={{ width: 180, flexShrink: 0 }}
                    title={itemsLoaded ? getOrderItemsSummaryText(row) : ""}
                  >
                    {itemsLoaded ? (
                      <OrderItemsCell row={row} />
                    ) : (
                      <span style={{ color: "#80899a" }}>Đang tải...</span>
                    )}
                  </div>
                  <div
                    className="text-xs text-center"
                    style={{ width: 60, flexShrink: 0, color: "#111827" }}
                  >
                    {itemsLoaded ? getOrderItemsQty(row) : "—"}
                  </div>
                  <div
                    className="text-xs font-medium text-right"
                    style={{ width: 95, flexShrink: 0, color: "#111827" }}
                  >
                    {formatCurrency(row.total_amount)}
                  </div>
                  <div className="text-xs" style={{ width: DATE_COL_WIDTH, flexShrink: 0, color: "#565f6b" }}>
                    {formatDateOnly(row.created_at)}
                  </div>
                  <div className="text-xs" style={{ width: DATE_COL_WIDTH, flexShrink: 0, color: "#565f6b" }}>
                    {formatDateOnly(row.requested_delivery_time)}
                  </div>
                  <div className="text-xs" style={{ width: DATE_COL_WIDTH, flexShrink: 0 }}>
                    {row.confirmed_delivery_time ? (
                      <span className="font-semibold" style={{ color: "#166534" }}>
                        {formatDateOnly(row.confirmed_delivery_time)}
                      </span>
                    ) : (
                      <span style={{ color: "#80899a" }}>—</span>
                    )}
                  </div>
                  <div style={{ width: 100, flexShrink: 0, textAlign: "center" }}>
                    <StatusPill status={normalizeOrderStatus(row.status)} />
                  </div>
                  <div
                    style={{ width: ACTION_COL_WIDTH, flexShrink: 0, textAlign: "center" }}
                    className="sticky right-0 bg-white group-hover:bg-[#f9fafb]"
                  >
                    <button
                      onClick={() => onView?.(row)}
                      title="Xem chi tiết"
                      className="w-[28px] h-[28px] rounded-md inline-flex items-center justify-center transition-colors hover:bg-[#e5e7eb]"
                      style={{ color: "#374151" }}
                    >
                      <Eye className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination footer */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div
            className="flex items-center justify-between px-3 py-2"
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