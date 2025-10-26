# 🔌 DBL SMS Server Integration Guide

## Overview

This system now integrates with **DBL's SMS Server API** for sending and receiving SMS via GoIP gateways. This guide covers complete setup and configuration.

---

## 📋 Prerequisites

1. **DBL SMS Server** installed and running (v1.27 or above)
2. **GoIP device(s)** connected to DBL SMS Server
3. **Network connectivity** between your application server and DBL SMS Server
4. **DBL SMS Server credentials** (username and password)

---

## ⚙️ Configuration Steps

### Step 1: Update Environment Variables

Edit your `.env.local` file (or create from `.env.example`):

```env
# Supabase Configuration (already set)
NEXT_PUBLIC_SUPABASE_URL=https://ncftsabdnuwemcqnlzmr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_yfqwdfHDBZGJ48k2viDaag_3onwq4BC
SUPABASE_SERVICE_ROLE_KEY=sb_secret_uSVP_KNYYxQV6KEdgBN2fQ_oyJL2TzI

# DBL SMS Server Configuration
DBL_SMS_SERVER_IP=192.168.1.100          # Your DBL SMS Server IP address
DBL_SMS_SERVER_PORT=80                   # Default is 80
DBL_SMS_USERNAME=root                    # Your DBL login username
DBL_SMS_PASSWORD=your_password_here      # Your DBL login password

# Optional: Specify default provider or GoIP line
DBL_SMS_PROVIDER=                        # e.g., "China Mobile" (optional)
DBL_SMS_LINE=                            # e.g., "G101" (optional)

# Application URL (for webhook callbacks)
NEXT_PUBLIC_APP_URL=http://your-server-ip:3000
```

**Important Notes:**
- Replace `192.168.1.100` with your actual DBL SMS Server IP
- Replace `your_password_here` with your actual DBL password
- If deploying to production, use your public domain/IP for `NEXT_PUBLIC_APP_URL`

---

### Step 2: Configure DBL SMS Server Webhooks

#### 2.1 Configure Incoming SMS Forwarding

1. **Access DBL SMS Server Web Interface:**
   - Open browser: `http://YOUR_DBL_SERVER_IP`
   - Login with your credentials

2. **Navigate to System Settings:**
   - Look for "SMS Forwarding" or "Received SMS URL" settings

3. **Set the Webhook URL:**
   ```
   http://YOUR_APP_SERVER_IP:3000/api/sms/goip/incoming
   ```
   
   **For Production (with domain):**
   ```
   https://yourdomain.com/api/sms/goip/incoming
   ```

4. **Enable JSON Format:**
   - Ensure the format is set to **JSON** (not URL-encoded)
   - Method: **POST**

#### 2.2 Configure SMS Status Reports

1. **In DBL SMS Server Settings:**
   - Find "SMS Transmit Status Report URL" setting

2. **Set the Status Report URL:**
   ```
   http://YOUR_APP_SERVER_IP:3000/api/sms/dbl/status-report
   ```
   
   **For Production:**
   ```
   https://yourdomain.com/api/sms/dbl/status-report
   ```

3. **Enable automatic status reporting**
   - This allows real-time delivery status updates

---

### Step 3: Configure GoIP Lines in DBL

1. **Add your GoIP devices** to DBL SMS Server
2. **Configure providers** (optional):
   - e.g., "MTN Nigeria", "Airtel Nigeria", "Glo Nigeria"
3. **Set SMS limits** (if needed):
   - Daily limits per line
   - Total limits per line
4. **Test connectivity** between GoIP and DBL Server

---

## 🧪 Testing the Integration

### Test 1: Check Line Status

```bash
curl http://localhost:3000/api/sms/dbl/line-status
```

**Expected Response:**
```json
{
  "summary": {
    "total": 4,
    "active": 3,
    "online": 3,
    "offline": 1,
    "notRegistered": 0
  },
  "lines": [
    {
      "lineId": "G101",
      "online": true,
      "registered": true,
      "registrationStatus": "LOGIN",
      "remainingSMS": "Unlimited",
      "dailyRemaining": "56",
      "status": "active"
    }
  ]
}
```

### Test 2: Send Test SMS via API

You can test sending SMS directly via the DBL API:

```bash
curl -X POST http://YOUR_DBL_SERVER_IP/goip/sendsms/ \
  -H "Content-Type: application/json" \
  -d '{
    "auth": {
      "username": "root",
      "password": "your_password"
    },
    "number": "2348012345678",
    "content": "Test message from DBL SMS Server"
  }'
```

**Expected Response:**
```json
{
  "result": "ACCEPT",
  "taskID": "5689"
}
```

### Test 3: Simulate Incoming SMS

Use the **SMS Simulator** in the dashboard:

1. Login to dashboard: `http://localhost:3000`
2. Navigate to **SMS Simulator**
3. Enter agent phone: `2348011111101`
4. Send message: `R APGA:450 APC:320 PDP:280 LP:150`
5. Check **Results** page for submission

---

## 🔄 Webhook Data Formats

### Incoming SMS (DBL → Application)

**Endpoint:** `POST /api/sms/goip/incoming`

**JSON Format:**
```json
{
  "goip_line": "G101",
  "from_number": "2348012345678",
  "content": "R APGA:450 APC:320 PDP:280 LP:150",
  "recv_time": "2025-10-25 15:30:00"
}
```

### SMS Status Report (DBL → Application)

**Endpoint:** `POST /api/sms/dbl/status-report`

