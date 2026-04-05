import jwt from 'jsonwebtoken';
import { getJwtSecret, loadServiceEnvironment } from './env.js';

loadServiceEnvironment();

const JWT_SECRET = getJwtSecret();

export const signAccessToken = (user) =>
  jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role || 'patient',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: { message: 'Authentication required', status: 401 },
    });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(403).json({
      error: { message: 'Invalid or expired token', status: 403 },
    });
  }
};
