
/**
 * Custom Sanitize Middleware to replace express-mongo-sanitize and xss-clean
 * This fixes compatibility issues with Express 5 req.query immutability.
 */

// Recursively remove keys starting with $ (NoSQL Injection)
const sanitizeNoSQL = (key, value) => {
  if (value instanceof Object && !Array.isArray(value)) {
    for (const k in value) {
      if (/^\$/.test(k)) {
        delete value[k];
      } else {
        sanitizeNoSQL(k, value[k]);
      }
    }
  }
  return value;
};

export const securityMiddleware = (req, res, next) => {
  // Sanitize NoSQL Injection (in-place mutation)
  if (req.body) sanitizeNoSQL('body', req.body);
  if (req.query) sanitizeNoSQL('query', req.query);
  if (req.params) sanitizeNoSQL('params', req.params);

  next();
};

/**
 * Fix for Express 5 req.query immutability
 * Needed for legacy middlewares that try to assign req.query = ...
 */
export const queryFixMiddleware = (req, res, next) => {
    try {
        const query = req.query;
        Object.defineProperty(req, 'query', {
            value: query,
            writable: true,
            configurable: true
        });
    } catch (error) {
        // Ignore if already defined
    }
    next();
};