**JSON Format:**
```json
{
  "taskID": "5689.13600000000",
  "goip_line": "G101",
  "send": "succeeded",
  "receipt": "1"
}
```

**Status Values:**
- `succeeded` - SMS sent successfully
- `failed` - SMS sending failed
- `sending` - SMS is being sent
- `unsend` - SMS not sent yet

**Error Example:**
```json
{
  "taskID": "5689.13600000000",
  "goip_line": "G101",
  "send": "failed",
  "err_code": "331"
}
```

---

## 📊 API Endpoints

### Query Line Status
```
GET /api/sms/dbl/line-status
```
Returns status of all GoIP lines

### Query SMS Status
```
GET /api/sms/query-status?taskID=5689
```
Returns delivery status of a specific SMS task

### Incoming SMS Webhook
```
POST /api/sms/goip/incoming
```
Receives incoming SMS from DBL (JSON format)

### Status Report Webhook
```
POST /api/sms/dbl/status-report
```
Receives SMS delivery status from DBL

---

## 🔒 Security Considerations

### 1. Firewall Rules

**Allow incoming connections to your app server from DBL SMS Server:**
```bash
# Example: Ubuntu/Debian with UFW
sudo ufw allow from DBL_SERVER_IP to any port 3000
```

### 2. DBL Authentication

The DBL SMS Server requires authentication for all API calls:
- Store credentials in `.env.local` (never commit to git)
- Use strong passwords
- Rotate passwords periodically

### 3. IP Whitelisting (Recommended)

In your production deployment, add IP validation:

```typescript
// In webhook handlers
const allowedIPs = [process.env.DBL_SMS_SERVER_IP];
const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');

if (!allowedIPs.includes(clientIP)) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

---

## 🚨 Error Handling

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 1 | Unassigned number | Check phone number format |
| 17 | Network failure | Check GoIP network connection |
| 27 | Destination out of service | Recipient phone is off |
| 28 | Unidentified subscriber | Invalid phone number |
| 42 | Congestion | Retry after some time |
| 208 | SIM SMS storage full | Clear SIM card memory |
| 310 | SIM not inserted | Insert SIM card into GoIP |
| 311 | SIM PIN required | Disable SIM PIN |
| 322 | Memory full | Clear device memory |
| 331 | No network service | Check SIM registration |

**Full error code list:** See `src/lib/dbl-sms.ts` → `getDBLErrorMessage()`

### Monitoring SMS Failures

Check failed SMS in the database:

```sql
SELECT * FROM sms_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;
```

Or via the **Audit Logs** in the dashboard.

---

## 🌐 Production Deployment

### Using ngrok (for Testing)

```bash
ngrok http 3000
```

Copy the HTTPS URL and update DBL webhooks:
```
https://abc123.ngrok.io/api/sms/goip/incoming
https://abc123.ngrok.io/api/sms/dbl/status-report
```

### Digital Ocean / VPS Deployment

1. **Deploy your app** to Digital Ocean (or any VPS)
2. **Get public IP or domain**
3. **Update environment variables** with production values
4. **Configure DBL webhooks** with public URL
5. **Set up SSL** (recommended for production):
   ```
   https://yourdomain.com/api/sms/goip/incoming
   ```

---

## ✅ Pre-Launch Checklist

Before going live on election day:

- [ ] DBL SMS Server is running and accessible
- [ ] All GoIP lines are online and registered
- [ ] Environment variables configured correctly
- [ ] Incoming SMS webhook tested successfully
- [ ] Status report webhook tested
- [ ] SMS sending tested with real phone numbers
- [ ] Line status API returns correct data
- [ ] Error handling tested (wrong number, network issues, etc.)
- [ ] Database logging confirmed (check `sms_logs` table)
- [ ] Agent phone numbers loaded in database
- [ ] SMS Simulator tested with all command types
- [ ] Production URLs configured (no localhost)
- [ ] Firewall rules configured
- [ ] Backup DBL credentials stored securely

---

## 🆘 Troubleshooting

### Issue: "DBL SMS Server configuration missing"

**Solution:**
- Check `.env.local` file exists
- Verify all DBL_SMS_* variables are set
- Restart the application: `npm run dev`

### Issue: "Failed to send SMS"

**Solution:**
- Check DBL SMS Server is running: `http://DBL_SERVER_IP`
- Verify credentials are correct
- Check network connectivity: `ping DBL_SERVER_IP`
- Check line status: `GET /api/sms/dbl/line-status`
- Ensure at least one line is active and registered

### Issue: "Incoming SMS not received"

**Solution:**
- Verify webhook URL in DBL settings
- Check DBL can reach your app server (firewall)
- Test with ngrok if on localhost
- Check DBL SMS Server logs
- Verify JSON format is enabled (not form-encoded)

### Issue: "Status reports not arriving"

**Solution:**
- Configure status report URL in DBL settings
- Enable automatic status reporting
- Check network connectivity
- Review application logs: `npm run dev` console

---

## 📞 Support

For DBL SMS Server specific issues:
- Refer to DBL SMS Server documentation
- Check DBL SMS Server web interface logs
- Contact DBL support

For application issues:
- Check application logs
- Review database `sms_logs` table
- Check `audit_logs` for errors

---

## 🎯 Next Steps

After successful setup:

1. **Register all polling unit agents** (via Agents page)
2. **Train agents** on SMS command formats
3. **Test with real SIM cards** in GoIP devices
4. **Monitor line status** during testing
5. **Deploy to production** server
6. **Conduct full end-to-end test** before election day

---

**You're now ready to use DBL SMS Server with your Election Collation System! 🎉**
