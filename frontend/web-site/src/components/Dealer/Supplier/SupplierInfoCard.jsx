import { User, Phone, Mail, Award, MapPin, Building2, BarChart3, Hash } from "lucide-react";

export default function SupplierInfoCard({ supplier }) {
  const hasCertifications = supplier.certifications?.length > 0;
  const hasDescription = !!supplier.description;

  const initials = (supplier.company_name || "")
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "NCC";

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm mb-8 overflow-hidden font-['Geist',sans-serif]">
      {/* ── Gradient Banner ── */}
      <div className="relative h-36 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute top-16 -right-6 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 left-20 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute top-4 left-6 w-16 h-16 bg-white/5 rounded-full" />
      </div>

      {/* ── Avatar + Company Name (overlapping banner) ── */}
      <div className="px-6 -mt-12 relative z-10">
        <div className="flex items-end gap-5">
          {supplier.avatarUrl ? (
            <img
              src={supplier.avatarUrl}
              alt={supplier.company_name}
              className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg shadow-emerald-500/15"
            />
          ) : (
            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-2xl border-4 border-white shadow-lg shadow-emerald-500/15`}>
              {initials}
            </div>
          )}
          <div className="pb-2">
            <h1 className="text-2xl md:text-3xl font-black text-emerald-950 tracking-tight leading-tight">
              {supplier.company_name}
            </h1>
            {supplier.scale && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  {supplier.scale}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Contact Info Pills ── */}
      <div className="px-6 mt-6">
        <div className="flex flex-wrap gap-3">
          {supplier.contactName && supplier.contactName !== "—" && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-50 rounded-xl border border-neutral-100 hover:bg-neutral-100/80 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider leading-none">Người liên hệ</p>
                <p className="text-sm font-semibold text-neutral-800 mt-0.5">{supplier.contactName}</p>
              </div>
            </div>
          )}

          {supplier.phone && supplier.phone !== "—" && (
            <a href={`tel:${supplier.phone}`} className="flex items-center gap-2 px-4 py-2.5 bg-neutral-50 rounded-xl border border-neutral-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all group cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                <Phone className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider leading-none">Điện thoại</p>
                <p className="text-sm font-semibold text-emerald-700 mt-0.5">{supplier.phone}</p>
              </div>
            </a>
          )}

          {supplier.email && supplier.email !== "—" && (
            <a href={`mailto:${supplier.email}`} className="flex items-center gap-2 px-4 py-2.5 bg-neutral-50 rounded-xl border border-neutral-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all group cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0 group-hover:bg-violet-100 transition-colors">
                <Mail className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider leading-none">Email</p>
                <p className="text-sm font-semibold text-violet-700 mt-0.5">{supplier.email}</p>
              </div>
            </a>
          )}

          {supplier.taxCode && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-50 rounded-xl border border-neutral-100">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Hash className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider leading-none">Mã số thuế</p>
                <p className="text-sm font-bold text-neutral-800 font-mono mt-0.5">{supplier.taxCode}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Description + Address + Certifications ── */}
      <div className="px-6 mt-6 pb-6">
        <div className="border-t border-neutral-100 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Description + Address */}
            <div className="lg:col-span-2 space-y-5">
              {hasDescription && (
                <div className="bg-neutral-50/70 rounded-xl p-5 border border-neutral-100/50">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Giới thiệu</h3>
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed font-medium">{supplier.description}</p>
                </div>
              )}

              <div className="bg-neutral-50/70 rounded-xl p-5 border border-neutral-100/50">
                <div className="flex items-center gap-2 mb-2.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Địa chỉ</h3>
                </div>
                <p className="text-sm font-semibold text-neutral-700">{supplier.address}</p>
              </div>
            </div>

            {/* Right: Certifications */}
            {hasCertifications && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Chứng nhận</h3>
                </div>
                <div className="flex flex-col gap-2.5">
                  {supplier.certifications.map((cert) => (
                    <div
                      key={cert}
                      className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-100/80 hover:shadow-sm hover:border-emerald-200 transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-sm">
                        <Award className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-bold text-emerald-800">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}