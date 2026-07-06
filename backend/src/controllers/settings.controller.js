import { Setting } from '../models/Setting.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getSettings = asyncHandler(async (req, res) => {
  const data = await Setting.findOne({ organizationId: req.organizationId });
  res.json({ data });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const data = await Setting.findOneAndUpdate({ organizationId: req.organizationId }, req.body, { new: true, upsert: true, runValidators: true });
  res.json({ data });
});
