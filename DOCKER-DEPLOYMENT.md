# 🐳 Docker Deployment Guide for VideoPro Booking System

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Node.js 18+ (for building the application)
- 8GB+ RAM recommended

### Option 1: Using Docker Compose (Recommended)
```bash
# Build and start the application
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Option 2: Using Deployment Script

#### Linux/macOS:
```bash
# Make script executable
chmod +x deploy-docker.sh

# Deploy with default settings (port 80)
./deploy-docker.sh

# Deploy on custom port
PORT=8080 ./deploy-docker.sh

# Deploy with development environment
ENV=development PORT=3000 ./deploy-docker.sh
```

#### Windows:
```cmd
# Run the batch script
deploy-docker.bat

# Or with custom port (set before running)
set PORT=8080
deploy-docker.bat
```

### Option 3: Manual Docker Commands
```bash
# Build the application
npm run build

# Build Docker image
docker build -t videography-booking-system:latest .

# Run container
docker run -d \
  --name videography-app \
  --restart unless-stopped \
  -p 80:80 \
  -e NODE_ENV=production \
  videography-booking-system:latest
```

## Configuration

### Environment Variables
- `NODE_ENV`: Set to `production` for optimized builds (default)
- `PORT`: External port to expose the application (default: 80)

### Docker Compose Services
- **videography-frontend**: Main application container
- Network: `videography-network` (isolated)
- Volumes: `videography-data` (persistent storage)

## Health Checks

### Application Health
```bash
# Check if container is healthy
curl http://localhost/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Container Status
```bash
# View running containers
docker ps

# View container logs
docker logs -f videography-app

# Monitor resource usage
docker stats videography-app
```

## Production Optimizations

### Nginx Configuration
- **Gzip Compression**: Reduces payload size by ~70%
- **Asset Caching**: 6-month cache for static files
- **Security Headers**: CSP, HSTS, X-Frame-Options
- **Service Worker**: Cached with 24-hour TTL

### Docker Optimizations
- **Multi-stage Build**: Separate build and runtime environments
- **Alpine Linux**: Minimal 5MB base image
- **Layer Caching**: Optimized layer order for build speed
- **Non-root User**: Security best practices

### Build Optimizations
- **Tree Shaking**: Removes unused code
- **Code Splitting**: Lazy loading for better performance
- **Asset Optimization**: Minified CSS/JS, optimized images
- **TypeScript**: Compiled with --noCheck for faster builds

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port 80
sudo lsof -i :80  # Linux/macOS
netstat -ano | findstr :80  # Windows

# Use different port
PORT=8080 ./deploy-docker.sh
```

#### 2. Build Failures
```bash
# Clear npm cache
npm cache clean --force

# Clear Docker cache
docker system prune -f

# Rebuild without cache
docker build --no-cache -t videography-booking-system:latest .
```

#### 3. Container Won't Start
```bash
# Check container logs
docker logs videography-app

# Check Docker daemon
docker info

# Restart Docker service
sudo systemctl restart docker  # Linux
# Restart Docker Desktop on Windows/macOS
```

#### 4. Performance Issues
```bash
# Check resource usage
docker stats

# Increase memory limits
docker run --memory=2g --cpus=2 ...

# Monitor nginx logs
docker exec videography-app tail -f /var/log/nginx/access.log
```

### Log Analysis
```bash
# Application logs
docker logs -f videography-app

# Nginx access logs
docker exec videography-app tail -f /var/log/nginx/access.log

# Nginx error logs
docker exec videography-app tail -f /var/log/nginx/error.log

# System resource monitoring
docker exec videography-app top
```

## Deployment Strategies

### Development
```bash
# Development with hot reload (not containerized)
npm run dev

# Development container with volume mounting
docker run -d \
  -p 3000:80 \
  -v $(pwd)/src:/app/src \
  -e NODE_ENV=development \
  videography-booking-system:latest
```

### Staging
```bash
# Staging environment
ENV=staging PORT=8080 ./deploy-docker.sh

# With resource limits
docker run -d \
  --name videography-staging \
  --memory=1g --cpus=1 \
  -p 8080:80 \
  videography-booking-system:latest
```

### Production
```bash
# Production with monitoring
docker run -d \
  --name videography-app \
  --restart unless-stopped \
  --memory=2g --cpus=2 \
  --log-driver=json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  -p 80:80 -p 443:443 \
  -e NODE_ENV=production \
  videography-booking-system:latest
```

## Security Considerations

### Container Security
- Non-root user execution
- Read-only root filesystem (where possible)
- Minimal attack surface with Alpine Linux
- Regular security updates

### Network Security
- Isolated Docker network
- Nginx security headers
- CSP (Content Security Policy)
- HTTPS redirect capability

### Data Security
- No sensitive data in container images
- Environment variable configuration
- Secure secret management recommended

## Monitoring & Maintenance

### Container Maintenance
```bash
# Update container
docker pull videography-booking-system:latest
docker stop videography-app
docker rm videography-app
./deploy-docker.sh

# Cleanup old images
docker image prune -f

# System cleanup
docker system prune -f
```

### Health Monitoring
- Built-in health check endpoint: `/health`
- Container health status via Docker
- Nginx status monitoring
- Resource usage tracking

## Support

### Useful Commands
```bash
# Container management
docker ps                           # List running containers
docker logs -f videography-app     # Follow logs
docker exec -it videography-app sh # Shell access
docker restart videography-app     # Restart container

# Image management
docker images                       # List images
docker rmi videography-booking-system:latest  # Remove image
docker build --no-cache -t videography-booking-system:latest .  # Force rebuild

# System management
docker system df                    # Disk usage
docker system prune -a              # Clean everything
docker-compose down --volumes       # Remove everything including volumes
```

### Getting Help
1. Check container logs: `docker logs videography-app`
2. Verify Docker installation: `docker --version`
3. Test health endpoint: `curl http://localhost/health`
4. Review nginx configuration: `docker exec videography-app cat /etc/nginx/nginx.conf`

---

**🎉 Your VideoPro booking system is now containerized and ready for production deployment!**