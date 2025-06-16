const validateConfiguration = () => {
  const errors = [];
  
  if (!process.env.GHL_API_KEY) {
    errors.push('GHL_API_KEY environment variable is required');
  }
  
  if (!process.env.GHL_LOCATION_ID) {
    errors.push('GHL_LOCATION_ID environment variable is recommended for better performance');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const config = {
  // Server configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // GoHighLevel API configuration
  GHL_API_KEY: process.env.GHL_API_KEY,
  GHL_LOCATION_ID: process.env.GHL_LOCATION_ID,
  GHL_BASE_URL: 'https://rest.gohighlevel.com/v1',
  
  // Rate limiting configuration
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  
  // API configuration
  API_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  BASE_RETRY_DELAY: 1000, // 1 second
  
  // Cache configuration
  FIELD_DEFINITIONS_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  
  // Validation function
  validateConfiguration
};

module.exports = config;