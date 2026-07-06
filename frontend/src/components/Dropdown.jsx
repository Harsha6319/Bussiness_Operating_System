export function Dropdown({ label, children }) {
  return (
    <details className="relative">
      <summary className="btn-secondary cursor-pointer list-none">{label}</summary>
      <div className="absolute right-0 z-20 mt-2 min-w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-soft">{children}</div>
    </details>
  );
}
