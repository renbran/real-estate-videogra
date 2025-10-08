# 🔐 Admin Access Setup

## Default Admin Credentials

Your VideoPro booking system comes with a pre-configured admin account:

- **Email**: `admin@videopro.com` 
- **Password**: `password123`
- **Role**: Administrator (full access)

## Additional Demo Users

The system also includes these demo accounts for testing:

### Management Accounts
- **Manager**: `manager@videopro.com` / `password123`
- **Videographer**: `videographer@videopro.com` / `password123`
- **Executive**: `marketing@realty.com` / `password123`

### Real Estate Agent Accounts
- **Elite Tier**: `sarah.johnson@realty.com` / `password123` (8 bookings/month)
- **Premium Tier**: `mike.chen@realty.com` / `password123` (4 bookings/month)
- **Standard Tier**: `lisa.rodriguez@realty.com` / `password123` (2 bookings/month)

## Accessing the Admin Panel

1. **Open the application**: http://localhost:8080 (Docker) or http://localhost:5000 (dev server)
2. **Click "Sign In"** in the top navigation
3. **Enter admin credentials**:
   - Email: `admin@videopro.com`
   - Password: `password123`
4. **Access admin features** once logged in

## Security Recommendations

⚠️ **Important**: Change the default passwords in production!

### To Change Admin Password:
1. Log in as admin
2. Go to User Management
3. Edit the admin user
4. Set a strong, unique password

### Production Security Checklist:
- [ ] Change all default passwords
- [ ] Enable 2FA (if implemented)
- [ ] Use environment variables for secrets
- [ ] Set up proper SSL/TLS certificates
- [ ] Configure rate limiting
- [ ] Enable audit logging

## Google OAuth Integration (Optional)

If you want to enable Google OAuth login:

1. **Update OAuth Redirect URIs** in Google Cloud Console:
   - Add: `http://localhost:5000/auth/google/callback` (development)
   - Add: `http://localhost:8080/auth/google/callback` (Docker)
   - Add: `https://yourdomain.com/auth/google/callback` (production)

2. **Add Google OAuth to backend** (implementation required)

## Troubleshooting

### Cannot Login?
- Verify the backend server is running
- Check database connection
- Ensure seeds have been run: `npm run seed`

### Forgot Password?
- Use the "Forgot Password" feature
- Or reset manually in database as admin

### Need New Admin?
Run this SQL command:
```sql
INSERT INTO users (email, password_hash, name, role) 
VALUES ('newemail@company.com', '$2a$12$encrypted_password_hash', 'New Admin', 'admin');
```