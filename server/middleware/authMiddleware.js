import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-change-me'

/**
 * Verifies the JWT token from the Authorization header.
 * Attaches req.user = { id, email, role } on success.
 * Returns 401 if token is missing or invalid.
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role }
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

/**
 * Requires the authenticated user to have the 'admin' role.
 * Must be used AFTER authenticate middleware.
 * Returns 403 if user is not an admin.
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}
