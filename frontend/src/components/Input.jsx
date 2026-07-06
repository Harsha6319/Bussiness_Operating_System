export function Input({ label, error, className = '', ...props }) {
  return (
    <label className={`block text-sm font-medium text-slate-700 ${className}`}>
      {label && <span>{label}</span>}
      <input className="input mt-1" {...props} />
      {error && <span className="mt-1 block text-sm text-rose-600">{error}</span>}
    </label>
  );
}
