#!/usr/bin/env bash
set -e

echo "🔨 Building Job Tracker..."
cd /root/job-tracker

npm install
npx prisma generate
npx prisma db push

npm run build

# Copy static assets for standalone mode
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public 2>/dev/null || true

echo "🔄 Restarting service..."
systemctl restart job-tracker

echo "✅ Deployed! Running on port 3001"
systemctl status job-tracker --no-pager | grep "Active:"
