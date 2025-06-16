const config = require('../config/config');
const RateLimiter = require('../utils/rateLimiter');

// Rate limiter for GHL API (100 requests per minute)
const rateLimiter = new RateLimiter(100, 60000);

class GHLApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'GHLApiError';
    this.status = status;
    this.code = code;
  }
}

// Cache for field definitions to avoid repeated API calls
let fieldDefinitionsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const handleApiResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
    let errorCode = `HTTP_${response.status}`;
    
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
      if (errorData.code) {
        errorCode = errorData.code;
      }
    } catch (parseError) {
      // Ignore JSON parse errors
    }
    
    throw new GHLApiError(errorMessage, response.status, errorCode);
  }
  
  return response.json();
};

const retryWithBackoff = async (operation, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Don't retry auth errors
      if (error.status === 401) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`Attempt ${attempt} failed, retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

const makeApiRequest = async (url, options = {}) => {
  // Check rate limiting
  if (!rateLimiter.canMakeRequest()) {
    const waitTime = rateLimiter.getWaitTime();
    throw new Error(`Rate limit exceeded. Wait ${waitTime}ms`);
  }

  const defaultHeaders = {
    'Authorization': `Bearer ${config.GHL_API_KEY}`,
    'Content-Type': 'application/json',
    'Version': '2021-07-28',
    'User-Agent': 'GHL-Click-Tracker/1.0'
  };

  const requestOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  console.log(`Making API request: ${options.method || 'GET'} ${url}`);
  
  const response = await fetch(url, requestOptions);
  return handleApiResponse(response);
};

const getCustomFieldDefinitions = async () => {
  const now = Date.now();
  
  // Return cached data if still valid
  if (fieldDefinitionsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return fieldDefinitionsCache;
  }

  const url = `${config.GHL_BASE_URL}/custom-fields/?locationId=${config.GHL_LOCATION_ID}`;
  
  const data = await makeApiRequest(url);
  
  // Create mapping of field ID to field key
  const fieldMap = {};
  if (data.customFields) {
    data.customFields.forEach(field => {
      if (field.id && field.fieldKey) {
        // Remove "contact." prefix if present
        const normalizedKey = field.fieldKey.startsWith('contact.') 
          ? field.fieldKey.substring(8) 
          : field.fieldKey;
        fieldMap[field.id] = normalizedKey;
      }
    });
  }
  
  // Cache the results
  fieldDefinitionsCache = fieldMap;
  cacheTimestamp = now;
  
  console.log(`Loaded ${Object.keys(fieldMap).length} custom field definitions`);
  return fieldMap;
};

const getContactById = async (contactId) => {
  const url = `${config.GHL_BASE_URL}/contacts/${contactId}`;
  
  const data = await retryWithBackoff(async () => {
    return await makeApiRequest(url);
  });
  
  // Handle different response structures
  const contact = data.contact || data;
  
  if (!contact || !contact.id) {
    return null;
  }
  
  console.log(`Retrieved contact: ${contact.id} - ${contact.name || contact.email}`);
  return contact;
};

const getCustomFieldValue = async (contact, fieldName) => {
  const fieldDefinitions = await getCustomFieldDefinitions();
  
  // Method 1: Check customField array (most reliable)
  if (contact.customField && Array.isArray(contact.customField)) {
    for (const field of contact.customField) {
      if (field.id && fieldDefinitions[field.id] === fieldName) {
        const value = field.value || field.field_value || field.fieldValue || '0';
        console.log(`Found custom field ${fieldName}: ${value}`);
        return value;
      }
    }
  }
  
  // Method 2: Check customFields object (fallback)
  if (contact.customFields && contact.customFields[fieldName]) {
    return contact.customFields[fieldName];
  }
  
  // Method 3: Check direct property (rare)
  if (contact[fieldName]) {
    return contact[fieldName];
  }
  
  console.log(`Custom field ${fieldName} not found, defaulting to 0`);
  return '0';
};

const updateContactCustomField = async (contactId, fieldName, fieldValue) => {
  // Get field definitions to find the field ID
  const fieldDefinitions = await getCustomFieldDefinitions();
  
  let customFieldId = null;
  for (const [id, key] of Object.entries(fieldDefinitions)) {
    if (key === fieldName) {
      customFieldId = id;
      break;
    }
  }
  
  if (!customFieldId) {
    throw new Error(`Custom field "${fieldName}" not found. Available fields: ${Object.values(fieldDefinitions).join(', ')}`);
  }
  
  const url = `${config.GHL_BASE_URL}/contacts/${contactId}`;
  
  const updateData = {
    customField: [
      {
        id: customFieldId,
        value: fieldValue
      }
    ]
  };
  
  console.log(`Updating contact ${contactId} field ${fieldName} to: ${fieldValue}`);
  
  const data = await retryWithBackoff(async () => {
    return await makeApiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  });
  
  return data.contact || data;
};

const checkApiHealth = async () => {
  try {
    const url = `${config.GHL_BASE_URL}/locations/`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.GHL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      status: response.ok ? 'healthy' : 'unhealthy',
      statusCode: response.status,
      message: response.ok ? 'API connection successful' : 'API connection failed'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message
    };
  }
};

module.exports = {
  getContactById,
  getCustomFieldValue,
  updateContactCustomField,
  checkApiHealth,
  getCustomFieldDefinitions
};