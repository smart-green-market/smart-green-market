export default function PersonalInfoCard({ profile, onEdit }) {
  return (
    <section className="rounded-xl bg-white p-8 shadow-sm outline outline-1 outline-zinc-100">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-emerald-950">Thông tin cá nhân</h2>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg bg-teal-800 px-6 py-2 text-sm font-semibold tracking-wide text-white hover:bg-teal-900"
        >
          Chỉnh sửa
        </button>
      </div>

      <div className="mt-8 flex flex-col items-start gap-10 md:flex-row">
        <img
          src={profile.avatar}
          alt={profile.fullName}
          className="h-32 w-32 rounded-full border-4 border-emerald-200 object-cover"
        />
        <div className="flex-1 space-y-3">
          <ProfileField label="Họ tên" value={profile.fullName} />
          <ProfileField label="Email" value={profile.email} />
          <ProfileField label="Số điện thoại" value={profile.phone} />
          <ProfileField label="Thành viên" value={profile.memberLevel} />
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
