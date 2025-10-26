#!/bin/bash
# Health Check Script
# Monitors SMS system health and alerts on issues
#
# Usage: ./scripts/run-health-check.sh
# Or add to crontab: */5 * * * * /path/to/run-health-check.sh

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
ALERT_EMAIL="${ALERT_EMAIL:-admin@election.com}"
LOG_FILE="${LOG_FILE:-/tmp/sms-health.log}"

echo "========================================" >> "$LOG_FILE"
echo "Health Check - $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Fetch health status
response=$(curl -s "$API_URL/api/sms/health")
status=$(echo "$response" | jq -r '.status')

# Log response
echo "Status: $status" >> "$LOG_FILE"
echo "$response" | jq '.' >> "$LOG_FILE"

# Check for issues
if [ "$status" != "healthy" ]; then
  echo "⚠️  ALERT: SMS System unhealthy - Status: $status" >> "$LOG_FILE"
  
  # Extract warnings and errors
  warnings=$(echo "$response" | jq -r '.warnings[]')
  errors=$(echo "$response" | jq -r '.errors[]')
  
  # Create alert message
  alert_msg="SMS System Alert - Status: $status\n\n"
  
  if [ -n "$warnings" ]; then
    alert_msg+="Warnings:\n$warnings\n\n"
  fi
  
  if [ -n "$errors" ]; then
    alert_msg+="Errors:\n$errors\n\n"
  fi
  
  # Get line status
  lines=$(echo "$response" | jq -r '.checks.goip_lines')
  alert_msg+="GoIP Lines:\n$lines\n\n"
  
  alert_msg+="Full report: $API_URL/api/sms/health\n"
  
  # Send alert (uncomment and configure your preferred method)
  # echo -e "$alert_msg" | mail -s "SMS System Alert" "$ALERT_EMAIL"
  # curl -X POST https://your-webhook-url -d "message=$alert_msg"
  
  echo -e "$alert_msg" >> "$LOG_FILE"
  echo "ALERT sent!" >> "$LOG_FILE"
else
  echo "✓ System healthy" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"

# Exit with error code if unhealthy
if [ "$status" == "critical" ]; then
  exit 2
elif [ "$status" == "warning" ]; then
  exit 1
else
  exit 0
fi
