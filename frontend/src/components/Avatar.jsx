export function Avatar({ name = 'User', imageUrl }) {
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  if (imageUrl) return <img className="h-9 w-9 rounded-full object-cover" src={imageUrl} alt={name} />;
  return <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{initials}</span>;
}
