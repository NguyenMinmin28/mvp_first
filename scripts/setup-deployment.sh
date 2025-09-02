#!/bin/bash

# Deployment Setup Script
# Usage: ./scripts/setup-deployment.sh [platform]

set -e

PLATFORM=${1:-"vercel"}
DOMAIN=${2:-"yourdomain.com"}
CRON_SECRET=${3:-$(openssl rand -hex 32)}

echo "🚀 Setting up deployment for: $PLATFORM"
echo "🌐 Domain: $DOMAIN"
echo "🔑 Generated CRON_SECRET: $CRON_SECRET"

case $PLATFORM in
  "vercel")
    echo "📝 Creating vercel.json..."
    cat > vercel.json << EOF
{
  "crons": [
    {
      "path": "/api/cron/reconcile-subscriptions",
      "schedule": "0 0 * * *"
    }
  ]
}
EOF
    echo "✅ Created vercel.json"
    echo ""
    echo "📋 Next steps:"
    echo "1. Deploy to Vercel: vercel --prod"
    echo "2. Set environment variables in Vercel Dashboard:"
    echo "   - CRON_SECRET=$CRON_SECRET"
    echo "   - DATABASE_URL=your-mongodb-url"
    echo "   - PAYPAL_CLIENT_ID=your-paypal-client-id"
    echo "   - PAYPAL_CLIENT_SECRET=your-paypal-secret"
    echo "   - NEXTAUTH_SECRET=your-nextauth-secret"
    echo "   - NEXTAUTH_URL=https://$DOMAIN"
    ;;
    
  "railway")
    echo "📝 Creating railway.json..."
    cat > railway.json << EOF
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/cron/reconcile-subscriptions",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE"
  }
}
EOF
    echo "✅ Created railway.json"
    echo ""
    echo "📋 Next steps:"
    echo "1. Deploy to Railway: railway up"
    echo "2. Set environment variables in Railway Dashboard:"
    echo "   - CRON_SECRET=$CRON_SECRET"
    echo "   - DATABASE_URL=your-mongodb-url"
    echo "3. Setup external cron service (cron-job.org):"
    echo "   URL: https://$DOMAIN/api/cron/reconcile-subscriptions"
    echo "   Method: POST"
    echo "   Headers: Authorization: Bearer $CRON_SECRET"
    echo "   Schedule: */5 * * * *"
    ;;
    
  "render")
    echo "📝 Creating render.yaml..."
    cat > render.yaml << EOF
services:
  - type: web
    name: developer-connect
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: CRON_SECRET
        value: $CRON_SECRET
      - key: DATABASE_URL
        value: your-mongodb-url
      - key: PAYPAL_CLIENT_ID
        value: your-paypal-client-id
      - key: PAYPAL_CLIENT_SECRET
        value: your-paypal-secret
EOF
    echo "✅ Created render.yaml"
    echo ""
    echo "📋 Next steps:"
    echo "1. Deploy to Render"
    echo "2. Setup external cron service (cron-job.org):"
    echo "   URL: https://$DOMAIN/api/cron/reconcile-subscriptions"
    echo "   Method: POST"
    echo "   Headers: Authorization: Bearer $CRON_SECRET"
    echo "   Schedule: */5 * * * *"
    ;;
    
  "docker")
    echo "📝 Creating docker-compose.yml..."
    cat > docker-compose.yml << EOF
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - CRON_SECRET=$CRON_SECRET
      - DATABASE_URL=your-mongodb-url
      - PAYPAL_CLIENT_ID=your-paypal-client-id
      - PAYPAL_CLIENT_SECRET=your-paypal-secret
    restart: unless-stopped

  cron:
    image: curlimages/curl:latest
    command: >
      sh -c "
      while true; do
        curl -X POST 'http://app:3000/api/cron/reconcile-subscriptions' \\
          -H 'Authorization: Bearer $CRON_SECRET';
        sleep 300;
      done
      "
    depends_on:
      - app
    restart: unless-stopped
EOF
    echo "✅ Created docker-compose.yml"
    echo ""
    echo "📋 Next steps:"
    echo "1. Build and run: docker-compose up -d"
    echo "2. Or deploy to cloud with Docker support"
    ;;
    
  "external-cron")
    echo "📝 Creating external cron configuration..."
    cat > external-cron-config.txt << EOF
External Cron Service Configuration
==================================

Platform: $PLATFORM
Domain: $DOMAIN
CRON_SECRET: $CRON_SECRET

Cron-job.org Setup:
1. Go to https://cron-job.org
2. Create account and add new cron job
3. Configure:
   URL: https://$DOMAIN/api/cron/reconcile-subscriptions
   Method: POST
   Headers: Authorization: Bearer $CRON_SECRET
   Schedule: Every 5 minutes

EasyCron Setup:
1. Go to https://www.easycron.com
2. Create account and add new cron job
3. Configure:
   URL: https://$DOMAIN/api/cron/reconcile-subscriptions
   Method: POST
   Headers: Authorization: Bearer $CRON_SECRET
   Schedule: */5 * * * *

GitHub Actions Setup:
Create .github/workflows/cron.yml:
name: Reconciliation Cron
on:
  schedule:
    - cron: '*/5 * * * *'
jobs:
  reconcile:
    runs-on: ubuntu-latest
    steps:
    - name: Call Reconciliation API
      run: |
        curl -X POST 'https://$DOMAIN/api/cron/reconcile-subscriptions' \\
          -H 'Authorization: Bearer \${{ secrets.CRON_SECRET }}'
EOF
    echo "✅ Created external-cron-config.txt"
    echo ""
    echo "📋 Next steps:"
    echo "1. Choose your preferred external cron service"
    echo "2. Follow the configuration in external-cron-config.txt"
    echo "3. Set CRON_SECRET=$CRON_SECRET in your environment"
    ;;
    
  *)
    echo "❌ Unknown platform: $PLATFORM"
    echo "Available platforms: vercel, railway, render, docker, external-cron"
    exit 1
    ;;
esac

echo ""
echo "🔧 Environment Variables to set:"
echo "CRON_SECRET=$CRON_SECRET"
echo "DATABASE_URL=your-mongodb-url"
echo "PAYPAL_CLIENT_ID=your-paypal-client-id"
echo "PAYPAL_CLIENT_SECRET=your-paypal-secret"
echo "NEXTAUTH_SECRET=your-nextauth-secret"
echo "NEXTAUTH_URL=https://$DOMAIN"
echo ""
echo "🧪 Test endpoint after deployment:"
echo "curl -X POST 'https://$DOMAIN/api/cron/reconcile-subscriptions' \\"
echo "  -H 'Authorization: Bearer $CRON_SECRET'"
echo ""
echo "✅ Setup completed for $PLATFORM!"
