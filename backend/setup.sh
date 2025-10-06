#!/bin/bash

# VideoPro Backend Setup Script
# This script sets up the production environment for the VideoPro backend

set -e

echo "🚀 Setting up VideoPro Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not found. Please ensure PostgreSQL is installed and accessible."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "✅ Created .env file. Please update it with your configuration."
else
    echo "✅ .env file already exists."
fi

# Check if database connection works
echo "🗄️  Testing database connection..."
if npm run test-db 2>/dev/null; then
    echo "✅ Database connection successful."
    
    # Run migrations
    echo "🏗️  Running database migrations..."
    npm run migrate
    
    # Seed initial data
    echo "🌱 Seeding initial data..."
    npm run seed
    
    echo "✅ Database setup complete!"
else
    echo "⚠️  Database connection failed. Please check your .env configuration."
    echo "Make sure PostgreSQL is running and the database exists."
fi

# Create logs directory
mkdir -p logs

# Set up PM2 ecosystem file for production
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'videopro-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    max_memory_restart: '1G',
    restart_delay: 1000
  }]
};
EOF

echo "✅ PM2 ecosystem file created."

# Create systemd service file (for Linux production)
if [ -d "/etc/systemd/system" ]; then
    cat > videopro-backend.service << EOF
[Unit]
Description=VideoPro Backend API
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
    echo "✅ Systemd service file created (videopro-backend.service)."
    echo "   To install: sudo cp videopro-backend.service /etc/systemd/system/"
    echo "   To enable: sudo systemctl enable videopro-backend"
    echo "   To start: sudo systemctl start videopro-backend"
fi

# Create docker files for containerized deployment
cat > Dockerfile << EOF
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /usr/src/app
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
CMD ["node", "server.js"]
EOF

cat > .dockerignore << EOF
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
Dockerfile
.dockerignore
logs
*.log
EOF

cat > docker-compose.yml << EOF
version: '3.8'

services:
  videopro-backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - postgres
    restart: unless-stopped
    volumes:
      - ./logs:/usr/src/app/logs

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: videography_booking
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped

volumes:
  postgres_data:
EOF

echo "✅ Docker files created."

# Create backup script
cat > scripts/backup.sh << 'EOF'
#!/bin/bash

# Database backup script
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME=${DB_NAME:-videography_booking}
DB_USER=${DB_USER:-postgres}

mkdir -p $BACKUP_DIR

echo "Creating database backup..."
pg_dump -U $DB_USER -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

echo "Backup created: $BACKUP_DIR/backup_$DATE.sql"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x scripts/backup.sh
echo "✅ Backup script created."

# Create health check script
cat > healthcheck.js << 'EOF'
const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3001,
  path: '/health',
  timeout: 2000
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', () => {
  process.exit(1);
});

request.on('timeout', () => {
  request.destroy();
  process.exit(1);
});

request.end();
EOF

echo "✅ Health check script created."

# Add test-db script to package.json
npm pkg set scripts.test-db="node -e \"require('./config/database').query('SELECT NOW()').then(() => console.log('✅ Database connected')).catch(e => { console.error('❌ Database error:', e.message); process.exit(1); })\""

echo ""
echo "🎉 VideoPro Backend setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with your database and email configuration"
echo "2. Start the development server: npm run dev"
echo "3. Test the API: curl http://localhost:3001/health"
echo ""
echo "For production deployment:"
echo "- With PM2: pm2 start ecosystem.config.js --env production"
echo "- With Docker: docker-compose up -d"
echo "- With systemd: See the instructions above"
echo ""
echo "📚 Check README.md for API documentation and usage examples."