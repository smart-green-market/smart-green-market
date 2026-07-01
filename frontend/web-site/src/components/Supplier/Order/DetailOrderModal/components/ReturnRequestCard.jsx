import { RotateCcw, CheckCheck, XCircle, Loader2, ExternalLink, User, Calendar } from "lucide-react";
import { getReturnRecordStatusBadge } from "../constants";
import { fmtPrice, fmtDate } from "../utils";
import { enrichReturnItems } from "../../../../../services/api/orderService";

export default function ReturnRequestCard({
  returnRequest,
  orderItems = [],
  showActions = false,
  reviewLoading = false,
  onApprove,
  onReject,
}) {
  if (!returnRequest) return null;

  const statusBadge = getReturnRecordStatusBadge(returnRequest);
  const returnItems = enrichReturnItems(returnRequest.items, orderItems);
  const evidenceUrl = returnRequest.evidence_file_url ?? returnRequest.evidence_file;

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${
      showActions ? "border-amber-200 ring-1 ring-amber-100" : "border-neutral-200"
    }`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b flex flex-wrap items-center gap-2 ${
        showActions ? "border-amber-100 bg-amber-50/60" : "border-neutral-100 bg-neutral-50"
      }`}>
        <RotateCcw size={15} className={showActions ? "text-amber-600" : "text-neutral-400"} />
        <h3 className="font-bold text-gray-900 text-sm">
          Yêu cầu trả hàng #{returnRequest.id}
        </h3>
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusBadge.cls}`}>
          {statusBadge.label}
        </span>
        {showActions && (
          <span className="ml-auto text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-amber-100 text-amber-700 border-amber-200">
            Cần xử lý
          </span>
        )}
      </div>

      <div className="px-6 py-4 flex flex-col gap-4">
        {/* Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <User size={14} className="text-neutral-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-neutral-400 uppercase tracking-wide">Người gửi</p>
              <p className="font-semibold text-gray-900">
                {returnRequest.requested_by_username ?? "—"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar size={14} className="text-neutral-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-neutral-400 uppercase tracking-wide">Thời gian gửi</p>
              <p className="font-semibold text-gray-900">{fmtDate(returnRequest.created_at)}</p>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-neutral-400 uppercase tracking-wide">Hoàn tiền</p>
            <p className="font-extrabold text-emerald-800">
              {returnRequest.refund_amount != null
                ? fmtPrice(returnRequest.refund_amount)
                : "—"}
            </p>
          </div>
        </div>

        {returnRequest.reason && (
          <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-4 py-3">
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">
              Lý do trả hàng
            </p>
            <p className="text-sm text-gray-800">{returnRequest.reason}</p>
          </div>
        )}

        {/* Sản phẩm trả hàng */}
        <div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2">
            Sản phẩm trả hàng ({returnItems.length})
          </p>
          {returnItems.length === 0 ? (
            <p className="text-sm text-neutral-400 italic py-2">Không có chi tiết sản phẩm.</p>
          ) : (
            <div className="border border-neutral-100 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[40px_1fr_100px_110px] gap-3 px-4 py-2 text-[11px] font-semibold text-neutral-400 uppercase tracking-wide bg-neutral-50 border-b border-neutral-100">
                <div />
                <div>Sản phẩm</div>
                <div className="text-center">SL trả</div>
                <div className="text-right">Ước hoàn</div>
              </div>
              {returnItems.map((item) => (
                <div
                  key={item.id ?? `${item.purchase_order_item_id}-${item.product_name}`}
                  className="grid grid-cols-[40px_1fr_100px_110px] gap-3 items-center px-4 py-3 border-b border-neutral-50 last:border-0 bg-white"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
                    {item.product_thumbnail_url ? (
                      <img
                        src={item.product_thumbnail_url}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-base">🥬</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.product_name}</p>
                    {item.reason && (
                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                        Ghi chú: {item.reason}
                      </p>
                    )}
                    {item.unit_price && (
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {fmtPrice(item.unit_price)}
                        {item.product_unit ? `/${item.product_unit}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-bold text-gray-900">
                      {Number(item.quantity).toLocaleString("vi-VN")}
                    </span>
                    {item.product_unit && (
                      <span className="text-[11px] text-neutral-400 ml-0.5">{item.product_unit}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-800">
                      {item.estimated_refund != null ? fmtPrice(item.estimated_refund) : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {evidenceUrl && (
          <a
            href={evidenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
          >
            <ExternalLink size={14} />
            Xem chứng cứ đính kèm
          </a>
        )}

        {returnRequest.review_note && (
          <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-4 py-3">
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">
              Ghi chú duyệt
              {returnRequest.reviewed_by_username && (
                <span className="font-normal normal-case ml-1">
                  — {returnRequest.reviewed_by_username}
                </span>
              )}
            </p>
            <p className="text-sm text-gray-800">{returnRequest.review_note}</p>
          </div>
        )}

        {returnRequest.resolved_at && (
          <p className="text-xs text-neutral-400">
            Xử lý lúc: {fmtDate(returnRequest.resolved_at)}
          </p>
        )}

        {showActions && (
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onReject}
              disabled={reviewLoading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap border border-red-200 text-red-600 bg-white hover:bg-red-50 transition-all disabled:opacity-60"
            >
              <XCircle size={15} /> Từ chối trả hàng
            </button>
            <button
              type="button"
              onClick={onApprove}
              disabled={reviewLoading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap bg-emerald-800 text-white hover:bg-emerald-700 transition-all disabled:opacity-60 shadow-sm shadow-emerald-200"
            >
              {reviewLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <CheckCheck size={15} />
              )}
              Duyệt trả hàng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
