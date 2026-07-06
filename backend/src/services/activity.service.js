import { ActivityLog } from '../models/ActivityLog.js';

export function logActivity({ organizationId, actor, action, entity, entityId, metadata = {} }) {
  return ActivityLog.create({ organizationId, actor, action, entity, entityId, metadata });
}
