import { asyncHandler } from '../utils/asyncHandler.js';
import { getBusinessSnapshot } from '../services/reporting.service.js';

export const dashboard = asyncHandler(async (req, res) => {
  const snapshot = await getBusinessSnapshot(req.organizationId);
  res.json({ data: snapshot });
});
