/**
 * Wrapper với border + header có icon.
 * Props: icon, title, children
 */
export default function Section({ icon, title, children }) {
  return (
    <div className="border border-zinc-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
        {icon}
        <span className="text-sm font-semibold text-zinc-800">{title}</span>
      </div>
      {children}
    </div>
  );
}
