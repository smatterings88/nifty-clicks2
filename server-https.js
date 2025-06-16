const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const ghlService = require('./services/ghlService');
const config = require('./config/config');

const app = express();
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const ghlHealth = await ghlService.checkApiHealth();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      ghl: ghlHealth,
      uptime: process.uptime(),
      protocol: req.protocol,
      secure: req.secure
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      message: 'Service unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// Main endpoint to track clicks and update contact
app.get('/track-click', async (req, res) => {
  const { referrer } = req.query;

  // Validate required parameters
  if (!referrer) {
    return res.status(400).json({
      error: 'Missing required parameter: referrer',
      message: 'Please provide a referrer parameter with the contact ID'
    });
  }

  try {
    console.log(`Processing click tracking for contact ID: ${referrer}`);

    // Get contact by ID directly
    const contact = await ghlService.getContactById(referrer);

    if (!contact) {
      console.log(`No contact found for ID: ${referrer}`);
      return res.status(404).json({
        error: 'Contact not found',
        message: `No contact found with ID: ${referrer}`
      });
    }

    console.log(`Found contact: ${contact.id} - ${contact.name || contact.email}`);

    // Get current click count and increment
    const currentCount = await ghlService.getCustomFieldValue(contact, 'pnl_click_count');
    const newCount = parseInt(currentCount) + 1;

    console.log(`Updating click count from ${currentCount} to ${newCount}`);

    // Update the contact's click count
    const updatedContact = await ghlService.updateContactCustomField(
      contact.id,
      'pnl_click_count',
      newCount.toString()
    );

    // Return success response
    res.json({
      success: true,
      message: 'Click count updated successfully',
      data: {
        contactId: contact.id,
        contactName: contact.name || contact.email,
        referrer: referrer,
        previousCount: currentCount,
        newCount: newCount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing click tracking:', error);

    // Handle specific error types
    if (error.name === 'GHLApiError') {
      return res.status(error.status === 401 ? 401 : 500).json({
        error: 'API Error',
        message: error.message,
        code: error.code
      });
    }

    // Handle validation errors
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Resource not found',
        message: error.message
      });
    }

    // Handle rate limit errors
    if (error.message.includes('Rate limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: error.message
      });
    }

    // Generic error response
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your request'
    });
  }
});

// Endpoint to get contact information (for testing)
app.get('/contact/:contactId', async (req, res) => {
  const { contactId } = req.params;

  try {
    const contact = await ghlService.getContactById(contactId);

    if (!contact) {
      return res.status(404).json({
        error: 'Contact not found',
        message: `No contact found with ID: ${contactId}`
      });
    }

    const clickCount = await ghlService.getCustomFieldValue(contact, 'pnl_click_count');

    res.json({
      success: true,
      data: {
        contactId: contact.id,
        name: contact.name,
        email: contact.email,
        clickCount: clickCount,
        lastUpdated: contact.dateUpdated
      }
    });

  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// Function to create self-signed certificates
const createSelfSignedCert = () => {
  const certDir = path.join(__dirname, 'certs');
  const keyPath = path.join(certDir, 'key.pem');
  const certPath = path.join(certDir, 'cert.pem');

  // Check if certificates already exist
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return { keyPath, certPath };
  }

  // Create certs directory if it doesn't exist
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  console.log('⚠️  Self-signed certificates not found.');
  console.log('📝 Please create SSL certificates using one of these methods:');
  console.log('');
  console.log('Method 1 - Using mkcert (Recommended):');
  console.log('  npm install -g mkcert');
  console.log('  mkcert create-ca');
  console.log('  mkcert create-cert');
  console.log('  mv cert.pem certs/');
  console.log('  mv key.pem certs/');
  console.log('');
  console.log('Method 2 - Using OpenSSL:');
  console.log('  openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes');
  console.log('');
  console.log('Method 3 - Use ngrok (see instructions below)');
  
  return null;
};

// Start HTTPS server
const startHttpsServer = () => {
  const certPaths = createSelfSignedCert();
  
  if (!certPaths) {
    console.log('❌ Cannot start HTTPS server without certificates');
    console.log('🔄 Starting HTTP server instead...');
    
    // Fallback to HTTP
    app.listen(PORT, () => {
      console.log(`🚀 HTTP Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📍 Track click: http://localhost:${PORT}/track-click?referrer=CONTACT_ID`);
    });
    return;
  }

  try {
    const privateKey = fs.readFileSync(certPaths.keyPath, 'utf8');
    const certificate = fs.readFileSync(certPaths.certPath, 'utf8');
    
    const credentials = { key: privateKey, cert: certificate };
    
    const httpsServer = https.createServer(credentials, app);
    
    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`🔒 HTTPS Server running on port ${HTTPS_PORT}`);
      console.log(`📍 Health check: https://localhost:${HTTPS_PORT}/health`);
      console.log(`📍 Track click: https://localhost:${HTTPS_PORT}/track-click?referrer=CONTACT_ID`);
      
      // Validate configuration on startup
      const validation = config.validateConfiguration();
      if (!validation.isValid) {
        console.warn('⚠️  Configuration warnings:');
        validation.errors.forEach(error => console.warn(`   - ${error}`));
      } else {
        console.log('✅ Configuration validated successfully');
      }
    });
    
    // Also start HTTP server for redirects
    const httpApp = express();
    httpApp.use((req, res) => {
      res.redirect(301, `https://localhost:${HTTPS_PORT}${req.url}`);
    });
    
    httpApp.listen(PORT, () => {
      console.log(`🔄 HTTP redirect server running on port ${PORT}`);
      console.log(`   (redirects to HTTPS)`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start HTTPS server:', error.message);
    console.log('🔄 Starting HTTP server instead...');
    
    // Fallback to HTTP
    app.listen(PORT, () => {
      console.log(`🚀 HTTP Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📍 Track click: http://localhost:${PORT}/track-click?referrer=CONTACT_ID`);
    });
  }
};

startHttpsServer();