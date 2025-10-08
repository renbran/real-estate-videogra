#!/bin/bash

# Docker deployment script for VideoPro Real Estate Booking System
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="videography-booking-system"
CONTAINER_NAME="videography-app"
PORT="${PORT:-80}"
ENV="${ENV:-production}"

echo -e "${BLUE}🐳 VideoPro Docker Deployment Script${NC}"
echo "=================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_status "Docker is running"

# Build the application
print_info "Building the application..."
if npm run build; then
    print_status "Application built successfully"
else
    print_error "Application build failed"
    exit 1
fi

# Stop and remove existing container
if docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_info "Stopping existing container..."
    docker stop $CONTAINER_NAME || true
    docker rm $CONTAINER_NAME || true
    print_status "Existing container removed"
fi

# Remove existing image (optional - for fresh build)
if [[ "$1" == "--fresh" ]]; then
    print_info "Removing existing image for fresh build..."
    docker rmi $IMAGE_NAME:latest || true
fi

# Build Docker image
print_info "Building Docker image..."
if docker build -t $IMAGE_NAME:latest .; then
    print_status "Docker image built successfully"
else
    print_error "Docker image build failed"
    exit 1
fi

# Run the container
print_info "Starting container on port $PORT..."
docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    -p $PORT:80 \
    -e NODE_ENV=$ENV \
    $IMAGE_NAME:latest

if [ $? -eq 0 ]; then
    print_status "Container started successfully"
    print_info "Application is now running at: http://localhost:$PORT"
    print_info "Health check: http://localhost:$PORT/health"
else
    print_error "Failed to start container"
    exit 1
fi

# Show container status
print_info "Container status:"
docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Show logs (last 20 lines)
print_info "Recent container logs:"
docker logs --tail 20 $CONTAINER_NAME

echo ""
print_status "Deployment completed successfully! 🎉"
print_info "Useful commands:"
echo "  View logs:    docker logs -f $CONTAINER_NAME"
echo "  Stop app:     docker stop $CONTAINER_NAME"
echo "  Restart app:  docker restart $CONTAINER_NAME"
echo "  Remove app:   docker stop $CONTAINER_NAME && docker rm $CONTAINER_NAME"