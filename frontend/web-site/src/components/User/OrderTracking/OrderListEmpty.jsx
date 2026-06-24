import { Link } from "react-router-dom";
import { PackageSearch } from "lucide-react";

const DEFAULT_TITLE = "Không có đơn hàng nào trong mục này.";
const DEFAULT_DESCRIPTION = "Thử chọn bộ lọc khác hoặc quay lại sau.";

export default function OrderListEmpty({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  actionLabel = "",
  actionHref = "",
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <PackageSearch className="h-7 w-7" />
      </div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>
      ) : null}
      {actionLabel && actionHref ? (
        <Link
          to={actionHref}
          className="mt-5 inline-flex items-center rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-emerald-900"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
