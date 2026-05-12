const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({ 
      error: 'A record with this value already exists',
      field: err.meta?.target?.[0],
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
