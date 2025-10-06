# VideoPro - Real Estate Videography Booking Platform

VideoPro streamlines the booking and scheduling process for real estate agents to request professional videography services for their property listings and business needs.

**Experience Qualities**: 
1. Efficient - Simple and fast booking process with clear priority feedback
2. Professional - Clean, business-focused interface that builds trust and confidence
3. Transparent - Clear visibility into booking status, priority scoring, and scheduling logic

**Complexity Level**: Complex Application (advanced functionality, accounts)
- Multiple user roles with distinct dashboards and permissions
- Advanced scheduling optimization with route planning
- Priority scoring system with first-come-first-serve implementation for property shoots
- Real-time notifications and booking management

## Essential Features

### Property Shoot Booking with Enhanced Requirements
- **Functionality**: Agents can request videography for property listings with detailed property information
- **Purpose**: Ensures videographers have all necessary information and implements fair scheduling
- **Trigger**: Agent selects "Property Shoot" category and fills required fields
- **Progression**: Category selection → Property details (type, value, bedrooms) → Address → Scheduling → Priority calculation → Submission confirmation
- **Success criteria**: All required fields completed, first-come-first-serve priority assigned based on creation timestamp

### First-Come-First-Serve Priority System
- **Functionality**: Property shoots are prioritized based on booking creation time combined with other factors
- **Purpose**: Ensures fair treatment of booking requests while maintaining business priorities
- **Trigger**: Property booking submission with timestamp recording
- **Progression**: Booking created → Timestamp recorded → Priority score calculated with time-based bonus → Queue position determined
- **Success criteria**: Earlier bookings receive higher priority scores, clear indication to users of scheduling method

### Multi-Role Dashboard System
- **Functionality**: Role-based access with Agent, Manager, Videographer, and Admin views
- **Purpose**: Each user type has appropriate tools and information for their responsibilities
- **Trigger**: User login with role determination
- **Progression**: Login → Role identification → Dashboard routing → Role-specific features displayed
- **Success criteria**: Users can only access appropriate features, efficient workflow for each role

### Intelligent Priority Scoring
- **Functionality**: Automated scoring system considering property value, agent tier, usage history, and booking timing
- **Purpose**: Fair and transparent allocation of videography resources
- **Trigger**: Booking form completion with all required information
- **Progression**: Data collection → Score calculation → Approval determination → User notification
- **Success criteria**: Consistent scoring, clear explanation of score factors, appropriate approval routing

## Edge Case Handling
- **Invalid Property Data**: Form validation prevents submission with missing required fields
- **Scheduling Conflicts**: Priority system automatically handles conflicting requests based on scores
- **Address Validation**: Google Maps integration validates and standardizes location data
- **Role Permissions**: Access control prevents unauthorized actions across user types
- **Network Issues**: Loading states and error handling for API calls and data persistence

## Design Direction
The design should feel professional and efficient, conveying trust and reliability expected in real estate business tools, with clean lines and clear information hierarchy that prioritizes task completion over visual flourish.

## Color Selection
Complementary (opposite colors) - Professional blue paired with warm accent orange to create trust and energy while maintaining business credibility.

- **Primary Color**: Deep Professional Blue (oklch(0.4 0.15 240)) - Conveys trust, reliability, and business professionalism
- **Secondary Colors**: Light Blue Gray (oklch(0.95 0.02 240)) for backgrounds and Charcoal (oklch(0.25 0.02 240)) for text
- **Accent Color**: Warm Orange (oklch(0.65 0.15 45)) - Creates energy and draws attention to important actions and status indicators
- **Foreground/Background Pairings**: 
  - Background Light (oklch(0.98 0.01 240)): Dark Text (oklch(0.2 0.02 240)) - Ratio 14.8:1 ✓
  - Primary Blue (oklch(0.4 0.15 240)): White text (oklch(1 0 0)) - Ratio 8.2:1 ✓
  - Accent Orange (oklch(0.65 0.15 45)): White text (oklch(1 0 0)) - Ratio 4.9:1 ✓

## Font Selection
Professional and highly legible typefaces that work well in data-heavy interfaces while maintaining modern appeal - Inter for its excellent screen readability and business-appropriate character.

- **Typographic Hierarchy**: 
  - H1 (Dashboard Titles): Inter Bold/28px/tight letter spacing
  - H2 (Section Headers): Inter Semibold/20px/normal letter spacing  
  - H3 (Subsection Headers): Inter Medium/16px/normal letter spacing
  - Body Text: Inter Regular/14px/relaxed line height (1.5)
  - Small Text (Labels, Captions): Inter Medium/12px/normal letter spacing

## Animations
Subtle and purposeful animations enhance usability without distraction, focusing on state transitions and providing feedback for user actions in a business-professional context.

- **Purposeful Meaning**: Motion reinforces the efficiency and reliability of the platform while guiding attention to important status changes
- **Hierarchy of Movement**: Priority given to booking status changes, form validation feedback, and navigation between different dashboard sections

## Component Selection
- **Components**: Dialog for booking forms, Card for booking displays, Table for data management, Badge for status indicators, Select and Input components for form controls with Tailwind focus states
- **Customizations**: Custom property type selector, first-come-first-serve indicators, priority score visualizations, role-based navigation components
- **States**: Clear visual distinction for booking statuses (pending/approved/declined), form validation states, loading states for API operations
- **Icon Selection**: Phosphor icons for consistent business-focused iconography - Calendar for scheduling, MapPin for locations, TrendUp for priority
- **Spacing**: Consistent 1rem (16px) base spacing with 0.5rem for tight spacing and 2rem for section separation
- **Mobile**: Responsive grid layout that stacks property details vertically, collapsible navigation for smaller screens, touch-friendly form controls with minimum 44px touch targets