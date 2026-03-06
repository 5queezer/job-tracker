#!/bin/bash
set -e
cd /root/job-tracker
npm run build
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public 2>/dev/null || true
systemctl restart job-tracker
echo "✅ Deployed"
