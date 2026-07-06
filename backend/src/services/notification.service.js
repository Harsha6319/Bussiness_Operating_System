import { Notification } from '../models/Notification.js';

export function createNotification({ organizationId, title, message, type = 'Info' }) {
  return Notification.create({ organizationId, title, message, type });
}
