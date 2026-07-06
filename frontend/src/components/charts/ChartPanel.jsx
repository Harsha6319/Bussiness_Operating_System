export function ChartPanel({ title, children, action }) {
  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-950">{title}</p>
        {action}
      </div>
      <div className="h-72">{children}</div>
    </div>
  );
}
