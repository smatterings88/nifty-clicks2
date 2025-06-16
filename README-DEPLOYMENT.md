# Deploying to Render.com - Step by Step Guide

## 📋 Prerequisites

Before starting, make sure you have:
- [ ] A GitHub account
- [ ] A Render.com account (free tier available)
- [ ] Your GoHighLevel API credentials
- [ ] This project code in a GitHub repository

---

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your GitHub Repository

1. **Create a new repository on GitHub:**
   - Go to [github.com](https://github.com)
   - Click "New repository"
   - Name it `ghl-click-tracker` (or your preferred name)
   - Make it public or private (both work with Render)
   - Don't initialize with README (we already have one)

2. **Push your code to GitHub:**
   ```bash
   # Initialize git (if not already done)
   git init
   
   # Add all files
   git add .
   
   # Commit your code
   git commit -m "Initial commit - GHL Click Tracker"
   
   # Add your GitHub repository as origin
   git remote add origin https://github.com/YOUR_USERNAME/ghl-click-tracker.git
   
   # Push to GitHub
   git push -u origin main
   ```

### Step 2: Sign Up for Render.com

1. **Create Render account:**
   - Go to [render.com](https://render.com)
   - Click "Get Started for Free"
   - Sign up with GitHub (recommended) or email
   - Verify your email if needed

2. **Connect GitHub:**
   - If you didn't sign up with GitHub, go to Account Settings
   - Connect your GitHub account
   - Authorize Render to access your repositories

### Step 3: Create a New Web Service

1. **Start deployment:**
   - From your Render dashboard, click "New +"
   - Select "Web Service"

2. **Connect repository:**
   - Choose "Build and deploy from a Git repository"
   - Click "Connect" next to your `ghl-click-tracker` repository
   - If you don't see it, click "Configure account" to grant access

3. **Configure service settings:**
   ```
   Name: ghl-click-tracker
   Region: Oregon (US West) or closest to you
   Branch: main
   Root Directory: (leave blank)
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Choose plan:**
   - Select "Free" plan (good for testing)
   - You can upgrade later if needed

### Step 4: Configure Environment Variables

**CRITICAL:** You must set these environment variables before deployment:

1. **In the Render dashboard, scroll to "Environment Variables"**

2. **Add these required variables:**
   ```
   Key: GHL_API_KEY
   Value: your_actual_ghl_api_key_here
   
   Key: GHL_LOCATION_ID  
   Value: your_actual_ghl_location_id_here
   
   Key: NODE_ENV
   Value: production
   ```

3. **How to get your GHL credentials:**
   
   **For API Key:**
   - Log into GoHighLevel
   - Go to Settings → Integrations → API
   - Create new API key with permissions:
     - Contacts: Read, Write
     - Custom Fields: Read
     - Locations: Read
   - Copy the key (save it securely!)

   **For Location ID:**
   - Use your existing app to call `/health` endpoint
   - Or use Postman/curl to call GHL locations API
   - Or check your GHL URL - it often contains the location ID

### Step 5: Deploy

1. **Start deployment:**
   - Click "Create Web Service"
   - Render will start building and deploying your app
   - This takes 2-5 minutes typically

2. **Monitor deployment:**
   - Watch the build logs in real-time
   - Look for any errors in the logs
   - Wait for "Deploy succeeded" message

3. **Get your app URL:**
   - Once deployed, you'll see your app URL
   - Format: `https://your-app-name.onrender.com`
   - Example: `https://ghl-click-tracker.onrender.com`

### Step 6: Test Your Deployment

1. **Test health endpoint:**
   ```bash
   curl "https://your-app-name.onrender.com/health"
   ```
   
   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2024-01-01T12:00:00.000Z",
     "ghl": {
       "status": "healthy",
       "statusCode": 200,
       "message": "API connection successful"
     },
     "uptime": 123.456
   }
   ```

2. **Test click tracking:**
   ```bash
   curl "https://your-app-name.onrender.com/track-click?referrer=YOUR_CONTACT_ID"
   ```

3. **Test in browser:**
   - Visit: `https://your-app-name.onrender.com/health`
   - Should see JSON response

### Step 7: Set Up Custom Domain (Optional)

1. **In Render dashboard:**
   - Go to your service settings
   - Click "Custom Domains"
   - Add your domain name
   - Follow DNS configuration instructions

2. **Configure DNS:**
   - Add CNAME record pointing to your Render URL
   - Wait for DNS propagation (can take up to 24 hours)

---

## 🔧 Troubleshooting Common Issues

### Issue 1: Build Fails
**Symptoms:** Build logs show npm install errors

**Solutions:**
- Check that `package.json` is in the root directory
- Ensure all dependencies are listed in `package.json`
- Try deleting `package-lock.json` and re-deploying

### Issue 2: App Crashes on Startup
**Symptoms:** "Application failed to respond" error

**Solutions:**
- Check environment variables are set correctly
- Verify GHL_API_KEY is valid
- Check logs for specific error messages
- Ensure PORT is not hardcoded (Render assigns it automatically)

### Issue 3: GHL API Connection Fails
**Symptoms:** Health check shows GHL as "unhealthy"

**Solutions:**
- Verify API key has correct permissions
- Check if API key has expired
- Ensure GHL_LOCATION_ID is correct
- Test API key manually with Postman

### Issue 4: Contact Not Found Errors
**Symptoms:** 404 errors when testing click tracking

**Solutions:**
- Verify contact ID exists in GoHighLevel
- Check contact ID format (should be alphanumeric string)
- Ensure contact is in the correct location
- Test with a known valid contact ID

### Issue 5: Custom Field Not Found
**Symptoms:** "Custom field pnl_click_count not found" error

**Solutions:**
- Create the custom field in GoHighLevel:
  - Go to Settings → Custom Fields
  - Create field with key: `pnl_click_count`
  - Set type to "Text" or "Number"
  - Apply to Contacts
- Ensure field key matches exactly (case-sensitive)

---

## 📊 Monitoring Your App

### View Logs
1. In Render dashboard, go to your service
2. Click "Logs" tab
3. Monitor real-time logs for errors or issues

### Check Metrics
1. Go to "Metrics" tab in your service
2. Monitor:
   - Response times
   - Memory usage
   - CPU usage
   - Request volume

### Set Up Alerts (Paid Plans)
1. Configure email alerts for:
   - Service downtime
   - High error rates
   - Resource usage spikes

---

## 🔄 Updating Your App

### Method 1: Git Push (Automatic)
1. Make changes to your code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update: description of changes"
   git push origin main
   ```
3. Render automatically detects changes and redeploys

### Method 2: Manual Deploy
1. In Render dashboard, go to your service
2. Click "Manual Deploy"
3. Select branch and click "Deploy"

---

## 💰 Cost Considerations

### Free Tier Limitations
- Service spins down after 15 minutes of inactivity
- 750 hours per month (enough for one always-on service)
- Slower cold start times
- Limited bandwidth

### Upgrading to Paid Plan
- Always-on service (no spin down)
- Faster performance
- More bandwidth
- Custom domains included
- Starting at $7/month

---

## 🔐 Security Best Practices

### Environment Variables
- Never commit API keys to Git
- Use Render's environment variable system
- Rotate API keys regularly

### API Security
- Monitor API usage in GoHighLevel
- Set up rate limiting (already implemented)
- Use HTTPS only (Render provides this automatically)

### Access Control
- Limit API key permissions to minimum required
- Monitor access logs
- Set up alerts for unusual activity

---

## 📚 Additional Resources

### Render Documentation
- [Render Node.js Guide](https://render.com/docs/node-express-app)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Custom Domains](https://render.com/docs/custom-domains)

### GoHighLevel Resources
- [API Documentation](https://highlevel.stoplight.io/docs/integrations/)
- [Custom Fields Guide](https://help.gohighlevel.com/support/solutions/articles/48000982203)

### Support
- **Render Support:** [help.render.com](https://help.render.com)
- **GoHighLevel Support:** Available in your GHL dashboard

---

## ✅ Deployment Checklist

Before going live, ensure:

- [ ] GitHub repository is set up and code is pushed
- [ ] Render account is created and connected to GitHub
- [ ] Environment variables are configured correctly
- [ ] GHL API key has proper permissions
- [ ] Custom field `pnl_click_count` exists in GoHighLevel
- [ ] Health check endpoint returns "ok"
- [ ] Click tracking endpoint works with test contact ID
- [ ] Logs show no errors
- [ ] App URL is accessible from browser
- [ ] Rate limiting is working properly
- [ ] Error handling is tested

---

## 🎯 Next Steps After Deployment

1. **Test thoroughly** with real contact IDs
2. **Monitor logs** for the first few days
3. **Set up monitoring** alerts if using paid plan
4. **Document your API endpoints** for your team
5. **Consider adding authentication** if needed
6. **Plan for scaling** if you expect high traffic

---

**🚀 You're now ready to deploy your GoHighLevel Click Tracker to Render.com!**

The deployment process typically takes 5-10 minutes once you have all your credentials ready. The free tier is perfect for testing and low-volume usage, and you can always upgrade later as your needs grow.