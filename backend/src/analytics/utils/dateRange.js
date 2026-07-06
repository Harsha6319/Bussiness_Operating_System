export function resolveDateRange(range = 'last30') {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (range === 'today') start.setHours(0, 0, 0, 0);
  else if (range === 'yesterday') {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  } else if (range === 'last7') start.setDate(start.getDate() - 7);
  else if (range === 'thisMonth') start.setDate(1);
  else if (range === 'lastMonth') {
    start.setMonth(start.getMonth() - 1, 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  } else start.setDate(start.getDate() - 30);

  return { start, end };
}

export function previousRange(start, end) {
  const diff = end.getTime() - start.getTime();
  return { start: new Date(start.getTime() - diff), end: new Date(start.getTime()) };
}
