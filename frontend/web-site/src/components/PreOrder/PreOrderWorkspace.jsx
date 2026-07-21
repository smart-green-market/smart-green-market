import { ClipboardList } from "lucide-react";
import SearchBar from "../common/SearchBar";
import PreOrderDetailPanel from "./PreOrderDetailPanel";
import PreOrderRequestCard from "./PreOrderRequestCard";
import PreOrderStatusSummary from "./PreOrderStatusSummary";

export default function PreOrderWorkspace({
  title,
  subtitle,
  headerActions,
  audience = "buyer",
  loading = false,
  requests = [],
  allCount = 0,
  statusCounts = {},
  statusFilter = "",
  onStatusFilterChange,
  filters = [],
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Tìm mã YC...",
  showSearch = false,
  selectedId,
  onSelect,
  detail,
  detailLoading = false,
  detailActions,
  emptyListMessage = "Chưa có yêu cầu đặt trước",
  emptyFilterMessage = "Không có yêu cầu ở trạng thái đã chọn.",
  emptyDetailMessage = "Chọn một yêu cầu để xem chi tiết.",
}) {
  const hasData = allCount > 0;
  const hasFiltered = requests.length > 0;

  return (
    <div className="space-y-4">
      {(title || subtitle) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title ? (
              <h1 className="text-xl font-bold text-emerald-950 sm:text-2xl">{title}</h1>
            ) : null}
            {subtitle ? (
              <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>
            ) : null}
          </div>
          {headerActions ? (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {headerActions}
            </div>
          ) : null}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {(showSearch || filters.length > 0) && (
          <div className="border-b border-stone-100 bg-stone-50/50 px-4 py-3 sm:px-5">
            {showSearch ? (
              <div className="mb-3 max-w-md">
                <SearchBar
                  value={searchQuery}
                  onChange={onSearchChange}
                  placeholder={searchPlaceholder}
                />
              </div>
            ) : null}
            {filters.length > 0 && hasData ? (
              <PreOrderStatusSummary
                counts={statusCounts}
                audience={audience}
                activeFilter={statusFilter}
                onFilterChange={onStatusFilterChange}
                filters={filters}
              />
            ) : null}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
          </div>
        ) : !hasData ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center">
            <ClipboardList className="h-10 w-10 text-neutral-300" />
            <p className="mt-3 font-medium text-neutral-700">{emptyListMessage}</p>
          </div>
        ) : !hasFiltered ? (
          <div className="flex min-h-[420px] items-center justify-center px-6 text-sm text-neutral-600">
            {emptyFilterMessage}
          </div>
        ) : (
          <div className="grid min-h-[520px] lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
            <div className="max-h-[min(72vh,680px)] overflow-y-auto border-b border-stone-100 bg-stone-50/30 p-3 lg:border-b-0 lg:border-r">
              <div className="space-y-2">
                {requests.map((item) => (
                  <PreOrderRequestCard
                    key={item.id}
                    request={item}
                    selected={selectedId === item.id}
                    onClick={() => onSelect?.(item.id)}
                    audience={audience}
                    compact
                  />
                ))}
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <PreOrderDetailPanel
                detail={detail}
                audience={audience}
                loading={detailLoading && !detail}
                emptyMessage={emptyDetailMessage}
              >
                {detailActions}
              </PreOrderDetailPanel>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
