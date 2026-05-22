#!/bin/bash
# Ekoro Setup Script

echo "🚀 Setting up Ekoro local development environment..."

# 1. Install dependencies
echo "📦 Installing package dependencies..."
pnpm install

# 2. Copy env.example to env.local if not present
if [ ! -f .env.local ]; then
  echo "📄 Copying .env.example to .env.local..."
  cp .env.example .env.local
else
  echo "✅ .env.local already exists."
fi

# 3. Start local Supabase (Docker must be running)
echo "🐳 Starting local Supabase containers..."
pnpm supabase start

# 4. Sync Prisma Schema
echo "🗄️ Pushing Prisma models to local database..."
pnpm prisma db push

echo "🎉 Setup completed successfully! Run 'pnpm dev' to start the local Next.js dev server."
