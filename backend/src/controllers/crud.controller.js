import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildQueryOptions, paginationMeta } from '../utils/query.js';

export function crudController(Model, entity, searchableFields = [], options = {}) {
  return {
    list: asyncHandler(async (req, res) => {
      const { filters, page, limit, skip, sort } = buildQueryOptions(req.query, searchableFields);
      const query = { organizationId: req.organizationId, ...filters };
      const [items, total] = await Promise.all([
        Model.find(query).sort(sort).skip(skip).limit(limit),
        Model.countDocuments(query)
      ]);
      res.json({ data: items, meta: paginationMeta(total, page, limit) });
    }),
    get: asyncHandler(async (req, res) => {
      const item = await Model.findOne({ _id: req.params.id, organizationId: req.organizationId, deletedAt: { $exists: false } });
      if (!item) throw new ApiError(404, `${entity} not found`);
      res.json({ data: item });
    }),
    create: asyncHandler(async (req, res) => {
      const payload = { ...req.body, organizationId: req.organizationId, createdBy: req.user?._id };
      if (options.beforeCreate) await options.beforeCreate(payload, req);
      const item = await Model.create(payload);
      if (options.afterCreate) await options.afterCreate(item, req);
      res.status(201).json({ data: item });
    }),
    update: asyncHandler(async (req, res) => {
      const item = await Model.findOneAndUpdate(
        { _id: req.params.id, organizationId: req.organizationId, deletedAt: { $exists: false } },
        { ...req.body, updatedBy: req.user?._id },
        { new: true, runValidators: true }
      );
      if (!item) throw new ApiError(404, `${entity} not found`);
      if (options.afterUpdate) await options.afterUpdate(item, req);
      res.json({ data: item });
    }),
    remove: asyncHandler(async (req, res) => {
      const item = await Model.findOneAndUpdate(
        { _id: req.params.id, organizationId: req.organizationId, deletedAt: { $exists: false } },
        { deletedAt: new Date(), deletedBy: req.user?._id, status: 'Inactive' },
        { new: true }
      );
      if (!item) throw new ApiError(404, `${entity} not found`);
      if (options.afterRemove) await options.afterRemove(item, req);
      res.json({ data: item });
    })
  };
}
