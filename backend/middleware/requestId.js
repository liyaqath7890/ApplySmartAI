import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID middleware.
 * Attaches a unique X-Request-ID header to every request/response.
 * If the client sends one, it's honoured (and sanitised).
 */
export const requestId = (req, res, next) => {
  // Accept incoming ID from reverse proxy / client (sanitise it first)
  const incomingId = req.headers['x-request-id'];
  const id = incomingId
    ? String(incomingId).replace(/[^a-zA-Z0-9-_]/g, '').substring(0, 64)
    : uuidv4();

  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
};

export default requestId;
