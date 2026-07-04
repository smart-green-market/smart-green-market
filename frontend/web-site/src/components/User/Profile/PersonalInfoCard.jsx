import {
    formatBuyerDate,
    formatBuyerSpent,
} from "../../../utils/buyerProfileUtils";

export default function PersonalInfoCard({ profile, onEdit }) {
    const avatar =
        profile?.user?.avatar_url || "https://placehold.co/128x128?text=Avatar";
    const fullName = profile?.user?.full_name || "—";
    const email = profile?.user?.email || "—";
    const phone = profile?.user?.phone || "—";

    return (
        <section className="rounded-xl bg-white p-8 shadow-sm outline outline-1 outline-zinc-100">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-emerald-950">
                    Thông tin cá nhân
                </h2>
                <button
                    type="button"
                    onClick={onEdit}
                    className="hover:scale-105 cursor-pointer rounded-lg bg-teal-800 px-6 py-2 text-sm font-semibold tracking-wide text-white hover:bg-teal-900"
                >
                    Chỉnh sửa
                </button>
            </div>

            <div className="mt-8 flex flex-col items-start gap-10 md:flex-row">
                <img
                    src={avatar}
                    alt={fullName}
                    className="h-32 w-32 rounded-full border-4 border-emerald-200 object-cover"
                />
                <div className="grid flex-1 gap-6 sm:grid-cols-2">
                    <ProfileField label="Họ tên" value={fullName} />
                    <ProfileField label="Email" value={email} />
                    <ProfileField label="Số điện thoại" value={phone} />
                    <ProfileField
                        label="Tổng đơn hàng"
                        value={String(profile?.total_orders ?? 0)}
                    />
                    <ProfileField
                        label="Tổng chi tiêu"
                        value={formatBuyerSpent(profile?.total_spent)}
                    />
                    <ProfileField
                        label="Đơn gần nhất"
                        value={formatBuyerDate(profile?.last_order_at)}
                    />
                    <ProfileField
                        label="Cấp bậc"
                        value={profile?.note?.trim() ? profile.note : "Khách hàng"}
                    />
                    <ProfileField
                        label="Điểm tích lũy"
                        value={String(profile?.loyalty_points ?? 0)}
                    />
                </div>
            </div>
        </section>
    );
}

function ProfileField({ label, value }) {
    return (
        <div>
            <p className="text-xs font-medium text-neutral-500">{label}</p>
            <p className="text-lg font-semibold text-zinc-900">{value}</p>
        </div>
    );
}
