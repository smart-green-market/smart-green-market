import { useEffect, useId, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Tags,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatDateTime } from "../../common/formatDateTime";

const SEGMENT_AREAS = [
  { key: "vip", name: "Khách hàng VIP", color: "#7c3aed" },
  { key: "potential", name: "Khách hàng tiềm năng", color: "#2563eb" },
  { key: "passive", name: "Khách hàng thụ động", color: "#059669" },
  { key: "churnRisk", name: "Có nguy cơ rời bỏ", color: "#ea580c" },
];

const STATUS_LABELS = {
  active: "Hoạt động",
  inactive: "Tạm khóa",
  banned: "Bị cấm",
  pending: "Chờ duyệt",
};

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  inactive: "bg-neutral-100 text-neutral-600 border-neutral-200",
  banned: "bg-red-50 text-red-700 border-red-100",
  pending: "bg-amber-50 text-amber-700 border-amber-100",
};

function TablePagination({ page, pageSize, totalCount, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-100 px-5 py-4 sm:flex-row">
      <span className="text-sm font-medium text-neutral-500">
        Trang {page}/{totalPages} · Tổng {totalCount}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Trang trước"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: totalPages }, (_, index) => index + 1)
          .filter(
            (value) =>
              value === 1 ||
              value === totalPages ||
              Math.abs(value - page) <= 1,
          )
          .map((value, index, visiblePages) => (
            <span key={value} className="flex items-center gap-2">
              {index > 0 && value - visiblePages[index - 1] > 1 ? (
                <span className="text-neutral-400">…</span>
              ) : null}
              <button
                type="button"
                onClick={() => onPageChange(value)}
                className={`h-9 min-w-9 cursor-pointer rounded-lg px-2 text-sm font-bold transition ${
                  value === page
                    ? "bg-emerald-700 text-white"
                    : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {value}
              </button>
            </span>
          ))}
        <button
          type="button"
          aria-label="Trang sau"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function DealerSegmentChart({ data = [], loading, error, onRetry }) {
  const chartRows = data.map((item) => {
    const counts = Object.fromEntries(
      (item.segment_counts || []).map((segment) => [segment.code, segment.count]),
    );
    const createdAt = item.created_at ? new Date(item.created_at) : null;
    const hasValidCreatedAt = createdAt && !Number.isNaN(createdAt.getTime());
    return {
      id: item.id,
      date: hasValidCreatedAt
        ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(createdAt)
        : item.formatted_created_at || "—",
      fullDate: item.formatted_created_at || (hasValidCreatedAt ? formatDateTime(item.created_at) : "—"),
      vip: Number(counts.VIP || 0),
      potential: Number(counts.POTENTIAL || 0),
      passive: Number(counts.PASSIVE || 0),
      churnRisk: Number(counts.CHURN_RISK || 0),
      silhouetteScore: item.silhouette_score,
      totalCustomers: item.total_customers,
    };
  });
  const latest = chartRows.at(-1);
  const lowConfidence = latest?.silhouetteScore != null && latest.silhouetteScore < 0.4;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-violet-700" />
            <h2 className="text-lg font-bold text-neutral-900">
              Theo dõi phân khúc khách hàng
            </h2>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Biến động số khách hàng theo từng phân khúc trong 60 ngày gần nhất.
          </p>
        </div>
        {latest ? (
          <div className="flex gap-3">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-right">
              <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">Phiên gần nhất</p>
              <p className="mt-0.5 text-sm font-black text-neutral-900">{latest.fullDate}</p>
            </div>
            <div className={`rounded-xl border px-4 py-2 text-right ${lowConfidence ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
              <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">Silhouette Score</p>
              <p className={`mt-0.5 text-lg font-black ${lowConfidence ? "text-amber-700" : "text-emerald-700"}`}>
                {latest.silhouetteScore == null ? "—" : Number(latest.silhouetteScore).toFixed(3)}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="flex h-80 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
        </div>
      ) : error ? (
        <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-6 text-center text-red-700">
          <AlertTriangle className="h-8 w-8" />
          <p className="mt-3 text-sm font-semibold">{error}</p>
          <button type="button" onClick={onRetry} className="mt-4 cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">
            Thử lại
          </button>
        </div>
      ) : chartRows.length > 0 ? (
        <div>
          {lowConfidence ? (
            <div className="mb-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-900">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p><strong>SC của phiên gần nhất dưới 0.4.</strong> Nên thu thập thêm dữ liệu hoặc tăng số khách hàng trước khi sử dụng kết quả.</p>
            </div>
          ) : null}
          <div className="h-[390px] w-full rounded-xl border border-neutral-100 bg-neutral-50/30 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartRows} margin={{ top: 18, right: 24, left: 8, bottom: 8 }}>
                <defs>
                  {SEGMENT_AREAS.map((area) => (
                    <linearGradient key={area.key} id={`segment-${area.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={area.color} stopOpacity={0.65} />
                      <stop offset="95%" stopColor={area.color} stopOpacity={0.12} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
                <Tooltip
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ""}
                  formatter={(value, name) => [`${Number(value).toLocaleString("vi-VN")} khách`, name]}
                />
                <Legend verticalAlign="top" height={38} />
                {SEGMENT_AREAS.map((area) => (
                  <Area
                    key={area.key}
                    type="monotone"
                    dataKey={area.key}
                    name={area.name}
                    stackId="segments"
                    stroke={area.color}
                    strokeWidth={2}
                    fill={`url(#segment-${area.key})`}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center text-neutral-400">
          <Users className="mb-3 h-10 w-10" />
          <p className="text-sm font-medium">Chưa có lịch sử phân loại trong 60 ngày gần nhất.</p>
        </div>
      )}
    </section>
  );
}

export function DealerSegmentTable({
  rows,
  loading,
  error,
  page,
  pageSize,
  totalCount,
  onPageChange,
  onRetry,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-100 px-6 py-5">
        <h2 className="text-lg font-bold text-neutral-900">
          Danh sách nhóm khách hàng
        </h2>
      </div>
      <TableState loading={loading} error={error} onRetry={onRetry} />
      {!loading && !error ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-6 py-4">Mã nhóm</th>
                  <th className="px-6 py-4">Tên nhóm</th>
                  <th className="px-6 py-4">Mô tả</th>
                  <th className="px-6 py-4">Loại</th>
                  <th className="px-6 py-4">Cập nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((segment) => (
                  <tr key={segment.id} className="hover:bg-neutral-50/70">
                    <td className="px-6 py-4 text-sm font-bold text-emerald-700">
                      {segment.code || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-neutral-900">
                      {segment.name || "-"}
                    </td>
                    <td className="max-w-md px-6 py-4 text-sm text-neutral-600">
                      {segment.description || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                        {segment.is_system ? "Hệ thống" : "Tùy chỉnh"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {formatDateTime(segment.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 ? <EmptyTable text="Chưa có nhóm khách hàng." /> : null}
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={onPageChange}
          />
        </>
      ) : null}
    </section>
  );
}

export function DealerCustomerTable({
  rows,
  page,
  pageSize,
  totalCount,
  onPageChange,
  loading,
  error,
  onRetry,
  search,
  onSearchChange,
  segmentCode,
  onSegmentChange,
  segmentOptions,
}) {
  const hasActiveFilters = Boolean(search || segmentCode);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="relative z-20 border-b border-neutral-100 px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="shrink-0">
            <h2 className="text-lg font-bold text-neutral-900">
              Khách hàng của đại lý
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {hasActiveFilters ? "Tìm thấy" : "Tổng"} {totalCount} khách hàng thuộc cửa hàng.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:max-w-[720px] xl:justify-end">
            <label className="relative block min-w-0 flex-1 sm:min-w-[340px]">
              <span className="sr-only">Tìm kiếm khách hàng</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Tìm tên, email, số điện thoại..."
                className="h-12 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-sm text-neutral-800 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <div className="w-full shrink-0 sm:w-[230px]">
              <CustomerFilterDropdown
                icon={Tags}
                label="Phân loại"
                value={segmentCode || ""}
                onChange={onSegmentChange}
                allLabel="Tất cả"
                options={segmentOptions}
              />
            </div>
          </div>
        </div>
      </div>
      <TableState loading={loading} error={error} onRetry={onRetry} />
      {!loading && !error ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1330px] table-fixed text-left">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="w-[230px] px-6 py-4">Tên khách hàng</th>
                  <th className="w-[245px] px-6 py-4">Email</th>
                  <th className="w-[155px] px-6 py-4">Số điện thoại</th>
                  <th className="w-[190px] px-6 py-4">Tổng chi tiêu</th>
                  <th className="w-[210px] px-6 py-4">Phân loại</th>
                  <th className="w-[135px] px-6 py-4">Trạng thái</th>
                  <th className="w-[165px] px-6 py-4">Ngày đăng ký</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((customer) => (
                  <tr key={customer.id} className="hover:bg-neutral-50/70">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {customer.account?.avatar_url ? (
                          <img
                            src={customer.account.avatar_url}
                            alt={customer.full_name || "Khách hàng"}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                            {(customer.full_name || "?").trim().charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">
                            {customer.full_name || "-"}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-400">
                            {customer.dealer_name || "-"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-neutral-600">
                      {customer.email || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-neutral-600">
                      {customer.phone || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-neutral-900">
                      {Number(customer.total_spent || 0).toLocaleString("vi-VN")} ₫
                      <span className="ml-2 text-xs font-medium text-neutral-400">
                        ({customer.total_orders || 0} đơn)
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex whitespace-nowrap rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                        {customer.primary_segment?.name || "Chưa phân loại"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold ${
                        STATUS_STYLES[customer.status] || "border-neutral-200 bg-neutral-100 text-neutral-700"
                      }`}>
                        {STATUS_LABELS[customer.status] || customer.status || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {formatDateTime(customer.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 ? <EmptyTable text="Đại lý chưa có khách hàng." /> : null}
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={onPageChange}
          />
        </>
      ) : null}
    </section>
  );
}

function CustomerFilterDropdown({
  icon: Icon,
  label,
  value,
  onChange,
  allLabel,
  options = [],
  allowEmpty = true,
  align = "left",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();
  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label || allLabel;

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const selectValue = (nextValue) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-12 w-full cursor-pointer items-center gap-3 rounded-xl border bg-white px-3 text-left shadow-sm transition focus:outline-none focus:ring-4 focus:ring-emerald-100 ${
          open
            ? "border-emerald-500"
            : value
              ? "border-emerald-200"
              : "border-neutral-200 hover:border-neutral-300"
        }`}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          value ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"
        }`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-wide text-neutral-400">
            {label}
          </span>
          <span className={`block truncate text-sm font-semibold ${
            value ? "text-emerald-800" : "text-neutral-700"
          }`}>
            {selectedLabel}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          id={menuId}
          role="listbox"
          className={`absolute top-[calc(100%+8px)] z-50 w-full min-w-[220px] overflow-hidden rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl shadow-neutral-200/70 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="max-h-64 overflow-y-auto">
            {allowEmpty ? (
              <DropdownOption
                selected={!value}
                label={allLabel}
                onClick={() => selectValue("")}
              />
            ) : null}
            {options.map((option) => (
              <DropdownOption
                key={option.value}
                selected={option.value === value}
                label={option.label}
                onClick={() => selectValue(option.value)}
              />
            ))}
            {options.length === 0 ? (
              <p className="px-3 py-3 text-center text-xs text-neutral-400">
                Chưa có dữ liệu lựa chọn
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DropdownOption({ selected, label, onClick }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
        selected
          ? "bg-emerald-50 font-semibold text-emerald-800"
          : "text-neutral-700 hover:bg-neutral-50"
      }`}
    >
      <span className="truncate">{label}</span>
      {selected ? <Check className="h-4 w-4 shrink-0 text-emerald-600" /> : null}
    </button>
  );
}

function TableState({ loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!error) return null;

  return (
    <div className="flex h-40 flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm font-medium text-red-600">{error}</p>
      <button
        type="button"
        onClick={onRetry}
        className="cursor-pointer rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600"
      >
        Thử lại
      </button>
    </div>
  );
}

function EmptyTable({ text }) {
  return <div className="px-6 py-12 text-center text-sm text-neutral-500">{text}</div>;
}
