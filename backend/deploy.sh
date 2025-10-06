#!/bin/bash

# VideoPro Production Deployment Script
# Run this script on your production server

set -e  # Exit on any error

echo "🚀 VideoPro Production Deployment Starting..."

# Configuration
PROJECT_NAME="videography-booking"
BACKEND_DIR="/opt/videography-booking/backend"
FRONTEND_DIR="/opt/videography-booking/frontend"
LOG_FILE="/var/log/videography-deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}❌ ERROR: $1${NC}" | tee -a $LOG_FILE
    exit 1
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a $LOG_FILE
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
fi

# Verify prerequisites
log "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js 18+ first."
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [[ $NODE_VERSION -lt 18 ]]; then
    error "Node.js version 18+ required. Current version: $(node --version)"
fi
success "Node.js $(node --version) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    error "npm is not installed"
fi
success "npm $(npm --version) detected"

# Check PostgreSQL (optional - will use SQLite if not available)
if command -v psql &> /dev/null; then
    success "PostgreSQL detected"
    USE_POSTGRES=true
else
    warning "PostgreSQL not found. Will use SQLite for development"
    USE_POSTGRES=false
fi

# Check PM2
if ! command -v pm2 &> /dev/null; then
    log "Installing PM2 globally..."
    npm install -g pm2 || error "Failed to install PM2"
fi
success "PM2 process manager available"

# Create project directories
log "Setting up project directories..."
sudo mkdir -p $BACKEND_DIR $FRONTEND_DIR
sudo chown $USER:$USER $BACKEND_DIR $FRONTEND_DIR
success "Project directories created"

# Deploy Backend
log "Deploying backend..."
cd $BACKEND_DIR

# Copy backend files (assuming they're in current directory)
if [[ -f "package.json" ]]; then
    success "Backend files found in current directory"
else
    error "Backend files not found. Please run this script from the backend directory."
fi

# Install dependencies
log "Installing backend dependencies..."
npm ci --production || error "Failed to install backend dependencies"
success "Backend dependencies installed"

# Setup environment
if [[ ! -f ".env" ]]; then
    if [[ -f ".env.production.template" ]]; then
        cp .env.production.template .env
        warning "Copied .env template. Please update with production values!"
        echo "Edit .env file with your production settings:"
        echo "  - Database credentials"
        echo "  - JWT secret"
        echo "  - Email settings"
        echo "  - CORS origins"
    else
        error ".env file not found and no template available"
    fi
fi

# Database setup
if [[ $USE_POSTGRES == true ]]; then
    log "Setting up PostgreSQL database..."
    
    # Check if database exists
    if psql -lqt | cut -d \| -f 1 | grep -qw videography_booking_prod; then
        success "Database already exists"
    else
        warning "Please create the PostgreSQL database manually:"
        echo "  createdb videography_booking_prod"
        echo "  createuser videography_user"
        echo "  psql -c \"ALTER USER videography_user WITH PASSWORD 'your-password';\""
        echo "  psql -c \"GRANT ALL PRIVILEGES ON DATABASE videography_booking_prod TO videography_user;\""
    fi
    
    # Run migrations
    log "Running database migrations..."
    NODE_ENV=production node scripts/migrate.js || error "Database migration failed"
    success "Database migrations completed"
else
    log "Setting up SQLite database..."
    node scripts/migrate-sqlite.js || error "SQLite setup failed"
    success "SQLite database ready"
fi

# Start backend service
log "Starting backend service..."
pm2 delete $PROJECT_NAME-backend 2>/dev/null || true  # Remove if exists
pm2 start server.js --name "$PROJECT_NAME-backend" --env production || error "Failed to start backend"
pm2 save || warning "Failed to save PM2 configuration"
success "Backend service started"

# Deploy Frontend (if dist folder exists)
if [[ -d "../dist" ]]; then
    log "Deploying frontend..."
    cp -r ../dist/* $FRONTEND_DIR/
    success "Frontend deployed to $FRONTEND_DIR"
else
    warning "Frontend dist folder not found. Please build frontend first:"
    echo "  npm run build"
fi

# Setup Nginx (if available)
if command -v nginx &> /dev/null; then
    log "Setting up Nginx configuration..."
    
    NGINX_CONFIG="/etc/nginx/sites-available/$PROJECT_NAME"
    sudo tee $NGINX_CONFIG > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;  # UPDATE THIS
    
    # Frontend
    location / {
        root $FRONTEND_DIR;
        try_files \$uri \$uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    # Enable site
    sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx || warning "Nginx configuration issue"
    success "Nginx configured"
else
    warning "Nginx not found. Manual web server setup required."
fi

# Final health checks
log "Running health checks..."

# Wait for backend to start
sleep 5

# Check backend health
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    success "Backend health check passed"
else
    error "Backend health check failed"
fi

# Check if frontend is accessible (if nginx is configured)
if command -v nginx &> /dev/null; then
    if curl -f http://localhost/ > /dev/null 2>&1; then
        success "Frontend accessible via Nginx"
    else
        warning "Frontend not accessible. Check Nginx configuration."
    fi
fi

# Display final status
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 System Status:"
echo "  Backend: http://localhost:3001"
echo "  Frontend: $FRONTEND_DIR"
echo "  Database: $(if [[ $USE_POSTGRES == true ]]; then echo 'PostgreSQL'; else echo 'SQLite'; fi)"
echo "  Process Manager: PM2"
echo ""
echo "📋 Next Steps:"
echo "  1. Update .env with production values"
echo "  2. Configure domain name in Nginx"
echo "  3. Set up SSL certificate"
echo "  4. Test complete application workflow"
echo "  5. Set up monitoring and backups"
echo ""
echo "🔍 Monitoring Commands:"
echo "  pm2 status                    # Check process status"
echo "  pm2 logs $PROJECT_NAME-backend  # View backend logs"
echo "  curl http://localhost:3001/health  # Backend health check"
echo ""
echo "📞 Support: Check PRODUCTION_DEPLOYMENT.md for detailed instructions"

log "Deployment completed at $(date)"