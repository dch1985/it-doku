import { Request, Response, NextFunction } from 'express';

/**
 * Request logging middleware
 * Logs all incoming requests with method, path, status code, and response time
 */
export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Log request start
  console.log(`[${timestamp}] ${req.method} ${req.path}`, {
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    contentType: req.get('content-type')
  });

  // Capture original end function
  const originalEnd = res.end.bind(res);

  // Override end function to log response
  res.end = function (chunk?: any, encoding?: any): Response {
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString();

    // Log response
    console.log(`[${timestamp}] ${req.method} ${req.path} ${res.statusCode}`, {
      duration: `${duration}ms`,
      statusCode: res.statusCode,
      contentLength: res.get('content-length')
    });

    // Call original end function
    originalEnd(chunk, encoding);
    return res;
  };

  next();
};

/**
 * Error logging middleware (separate from request logger)
 */
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();

  console.error(`[${timestamp}] ERROR:`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    method: req.method,
    path: req.path,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent')
  });

  next(err);
};

