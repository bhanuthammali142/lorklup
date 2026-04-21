#!/bin/bash
# HostelOS Backend Initialization Script
# This script sets up the database and seeds default data

set -e

echo "🚀 HostelOS Backend Setup"
echo "=========================="
echo ""

# Check if MySQL is available
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL client not found. Please install MySQL."
    exit 1
fi

# Ask for MySQL credentials
read -p "MySQL Host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "MySQL User (default: root): " DB_USER
DB_USER=${DB_USER:-root}

read -sp "MySQL Password: " DB_PASSWORD
echo ""

read -p "Database Name (default: hostel_management): " DB_NAME
DB_NAME=${DB_NAME:-hostel_management}

echo ""
echo "📝 Creating database and tables..."

# Create database and tables
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" < schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database and tables created successfully"
else
    echo "❌ Failed to create database"
    exit 1
fi

echo ""
echo "🌱 Seeding default superadmin..."

# Run seed script
npm run seed

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update .env with your database credentials"
    echo "2. Run: npm start"
    echo ""
    echo "Login credentials:"
    echo "  Email: admin@hostel.com"
    echo "  Password: Bhanu@2006"
else
    echo "❌ Seed failed"
    exit 1
fi
