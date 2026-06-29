export default function InfoCard({ icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}
