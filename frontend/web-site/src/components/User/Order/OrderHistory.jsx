export default function OrderStatusHistory({ history }) {
    if (!history || history.length === 0) {
      return null;
    }
  
    return (
      <div>
        <p className="mb-3 text-xs font-semibold tracking-wide text-slate-400">
          LỊCH SỬ TRẠNG THÁI
        </p>
        <div className="space-y-3">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-sm"
            >
              <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-700" />
              <div>
                <p className="font-semibold text-slate-800">{entry.label}</p>
                <p className="mt-0.5 text-sm text-slate-400">{entry.atLabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }