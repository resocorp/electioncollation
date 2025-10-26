# 🔗 Webhook Configuration for DBL SMS Server

## Current Environment Setup

Based on your `.env.local`:
- **DBL SMS Server IP:** 159.65.59.78
- **Your App URL:** http://localhost:3000 (needs to be updated for production)

---

## ⚙️ Configure These Webhooks on DBL SMS Server

### Step 1: Access DBL SMS Server
1. Open browser: `http://159.65.59.78`
2. Login: `root` / `sm@phswebawka`

### Step 2: Configure Incoming SMS Webhook

**Menu:** System Settings → Received SMS URL / SMS Forwarding

**For Local Development with ngrok:**
```
https://YOUR-NGROK-URL.ngrok.io/api/sms/goip/incoming
```

**For Production:**
```
http://YOUR-PUBLIC-IP:3000/api/sms/goip/incoming
```

**Settings:**
- ✅ Format: JSON
- ✅ Method: POST
- ✅ Enable forwarding

### Step 3: Configure Status Report Webhook

**Menu:** System Settings → SMS Transmit Status Report URL

**For Local Development with ngrok:**
```
https://YOUR-NGROK-URL.ngrok.io/api/sms/dbl/status-report
```

**For Production:**
```
http://YOUR-PUBLIC-IP:3000/api/sms/dbl/status-report
```

**Settings:**
- ✅ Enable automatic status reporting
- ✅ Format: JSON

---

## 🧪 Testing Webhooks

### Test Incoming SMS Webhook

Send a test SMS from DBL or use curl:

```bash
curl -X POST http://localhost:3000/api/sms/goip/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "goip_line": "G101",
    "from_number": "2348011111101",
    "content": "HELP",
    "recv_time": "2025-10-25 20:00:00"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "type": "help"
}
```

### Test Status Report Webhook

```bash
curl -X POST http://localhost:3000/api/sms/dbl/status-report \
  -H "Content-Type: application/json" \
  -d '{
    "taskID": "5689",
    "goip_line": "G101",
    "send": "succeeded",
    "receipt": "1"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Status updated"
}
```

---

## 🌐 Using ngrok for Local Development

### 1. Install ngrok
Download from: https://ngrok.com/download

### 2. Start ngrok tunnel
```bash
ngrok http 3000
```

### 3. Copy the HTTPS URL
Example output:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

### 4. Update DBL Webhooks
Use the ngrok URL:
```
https://abc123.ngrok.io/api/sms/goip/incoming
https://abc123.ngrok.io/api/sms/dbl/status-report
```

### 5. Update .env.local
```env
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

---

## 🚀 Production Deployment

When deploying to production:

### 1. Update .env.local
```env
# Use your public IP or domain
NEXT_PUBLIC_APP_URL=http://YOUR_PUBLIC_IP:3000
# or
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2. Update DBL Webhooks
```
http://YOUR_PUBLIC_IP:3000/api/sms/goip/incoming
http://YOUR_PUBLIC_IP:3000/api/sms/dbl/status-report
```

### 3. Configure Firewall
Allow DBL server to reach your app:
```bash
# Allow from DBL SMS Server IP
sudo ufw allow from 159.65.59.78 to any port 3000
```

---

## ✅ Verification Checklist

- [ ] DBL SMS Server accessible at 159.65.59.78
- [ ] Logged into DBL web interface
- [ ] Incoming SMS webhook URL configured
- [ ] Status report webhook URL configured
- [ ] JSON format enabled (not form-encoded)
- [ ] POST method selected
- [ ] Automatic status reporting enabled
- [ ] Webhook URLs tested with curl
- [ ] Firewall allows DBL server → App server
- [ ] App server is running and accessible
- [ ] ngrok tunnel active (if local development)

---

## 🔍 Troubleshooting

### Webhook not receiving data?

1. **Check DBL can reach your app:**
   ```bash
   # On DBL server
   curl http://YOUR_APP_IP:3000/api/sms/goip/incoming
   ```

2. **Check firewall:**
   ```bash
   # Allow DBL server
   sudo ufw status
   sudo ufw allow from 159.65.59.78
   ```

3. **Check app is running:**
   ```bash
   npm run dev
   # Should show: ✓ Ready in 2.8s
   ```

4. **Check DBL logs:**
   - DBL Web Interface → Logs
   - Look for webhook errors

5. **Test with ngrok:**
   - If local development
   - Easier than configuring firewall

---

## 📞 Next Steps

1. Configure webhooks on DBL SMS Server
2. Test with curl commands above
3. Send test SMS from registered agent phone
4. Check `sms_logs` table in database
5. Verify responses in dashboard

---

**Need help?** Check the application logs while testing:
```bash
npm run dev
# Watch console for incoming webhook requests
```
