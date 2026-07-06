export function Toast({ message, tone = 'blue' }) {
  const tones = { blue: 'border-blue-200 bg-blue-50 text-blue-800', red: 'border-rose-200 bg-rose-50 text-rose-800', green: 'border-emerald-200 bg-emerald-50 text-emerald-800' };
  if (!message) return null;
  return <div className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>{message}</div>;
}
