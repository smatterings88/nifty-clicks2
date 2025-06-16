# GoHighLevel Click Tracker

A Node.js Express application that integrates with the GoHighLevel API to track clicks and update contact custom fields using contact IDs.

## Features

- **Click Tracking**: Accepts referrer parameter (contact ID) and increments contact click counts
- **GoHighLevel Integration**: Full API integration with direct contact lookup and custom field updates
- **Rate Limiting**: Respects GHL API limits with intelligent retry logic
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Health Checks**: Built-in health monitoring for the application and GHL API
- **Render.com Ready**: Configured for easy deployment to Render.com

## API Endpoints

### `GET /track-click?referrer=CONTACT_ID`
Tracks a click for the specified contact and increments their `pnl_click_count` custom field.

**Parameters:**
- `referrer` (required): Contact ID from GoHighLevel

**Response:**
```json
{
  "success": true,
  "message": "Click count updated successfully",
  "data": {
    "contactId": "contact_123",
    "contactName": "John Doe",
    "referrer": "contact_123",
    "previousCount": "5",
    "newCount": "6",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### `GET /contact/:contactId`
Retrieves contact information and current click count (for testing).

### `GET /health`
Health check endpoint that verifies application and GHL API status.

## Setup Instructions

### 1. Environment Variables

Create a `.env` file with the following variables:

```env
GHL_API_KEY=your_ghl_api_key_here
GHL_LOCATION_ID=your_ghl_location_id_here
PORT=3000
NODE_ENV=production
```

### 2. GoHighLevel Setup

1. **Get API Key:**
   - Log into your GoHighLevel account
   - Go to Settings → Integrations → API
   - Create a new API key with these permissions:
     - Contacts: Read, Write
     - Custom Fields: Read
     - Locations: Read

2. **Create Custom Field:**
   - In GHL, go to Settings → Custom Fields
   - Create a new field with key: `pnl_click_count`
   - Set type to "Text" or "Number"
   - Apply to Contacts

3. **Get Location ID:**
   - Use the health check endpoint or API to find your location ID
   - Add it to your environment variables

### 3. Local Development

```bash
# Install dependencies
npm install

# Start the server
npm run dev
```

The server will start on `http://localhost:3000`

### 4. Testing

Test the API endpoints:

```bash
# Health check
curl "http://localhost:3000/health"

# Track a click (replace CONTACT_ID with actual contact ID)
curl "http://localhost:3000/track-click?referrer=CONTACT_ID"

# Get contact info (replace CONTACT_ID with actual contact ID)
curl "http://localhost:3000/contact/CONTACT_ID"
```

## Deployment to Render.com

### 1. Create Render Service

1. Connect your GitHub repository to Render.com
2. Create a new "Web Service"
3. Configure the service:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: 18 or higher

### 2. Environment Variables

In Render dashboard, add these environment variables:
- `GHL_API_KEY`: Your GoHighLevel API key
- `GHL_LOCATION_ID`: Your GHL location ID
- `NODE_ENV`: `production`

### 3. Deploy

Render will automatically deploy when you push to your connected branch.

## Rate Limiting

The application implements rate limiting on two levels:

1. **Express Rate Limiting**: 100 requests per 15 minutes per IP
2. **GHL API Rate Limiting**: 100 requests per minute to GHL API

## Error Handling

The application handles various error scenarios:

- **Contact not found**: Returns 404 with descriptive message
- **API authentication errors**: Returns 401 with error details  
- **Rate limit exceeded**: Returns 429 with retry information
- **Invalid parameters**: Returns 400 with validation errors
- **Server errors**: Returns 500 with generic error message

## Architecture

```
├── server.js              # Main Express server
├── services/
│   └── ghlService.js      # GoHighLevel API integration
├── utils/
│   └── rateLimiter.js     # Rate limiting utility
├── config/
│   └── config.js          # Configuration management
└── .env                   # Environment variables
```

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Prevents abuse
- **Input Validation**: Parameter validation
- **Error Sanitization**: Prevents information leakage

## Monitoring

The application provides detailed logging for:
- API requests and responses
- Rate limiting events
- Error conditions
- Performance metrics

## Troubleshooting

### Common Issues

1. **"Contact not found" errors**
   - Verify the referrer parameter is a valid GoHighLevel contact ID
   - Check if contact exists in GoHighLevel
   - Ensure the contact ID format is correct

2. **Authentication failures**
   - Verify GHL_API_KEY is correct and has proper permissions
   - Check API key hasn't expired

3. **Custom field not found**
   - Ensure `pnl_click_count` field exists in GoHighLevel
   - Verify field key matches exactly (case-sensitive)

4. **Rate limit exceeded**
   - Reduce request frequency
   - Check for multiple instances hitting the same limits

### Debug Mode

Set `NODE_ENV=development` to enable detailed logging.

## Finding Contact IDs

To find contact IDs in GoHighLevel:

1. **Via GHL Interface:**
   - Go to Contacts in your GHL dashboard
   - Click on a contact
   - The contact ID will be in the URL: `/contacts/CONTACT_ID`

2. **Via API:**
   - Use the search endpoint to find contacts by email
   - The response will include the contact ID

3. **Via Webhooks:**
   - Contact IDs are included in webhook payloads
   - Set up webhooks to capture contact IDs automatically

## Support

For issues related to:
- **GoHighLevel API**: Check the [official documentation](https://highlevel.stoplight.io/docs/integrations/)
- **This application**: Check logs and error messages for debugging information