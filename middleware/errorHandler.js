export const errorHandler = (err, req, res, next) => {
  console.error(err);
  
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large. Maximum size is 5MB.'
    });
  }
  
  // Handle other multer errors
  if (err.code && err.code.startsWith('LIMIT_')) {
    return res.status(400).json({
      error: err.message
    });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: err.message
    });
  }
  
  // Handle Supabase errors
  if (err.code && err.code.startsWith('PGRST')) {
    return res.status(400).json({
      error: err.message
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
};