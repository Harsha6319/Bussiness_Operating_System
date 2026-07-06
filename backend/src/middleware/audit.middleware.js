import { AuditLog } from '../models/AuditLog.js';

export const auditMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Intercept response finish to log the audit trail
  res.on('finish', async () => {
    // Only log mutations or highly sensitive reads (e.g. export)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) || req.path.includes('/export')) {
      const duration = Date.now() - start;
      
      try {
        await AuditLog.create({
          organizationId: req.organizationId || null,
          userId: req.user ? req.user._id : null,
          action: `${req.method} ${req.path}`,
          resource: req.baseUrl.split('/').pop(),
          resourceId: req.params.id || null,
          method: req.method,
          url: req.originalUrl,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          status: res.statusCode,
          duration,
          metadata: req.body && Object.keys(req.body).length ? req.body : null
        });
      } catch (error) {
        // Do not crash the application if audit logging fails
        console.error('Audit Log Error:', error);
      }
    }
  });
  
  next();
};
