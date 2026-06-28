/**
 * Role-Based Access Control (RBAC) middleware.
 *
 * Builds on top of the existing `restrictTo` helper in auth.js.
 * Adds permission-level checks so individual features can be gated
 * without changing route definitions.
 *
 * Roles: candidate | recruiter | admin
 */

// ── Permission Matrix ────────────────────────────────────────────────────────
const PERMISSIONS = {
  // Job aggregation
  'job:aggregate':        ['candidate', 'admin'],
  'job:read':             ['candidate', 'recruiter', 'admin'],
  'job:create':           ['recruiter', 'admin'],
  'job:update':           ['recruiter', 'admin'],
  'job:delete':           ['recruiter', 'admin'],

  // Applications
  'application:create':   ['candidate', 'admin'],
  'application:read:own': ['candidate', 'admin'],
  'application:read:all': ['recruiter', 'admin'],
  'application:update':   ['recruiter', 'admin'],

  // Resumes
  'resume:upload':        ['candidate', 'admin'],
  'resume:read:own':      ['candidate', 'admin'],
  'resume:generate':      ['candidate', 'admin'],

  // Cover letters
  'cover-letter:create':  ['candidate', 'admin'],
  'cover-letter:read:own':['candidate', 'admin'],

  // Portfolios
  'portfolio:manage':     ['candidate', 'admin'],

  // Notifications
  'notification:read':    ['candidate', 'recruiter', 'admin'],

  // Analytics
  'analytics:read:own':   ['candidate', 'recruiter', 'admin'],
  'analytics:read:all':   ['admin'],

  // Admin only
  'admin:users':          ['admin'],
  'admin:audit':          ['admin'],
  'admin:queues':         ['admin'],
  'admin:metrics':        ['admin'],
};

/**
 * Checks whether a role has a given permission.
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(role);
};

/**
 * Express middleware factory.
 * Usage:  router.get('/route', protect, requirePermission('job:read'), handler)
 * @param {string} permission
 */
export const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  if (!hasPermission(req.user.role, permission)) {
    return res.status(403).json({
      success: false,
      message: `Forbidden. Required permission: ${permission}`,
    });
  }

  next();
};

/**
 * Middleware that restricts to admin role only.
 * Convenience wrapper around requirePermission.
 */
export const adminOnly = requirePermission('admin:users');

export default { requirePermission, hasPermission, adminOnly };
