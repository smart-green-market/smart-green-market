import { User, Phone, Mail, Star, Award, Calendar, MapPin } from "lucide-react";

export default function SupplierInfoCard({ supplier, id }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case "Đang hợp tác":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50 flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Đang hợp tác
          </span>
        );
      case "Chưa hợp tác":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/50 flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Chưa hợp tác
          </span>
        );
      case "Ngừng hợp tác":
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200/50 flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Ngừng hợp tác
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 mb-8 relative overflow-hidden font-['Geist',sans-serif]">
      {/* Decorative background circle */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
        <div className="flex gap-4 items-start">
          {/* Avatar */}
          {supplier.avatar ? (
            <img
              src={supplier.avatar}
              alt={supplier.name}
              className="w-14 h-14 rounded-xl object-cover shadow-md shadow-emerald-500/10 border border-neutral-100"
            />
          ) : (
            <div
              className={`w-14 h-14 rounded-xl ${supplier.avatarColor} text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-emerald-500/10`}
            >
              {supplier.name
                .split(" ")
                .slice(-2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </div>
          )}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-extrabold text-emerald-950 tracking-tight">
                {supplier.name}
              </h1>
              {getStatusBadge(supplier.status)}
            </div>
            <p className="text-xs text-neutral-400 font-medium">
              Mã đối tác:{" "}
              <span className="font-bold text-neutral-600">NCC-00{id}</span>
            </p>
            {/* Rating stars */}
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(supplier.rating)
                      ? "fill-amber-500"
                      : "text-neutral-200"
                  }`}
                />
              ))}
              <span className="text-xs font-bold text-neutral-600 ml-1">
                {supplier.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-neutral-100"></div>

      {/* Contact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
            Người liên hệ
          </span>
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-700">
            <User className="w-3.5 h-3.5 text-neutral-400" />
            {supplier.contact}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
            Số điện thoại
          </span>
          <a
            href={`tel:${supplier.phone}`}
            className="flex items-center gap-2 text-xs font-bold text-emerald-700 hover:underline"
          >
            <Phone className="w-3.5 h-3.5 text-neutral-400" />
            {supplier.phone}
          </a>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
            Thư điện tử
          </span>
          <a
            href={`mailto:${supplier.email}`}
            className="flex items-center gap-2 text-xs font-bold text-emerald-700 hover:underline"
          >
            <Mail className="w-3.5 h-3.5 text-neutral-400" />
            {supplier.email}
          </a>
        </div>
      </div>

      {/* Intro & Certifications */}
      <div className="mt-6 pt-6 border-t border-neutral-100 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-neutral-500">
              Giới thiệu nhà cung cấp
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-medium">
              {supplier.description}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-neutral-500">
              Địa chỉ kho bãi
            </h3>
            <div className="flex gap-2.5 items-start text-xs font-semibold text-neutral-700">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{supplier.address}</span>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-neutral-500 mb-2">
              Chứng nhận chất lượng
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {supplier.certifications.map((cert) => (
                <span
                  key={cert}
                  className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-100 flex items-center gap-1"
                >
                  <Award className="w-3 h-3" />
                  {cert}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                Quy mô
              </span>
              <span className="text-xs font-bold text-neutral-700 leading-tight block">
                {supplier.scale}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                Ngày tham gia
              </span>
              <span className="text-xs font-bold text-neutral-700 leading-tight block flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                {supplier.joinedDate}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
