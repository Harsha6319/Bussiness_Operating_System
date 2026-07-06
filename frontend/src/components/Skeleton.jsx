export function Skeleton({ lines = 4 }) {
  return (
    <div className="panel space-y-3 p-5">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="h-4 animate-pulse rounded bg-slate-100" style={{ width: `${100 - index * 12}%` }} />
      ))}
    </div>
  );
}
