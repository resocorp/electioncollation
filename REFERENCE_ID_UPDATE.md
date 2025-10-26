# Reference ID Format Update

## Overview
Updated the reference ID generation system to use **human-readable, location-based identifiers** instead of complex timestamp-based codes.

## Changes Made

### Old Format (Timestamp-Based)
```
INC17614288991992665
EL17614289001234567
```
- **Problems:**
  - Too long and complex
  - Difficult to communicate verbally
  - No geographic context
  - Hard to remember

### New Format (Location-Based)
```
INC-AWN-TE-001
EL-AGU-AC-042
```

**Pattern:** `{PREFIX}-{LGA}-{WARD}-{SEQ}`

Where:
- `PREFIX` = Type identifier (INC for incidents, EL for elections)
- `LGA` = 3-character LGA abbreviation
- `WARD` = 2-character Ward abbreviation
- `SEQ` = 3-digit sequential number (001-999)

## Abbreviation Logic

### For LGA (3 characters):
1. **Single word** (e.g., "Aguata") → Take first 3 letters: `AGU`
2. **Two words** (e.g., "Awka North") → First 2 + Second 1: `AWN`
3. **Multiple words** → First letter of each word: `ABC`

### For Ward (2 characters):
1. **Single word** (e.g., "Central") → Take first 2 letters: `CE`
2. **Two words** (e.g., "Test Ward") → First 2 + Second 1 (capped): `TE`
3. **Multiple words** → First letter of each (capped): `WO`

## Examples

| Type | LGA | Ward | Seq | Reference ID | Meaning |
|------|-----|------|-----|--------------|---------|
| Incident | Awka North | Test Ward | 1 | `INC-AWN-TE-001` | First incident in Awka North/Test Ward |
| Incident | Onitsha North | Central | 42 | `INC-ONN-CE-042` | 42nd incident in Onitsha North/Central |
| Election | Aguata | Achina-I | 5 | `EL-AGU-AC-005` | 5th election result from Aguata/Achina-I |
| Election | Awka South | Amawbia | 123 | `EL-AWS-AM-123` | 123rd election result from Awka South/Amawbia |

## Implementation Details

### Files Modified

1. **`src/lib/utils.ts`**
   - Added `generateAbbreviation()` - Creates abbreviations from text
   - Added `generateReadableReferenceId()` - New async function for readable IDs
   - Kept `generateReferenceId()` as fallback for error cases

2. **`src/app/api/sms/goip/incoming/route.ts`**
   - Updated incident creation (line ~293)
   - Updated election result creation (line ~255)
   - Both now use `generateReadableReferenceId()`

### Database Considerations

- Sequential numbering is per LGA/Ward combination
- The system queries existing records to determine the next sequence number
- Each location has independent counters (e.g., AWN-TE can have 001 while ONN-CE also has 001)
- If database query fails, system falls back to timestamp-based ID

### Uniqueness Guarantee

The combination of:
- Prefix (INC/EL)
- LGA abbreviation (3 chars)
- Ward abbreviation (2 chars)
- Sequential number (3 digits)

Provides up to **999 incidents per ward** and **999 election results per ward**, which is sufficient for the use case.

## Benefits

✅ **Human-readable** - Easy to communicate over phone/SMS
✅ **Geographic context** - Instantly know the location
✅ **Sequential tracking** - Clear ordering within each location
✅ **Shorter** - 14 characters vs 20+ characters
✅ **Professional** - Follows common reference ID patterns

## Testing

Run the test script:
```bash
node scripts/test-reference-id.js
```

This validates:
- Abbreviation logic
- Sample reference ID generation
- Format consistency

## Migration Notes

### Existing Records
- Old timestamp-based IDs in the database remain valid
- New records will use the readable format
- No data migration needed

### SMS Responses
- Agents will receive the new format in confirmation messages
- The shorter format is easier to read in SMS

### Dashboard Display
- Reference IDs are displayed in the UI
- New format is more user-friendly in tables and reports

## Future Enhancements

Potential improvements:
1. Add LGA/Ward name lookup for display tooltips
2. Implement reference ID search by location
3. Add analytics by reference ID prefix patterns
4. Create QR codes for reference IDs

## Testing Checklist

- [x] Test abbreviation logic
- [x] Generate sample reference IDs
- [ ] Submit test incident via SMS
- [ ] Submit test election result via SMS
- [ ] Verify IDs appear correctly in dashboard
- [ ] Check uniqueness constraints
- [ ] Test fallback to timestamp format

## Support

If you encounter issues with reference ID generation:
1. Check the logs for the generated reference ID
2. Verify LGA and Ward names are correct
3. Ensure database connection is working
4. System will automatically fall back to timestamp format if needed
