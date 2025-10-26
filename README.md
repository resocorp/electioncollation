# Election Collation System - Anambra 2025

Real-time election monitoring and result transmission system for Anambra Gubernatorial Election.

## Features

- 🚀 Real-time result submission via SMS
- 📊 Live dashboard with vote aggregation
- 🚨 Incident reporting and tracking
- 👥 Agent management (bulk upload support)
- 📱 SMS Gateway integration (DBL SMS Server + GoIP)
- 🔒 Role-based access control
- 📈 Analytics and reporting

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Real-time**: Supabase Realtime
- **SMS**: DBL SMS Server (GoIP Gateway)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase Database

1. Go to your Supabase project: https://ncftsabdnuwemcqnlzmr.supabase.co
2. Navigate to SQL Editor
3. Run the schema:
   - Copy contents of `supabase/schema.sql`
   - Execute in SQL Editor
4. Run the seed data:
   - Copy contents of `supabase/seed-data.sql`
   - Execute in SQL Editor

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Default Login Credentials

**Admin Account:**
- Email: `admin@election.com`
- Phone: `2348000000000`
- Password: `Admin123!`

## DBL SMS Server Setup

**See complete guide:** `DBL_SMS_SETUP.md`

1. Configure environment variables in `.env.local`:
```env
DBL_SMS_SERVER_IP=192.168.1.100
DBL_SMS_USERNAME=root
DBL_SMS_PASSWORD=your_password
```

2. Configure webhooks in DBL SMS Server:
   - Incoming SMS: `http://your-server:3000/api/sms/goip/incoming`
   - Status Reports: `http://your-server:3000/api/sms/dbl/status-report`

3. For local testing with ngrok:
```bash
ngrok http 3000
# Use: https://abc123.ngrok.io/api/sms/goip/incoming
```

## SMS Commands (for Agents)

### Submit Results
```
R APGA:450 APC:320 PDP:280 LP:150
```

### Report Incident
```
I Vote buying observed at polling unit entrance
```

### Check Status
```
STATUS
```

## Project Structure

```
election-collation/
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── (auth)/          # Authentication pages
│   │   ├── (dashboard)/     # Dashboard pages
│   │   ├── api/             # API routes
│   │   └── providers.tsx    # React Query provider
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   └── dashboard/       # Dashboard-specific components
│   └── lib/                 # Utilities
│       ├── supabase.ts      # Supabase client
│       └── utils.ts         # Helper functions
├── supabase/                # Database schema & seeds
│   ├── schema.sql           # Database schema
│   └── seed-data.sql        # Sample data
└── public/                  # Static files
```

## API Endpoints

### SMS
- `POST /api/sms/goip/incoming` - GoIP webhook
- `POST /api/sms/send` - Send SMS
- `GET /api/sms/simulator` - SMS testing interface

### Results
- `GET /api/results` - List results
- `POST /api/results/validate` - Validate result

### Incidents
- `GET /api/incidents` - List incidents
- `PUT /api/incidents/:id` - Update incident

### Agents
- `GET /api/agents` - List agents
- `POST /api/agents` - Create agent
- `POST /api/agents/bulk-upload` - CSV upload

## Anambra State Data

**21 LGAs:**
1. Aguata
2. Awka North
3. Awka South
4. Anambra East
5. Anambra West
6. Anaocha
7. Ayamelum
8. Dunukofia
9. Ekwusigo
10. Idemili North
11. Idemili South
12. Ihiala
13. Njikoka
14. Nnewi North
15. Nnewi South
16. Ogbaru
17. Onitsha North
18. Onitsha South
19. Orumba North
20. Orumba South
21. Oyi

**Political Parties:**
- APGA (All Progressives Grand Alliance) - Strong in Anambra
- APC (All Progressives Congress)
- PDP (Peoples Democratic Party)
- LP (Labour Party)
- NNPP, ADC, YPP, SDP

## GoIP Configuration

Update `.env.local` with your GoIP settings:

```env
GOIP_IP=192.168.1.100
GOIP_USERNAME=admin
GOIP_PASSWORD=your_password
```

In GoIP web interface:
1. Go to "SMS to HTTP"
2. Enable SMS forwarding
3. Set URL: `https://your-ngrok-url.com/api/sms/goip/incoming`
4. Method: POST
5. Save settings

## Support

For issues or questions, contact the development team.

## License

Proprietary - All Rights Reserved
