const express = require('express');
const cors = require('cors');
const path = require('path');

console.log('🚀 Starting VideoPro Backend (Simple Mode)...');

const app = express();
const PORT = 3001;

// Basic middleware
app.use(cors({
  origin: 'http://localhost:5000',
  credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    mode: 'simple'
  });
});

// Simple demo data
const demoUsers = [
  { id: '1', email: 'sarah@realestate.com', name: 'Sarah Johnson', role: 'agent', tier: 'elite' },
  { id: '2', email: 'alex@realestate.com', name: 'Alex Manager', role: 'manager', tier: 'premium' },
  { id: '3', email: 'chris@realestate.com', name: 'Chris Videographer', role: 'videographer', tier: 'standard' }
];

const demoBookings = [
  {
    id: 'VB-20251006-ABC123',
    booking_number: 'VB-20251006-ABC123',
    agent_id: '1',
    shoot_category: 'property',
    location: '123 Main Street, Downtown, CA 90210',
    preferred_date: '2025-10-08',
    backup_dates: ['2025-10-09', '2025-10-10'],
    status: 'pending',
    priority_score: 85,
    property_value: '1m_2m',
    property_type: 'single_family',
    bedrooms: 3,
    shoot_complexity: 'standard',
    property_status: 'vacant',
    special_requirements: 'Drone shots required',
    is_flexible: false,
    created_at: '2025-10-06T10:00:00Z',
    updated_at: '2025-10-06T10:00:00Z'
  },
  {
    id: 'VB-20251006-DEF456',
    booking_number: 'VB-20251006-DEF456',
    agent_id: '1',
    shoot_category: 'property',
    location: '456 Oak Avenue, Westside, CA 90211',
    preferred_date: '2025-10-07',
    backup_dates: ['2025-10-08'],
    status: 'approved',
    priority_score: 95,
    property_value: 'over_2m',
    property_type: 'luxury',
    bedrooms: 5,
    shoot_complexity: 'complex',
    property_status: 'vacant',
    special_requirements: 'Luxury staging photography',
    is_flexible: true,
    created_at: '2025-10-06T09:00:00Z',
    updated_at: '2025-10-06T11:00:00Z'
  }
];

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  const user = demoUsers.find(u => u.email === email);
  
  if (user) {
    res.json({ user, token: 'demo-token-' + user.id });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Users endpoints
app.get('/api/users', (req, res) => {
  res.json({ users: demoUsers });
});

app.get('/api/users/:id', (req, res) => {
  const user = demoUsers.find(u => u.id === req.params.id);
  if (user) {
    res.json({ user });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Bookings endpoints
app.get('/api/bookings', (req, res) => {
  let filteredBookings = [...demoBookings];
  
  if (req.query.status) {
    filteredBookings = filteredBookings.filter(b => b.status === req.query.status);
  }
  
  if (req.query.agent_id) {
    filteredBookings = filteredBookings.filter(b => b.agent_id === req.query.agent_id);
  }
  
  res.json({ bookings: filteredBookings });
});

app.post('/api/bookings', (req, res) => {
  const booking = {
    id: 'VB-' + Date.now(),
    booking_number: 'VB-' + Date.now(),
    ...req.body,
    status: 'pending',
    priority_score: Math.floor(Math.random() * 100),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  demoBookings.push(booking);
  res.json({ booking });
});

app.put('/api/bookings/:id', (req, res) => {
  const bookingIndex = demoBookings.findIndex(b => b.id === req.params.id);
  
  if (bookingIndex !== -1) {
    demoBookings[bookingIndex] = {
      ...demoBookings[bookingIndex],
      ...req.body,
      updated_at: new Date().toISOString()
    };
    res.json({ booking: demoBookings[bookingIndex] });
  } else {
    res.status(404).json({ error: 'Booking not found' });
  }
});

// Notifications endpoints
app.get('/api/notifications', (req, res) => {
  res.json({ notifications: [] });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ VideoPro Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 Simple mode - Using demo data`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server gracefully...');
  process.exit(0);
});