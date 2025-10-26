# Reference ID Quick Reference Card

## 🎯 New Format at a Glance

```
INC-AWN-TE-001
│   │   │  └── Sequential (001-999)
│   │   └───── Ward (2 chars)
│   └───────── LGA (3 chars)
└───────────── Type (INC/EL)
```

## 📋 Common Examples

| Location | Next Incident | Next Election |
|----------|---------------|---------------|
| Awka North / Test Ward | `INC-AWN-TE-001` | `EL-AWN-TE-001` |
| Anambra East / Enugwu-Otu | `INC-ANE-EN-001` | `EL-ANE-EN-001` |
| Awka South / Awka V | `INC-AWS-AW-001` | `EL-AWS-AW-001` |
| Onitsha North / Central | `INC-ONN-CE-001` | `EL-ONN-CE-001` |
| Aguata / Achina-I | `INC-AGU-AC-001` | `EL-AGU-AC-001` |

## 🔧 For Developers

**Generate new ID:**
```typescript
const refId = await generateReadableReferenceId('INC', agent.lga, agent.ward, supabase);
```

**Check format:**
```typescript
const isNewFormat = referenceId.includes('-');
```

**Display with styling:**
```tsx
<span className={`font-mono ${
  refId.includes('-') 
    ? 'text-blue-600 font-semibold' 
    : 'text-gray-500 text-xs'
}`}>
  {refId}
</span>
```

## 🧪 Testing Commands

```bash
# Test abbreviation logic
node scripts/test-reference-id.js

# Test database integration
node scripts/test-reference-integration.js

# Build project
npm run build

# Run dev server
npm run dev
```

## 📊 Key Files

| File | Purpose |
|------|---------|
| `src/lib/utils.ts` | Core generation logic |
| `src/app/api/sms/goip/incoming/route.ts` | SMS handler integration |
| `src/app/dashboard/incidents/page.tsx` | UI display |
| `REFERENCE_ID_UPDATE.md` | Full technical docs |
| `TEST_NEW_REFERENCE_IDS.md` | Testing guide |
| `DEPLOYMENT_REFERENCE_ID_UPDATE.md` | Deployment checklist |

## ✅ Quality Checklist

Quick verification for any submission:

- [ ] Format is `XXX-YYY-ZZ-###`
- [ ] LGA abbreviation is 3 characters
- [ ] Ward abbreviation is 2 characters
- [ ] Sequence is 3 digits (001-999)
- [ ] ID is unique in database
- [ ] Visible in dashboard
- [ ] Sent in SMS response

## 🐛 Quick Troubleshooting

| Issue | Quick Fix |
|-------|-----------|
| Old format appears | Expected for existing records |
| Sequence wrong | Check LGA/Ward exact match |
| Duplicate ID | Unique constraint prevents this |
| Generation slow | Check database indexes |
| Fallback triggered | Verify database connection |

## 📞 SMS Examples

**Incident Submission:**
```
I GENERAL ballot box stolen
```

**Expected Response:**
```
Incident reported: INC-AWN-TE-001
Severity: MEDIUM
Status: REPORTED

We will investigate. Ref: INC-AWN-TE-001
```

**Election Result:**
```
R APGA:450 APC:320 LP:180
```

**Expected Response:**
```
Results saved: EL-AWN-TE-001

APGA: 450
APC: 320
LP: 180
Total: 950

Status: PENDING validation
```

## 🎨 UI Styling

**New format** (with dashes):
- Color: Blue (`text-blue-600`)
- Size: Normal (`text-sm`)
- Weight: Semibold

**Old format** (timestamp):
- Color: Gray (`text-gray-500`)
- Size: Smaller (`text-xs`)
- Weight: Normal

## 💾 Database Queries

**Count by location:**
```sql
SELECT COUNT(*) FROM incident_reports 
WHERE lga = 'Awka North' AND ward = 'Test Ward';
```

**Find by reference:**
```sql
SELECT * FROM incident_reports 
WHERE reference_id = 'INC-AWN-TE-001';
```

**List recent:**
```sql
SELECT reference_id, lga, ward, reported_at 
FROM incident_reports 
ORDER BY reported_at DESC 
LIMIT 10;
```

## 📈 Monitoring Queries

**Format distribution:**
```sql
SELECT 
  CASE 
    WHEN reference_id LIKE '%-%' THEN 'New Format'
    ELSE 'Old Format'
  END as format_type,
  COUNT(*) as count
FROM incident_reports
GROUP BY format_type;
```

**Recent submissions:**
```sql
SELECT reference_id, lga, ward, reported_at 
FROM incident_reports 
WHERE reference_id LIKE '%-%'
ORDER BY reported_at DESC 
LIMIT 5;
```

## 🔍 Search Tips

**By location pattern:**
```sql
-- All incidents in Awka North
SELECT * FROM incident_reports 
WHERE reference_id LIKE 'INC-AWN-%';

-- All from specific ward
SELECT * FROM incident_reports 
WHERE reference_id LIKE 'INC-AWN-TE-%';
```

## 💡 Pro Tips

1. **Case matters** - LGA/Ward names must match database exactly
2. **Sequence auto-increments** - Never manually set
3. **Both formats valid** - System handles old and new
4. **Fallback safe** - System won't fail, uses timestamp if needed
5. **Unique guaranteed** - Database constraint enforces

## 🚀 Deployment Status

- **Status:** ✅ Ready for Production
- **Tests:** ✅ All Passing
- **Documentation:** ✅ Complete
- **Risk:** 🟢 Low
- **Rollback:** ✅ Available

## 📚 Documentation Links

- **Technical Details:** `REFERENCE_ID_UPDATE.md`
- **Testing Guide:** `TEST_NEW_REFERENCE_IDS.md`
- **Deployment Guide:** `DEPLOYMENT_REFERENCE_ID_UPDATE.md`
- **This Quick Ref:** `REFERENCE_ID_QUICK_REF.md`

---

**Quick Support:** Check logs for `Generated incident ref:` or `Generated election ref:`

**Version:** 1.0 | **Last Updated:** 2025-10-26
