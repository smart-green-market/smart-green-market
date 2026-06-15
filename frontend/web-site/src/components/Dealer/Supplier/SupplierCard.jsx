import { Star, Phone, MapPin } from "lucide-react";

export default function SupplierCard({ supplier }) {
    return (
        <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between">
            <div>
                {/* Header */}
                <div className="flex justify-between items-start gap-2 mb-4">
                    <div>
                        <h3 className="text-base font-bold text-neutral-800">{supplier.name}</h3>
                        <div className="flex items-center gap-1 mt-1 text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-xs font-bold text-neutral-600">{supplier.rating}</span>
                        </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        supplier.status === "Đang hợp tác" ? "bg-emerald-100 text-emerald-800" : "bg-neutral-100 text-neutral-500"
                    }`}>
                        {supplier.status}
                    </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <span className="font-semibold text-neutral-700 shrink-0 w-24">Người liên hệ:</span>
                        <span>{supplier.contact}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="text-emerald-700 font-semibold">{supplier.phone}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-neutral-500">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <span>{supplier.address}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-neutral-50 pt-4 mt-auto">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md">
                    Nông sản chính:
                </span>
                <p className="text-xs text-neutral-600 mt-2 font-medium">
                    {supplier.items}
                </p>
            </div>
        </div>
    );
}