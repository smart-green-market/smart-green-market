import { Badge, formatDate } from "./InfoHelpers";

export default function DocumentsCard({ documents }) {
  if (!documents || documents.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
        <div>
          <h2 className="font-bold text-emerald-950">Giấy tờ pháp lý</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Các giấy tờ chứng nhận đã được tải lên</p>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer" className="block border border-neutral-200 rounded-xl overflow-hidden hover:border-emerald-500 transition-colors group bg-neutral-50">
              <div className="h-40 bg-neutral-200 overflow-hidden relative">
                {doc.file_url ? (
                  <img src={doc.file_url} alt={doc.document_type_label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">Không có ảnh</div>
                )}
              </div>
              <div className="p-4 bg-white">
                <p className="text-sm font-semibold text-neutral-800 line-clamp-1">{doc.document_type_label}</p>
                <div className="flex justify-between items-center mt-3">
                  <Badge label={doc.status === "approved" ? "Đã duyệt" : doc.status} variant={doc.status === "approved" ? "green" : "yellow"} />
                  <span className="text-[11px] text-neutral-400">{formatDate(doc.created_at)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
