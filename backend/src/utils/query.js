export function buildQueryOptions(query, searchableFields = []) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const sort = query.sort || '-createdAt';
  const filters = {};

  if (query.status) filters.status = query.status;
  if (query.category) filters.category = query.category;
  if (query.paymentStatus) filters.paymentStatus = query.paymentStatus;
  if (query.type) filters.type = query.type;
  if (query.customerType) filters.customerType = query.customerType;
  if (query.status) filters.status = query.status;
  if (query.includeDeleted !== 'true') filters.deletedAt = { $exists: false };
  if (query.includeArchived !== 'true') filters.status = filters.status || { $ne: 'Archived' };

  if (query.search && searchableFields.length) {
    filters.$or = searchableFields.map((field) => ({ [field]: { $regex: query.search, $options: 'i' } }));
  }

  return { page, limit, skip, sort, filters };
}

export function paginationMeta(total, page, limit) {
  return { total, page, limit, pages: Math.ceil(total / limit) || 1 };
}
