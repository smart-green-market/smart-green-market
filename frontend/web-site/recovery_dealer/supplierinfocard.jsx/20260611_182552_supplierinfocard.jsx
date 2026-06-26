import { User, Phone, Mail, Award, MapPin } from "lucide-react";

export default function SupplierInfoCard({ supplier }) {
  const hasCertifications = supplier.certifications?.length > 0;
  const hasDescription = !!supplier.description;

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 mb-8 relative overflow-hidden font-['Geist',sans-serif]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header: Avatar + Tên */}
      <div className="flex gap-4 items-center">
        {supplier.avatarUrl ? (
          <img
            src={supplier.avatarUrl}
            alt={supplier.company_name}
            className="w-16 h-16 rounded-2xl object-cover shadow-md shadow-emerald-500/10 border border-neutral-100"
          />
        ) : (
          <div className={`w-16 h-16 rounded-2xl ${supplier.avatarColor || "bg-emerald-500"} text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-500/10`}>
            {supplier.company_name
              .split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase() || "NCC"}
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-black text-emerald-950 tracking-tight leading-tight">
          {supplier.company_name}
        </h1>
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-neutral-100" />

      {/* Contact Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {supplier.contactName && supplier.contactName !== "—" && (
          <div className="space-y-1.5">
            <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider">Người liên hệ</span>
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
              <User className="w-4 h-4 text-emerald-600 shrink-0" />
              {supplier.contactName}
            </div>
          </div>
        )}

        {supplier.phone && supplier.phone !== "—" && (
          <div className="space-y-1.5">
            <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider">Số điện thoại</span>
            <a href={`tel:${supplier.phone}`} className="flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors">
              <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
              {supplier.phone}
            </a>
          </div>
        )}

        {supplier.email && supplier.email !== "—" && (
          <div className="space-y-1.5">
            <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider">Thư điện tử</span>
            <a href={`mailto:${supplier.email}`} className="flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors">
              <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
              {supplier.email}
            </a>
          </div>
        )}

        {supplier.taxCode && (
          <div className="space-y-1.5">
            <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider">Mã số thuế</span>
            <div className="flex items-center gap-2 text-sm font-bold text-neutral-800">
              <span className="text-emerald-600 font-extrabold font-mono text-xs">#</span>
              {supplier.taxCode}
            </div>
          </div>
        )}
      </div>

      {/* Address & Description */}
      <div className="mt-8 pt-8 border-t border-neutral-100 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {hasDescription && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">Giới thiệu</h3>
              <p className="text-sm text-neutral-600 leading-relaxed font-medium">{supplier.description}</p>
            </div>
          )}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">Địa chỉ</h3>
            <div className="flex gap-2.5 items-start text-sm font-semibold text-neutral-800">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{supplier.address}</span>
            </div>
          </div>
        </div>

        {(hasCertifications || supplier.scale) && (
          <div className="space-y-6">
            {hasCertifications && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">Chứng nhận</h3>
                <div className="flex flex-wrap gap-2">
                  {supplier.certifications.map((cert) => (
                    <span key={cert} className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                      <Award className="w-3.5 h-3.5" />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {supplier.scale && (
              <div className="space-y-1.5">
                <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider block">Quy mô</span>
                <span className="text-sm font-bold text-neutral-800 block">{supplier.scale}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}