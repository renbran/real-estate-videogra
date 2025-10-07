import { BookingRequest, User, SHOOT_COMPLEXITIES, PROPERTY_VALUES } from './types'
import { formatDate, formatTime } from './date-utils'

export interface NotificationPayload {
  type: 'booking_approved' | 'booking_declined' | 'booking_reminder' | 'optimization_suggestion' | 'batch_opportunity'
  booking: BookingRequest
  recipient: User
  additionalData?: any
}

export interface CalendarEvent {
  title: string
  start: Date
  end: Date
  location: string
  description: string
  attendees: string[]
}

/**
 * Generates iCal format string for calendar invitations
 */
export function generateICalEvent(event: CalendarEvent): string {
  const formatICalDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  
  const uid = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@videopro.com`
  const now = new Date()
  
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VideoPro//Real Estate Videography Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICalDate(now)}`,
    `DTSTART:${formatICalDate(event.start)}`,
    `DTEND:${formatICalDate(event.end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`,
    ...event.attendees.map(email => `ATTENDEE:MAILTO:${email}`),
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')
  
  return icalContent
}

/**
 * Creates calendar event from booking data
 */
export function createCalendarEventFromBooking(booking: BookingRequest): CalendarEvent {
  const startDate = new Date(booking.scheduled_date + 'T' + booking.scheduled_time)
  const endDate = new Date(startDate.getTime() + booking.estimated_duration * 60000)
  
  const agent = { name: 'Agent', email: 'agent@osus.com' } // Will be provided by calling component
  const complexity = SHOOT_COMPLEXITIES[booking.shoot_complexity]
  const propertyValue = PROPERTY_VALUES[booking.property_value]
  
  const title = `${complexity.label} - ${booking.property_address}`
  
  const description = [
    `Property: ${booking.property_address}`,
    `Value Range: ${propertyValue.label}`,
    `Complexity: ${complexity.description}`,
    `Agent: ${agent?.name || 'Unknown'} (${agent?.email || 'No email'})`,
    `Access: ${booking.property_access.replace('_', ' ').toUpperCase()}`,
    `Estimated Duration: ${booking.estimated_duration} minutes`,
    booking.special_requirements ? `Special Requirements: ${booking.special_requirements}` : '',
    '',
    `Booking ID: ${booking.id}`,
    `Priority Score: ${booking.priority_score}`,
  ].filter(Boolean).join('\\n')
  
  return {
    title,
    start: startDate,
    end: endDate,
    location: booking.property_address,
    description,
    attendees: [
      agent?.email || '',
      'videographer@videopro.com' // Default videographer email
    ].filter(Boolean)
  }
}

/**
 * Generates email templates for different notification types
 */
export function generateEmailTemplate(payload: NotificationPayload): {
  subject: string
  htmlBody: string
  textBody: string
} {
  const { type, booking, recipient } = payload
  const agent = { name: 'Agent', email: 'agent@osus.com' } // Will be provided by calling component
  const complexity = SHOOT_COMPLEXITIES[booking.shoot_complexity]
  const propertyValue = PROPERTY_VALUES[booking.property_value]
  
  switch (type) {
    case 'booking_approved':
      return {
        subject: `✅ Videography Booking Approved - ${booking.property_address}`,
        htmlBody: generateApprovedEmailHTML(booking, agent, complexity, propertyValue),
        textBody: generateApprovedEmailText(booking, agent, complexity, propertyValue)
      }
      
    case 'booking_declined':
      return {
        subject: `❌ Videography Booking Declined - ${booking.property_address}`,
        htmlBody: generateDeclinedEmailHTML(booking, agent, complexity, propertyValue),
        textBody: generateDeclinedEmailText(booking, agent, complexity, propertyValue)
      }
      
    case 'booking_reminder':
      const daysUntil = payload.additionalData?.daysUntil || 1
      return {
        subject: `📅 Videography Shoot Reminder - ${daysUntil} Day${daysUntil > 1 ? 's' : ''} to Go`,
        htmlBody: generateReminderEmailHTML(booking, agent, complexity, daysUntil),
        textBody: generateReminderEmailText(booking, agent, complexity, daysUntil)
      }
      
    case 'batch_opportunity':
      const nearbyBookings = payload.additionalData?.nearbyBookings || []
      return {
        subject: `🚀 Batching Opportunity - Save Travel Time`,
        htmlBody: generateBatchOpportunityEmailHTML(booking, agent, nearbyBookings),
        textBody: generateBatchOpportunityEmailText(booking, agent, nearbyBookings)
      }
      
    default:
      return {
        subject: 'VideoPro Notification',
        htmlBody: '<p>You have a new notification from VideoPro.</p>',
        textBody: 'You have a new notification from VideoPro.'
      }
  }
}

function generateApprovedEmailHTML(booking: BookingRequest, agent: any, complexity: any, propertyValue: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Inter, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .booking-details { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .label { font-weight: 600; color: #64748b; }
        .value { color: #1e293b; }
        .cta-button { 
          background: #3b82f6; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          display: inline-block; 
          margin: 20px 0; 
        }
        .footer { background: #f1f5f9; padding: 15px; text-align: center; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Booking Approved!</h1>
        <p>Your videography request has been confirmed</p>
      </div>
      
      <div class="content">
        <p>Great news, ${agent?.name || 'Agent'}!</p>
        
        <p>Your videography booking has been <strong>approved</strong> and scheduled. Please find the details below:</p>
        
        <div class="booking-details">
          <div class="detail-row">
            <span class="label">Property Address:</span>
            <span class="value">${booking.property_address}</span>
          </div>
          <div class="detail-row">
            <span class="label">Scheduled Date:</span>
            <span class="value">${formatDate(booking.scheduled_date || booking.preferred_date)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Scheduled Time:</span>
            <span class="value">${formatTime(booking.scheduled_time || '09:00')}</span>
          </div>
          <div class="detail-row">
            <span class="label">Estimated Duration:</span>
            <span class="value">${booking.estimated_duration} minutes</span>
          </div>
          <div class="detail-row">
            <span class="label">Shoot Type:</span>
            <span class="value">${complexity.label}</span>
          </div>
          <div class="detail-row">
            <span class="label">Property Value:</span>
            <span class="value">${propertyValue.label}</span>
          </div>
          <div class="detail-row">
            <span class="label">Access Requirements:</span>
            <span class="value">${booking.property_access.replace('_', ' ').toUpperCase()}</span>
          </div>
        </div>
        
        ${booking.special_requirements ? `
          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin: 15px 0;">
            <strong>Special Requirements:</strong><br>
            ${booking.special_requirements}
          </div>
        ` : ''}
        
        <p><strong>Next Steps:</strong></p>
        <ul>
          <li>📅 Calendar invitation attached - add to your calendar</li>
          <li>🏠 Ensure property access is arranged for the scheduled time</li>
          <li>📞 Contact our videographer if you need to make any changes</li>
          <li>⏰ Arrive 5-10 minutes early to coordinate with our team</li>
        </ul>
        
        <a href="#" class="cta-button">View Booking Details</a>
      </div>
      
      <div class="footer">
        <p>VideoPro - Professional Real Estate Videography</p>
        <p>Questions? Reply to this email or call (555) 123-4567</p>
      </div>
    </body>
    </html>
  `
}

function generateApprovedEmailText(booking: BookingRequest, agent: any, complexity: any, propertyValue: any): string {
  return `
🎉 BOOKING APPROVED!

Hi ${agent?.name || 'Agent'},

Great news! Your videography booking has been approved and scheduled.

BOOKING DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Property: ${booking.property_address}
Date: ${formatDate(booking.scheduled_date || booking.preferred_date)}
Time: ${formatTime(booking.scheduled_time || '09:00')}
Duration: ${booking.estimated_duration} minutes
Type: ${complexity.label}
Value: ${propertyValue.label}
Access: ${booking.property_access.replace('_', ' ').toUpperCase()}
${booking.special_requirements ? `\nSpecial Requirements: ${booking.special_requirements}` : ''}

NEXT STEPS:
✓ Add the calendar invitation to your schedule
✓ Ensure property access is arranged
✓ Contact us if changes are needed
✓ Arrive 5-10 minutes early

Questions? Reply to this email or call (555) 123-4567

Best regards,
The VideoPro Team
  `.trim()
}

function generateDeclinedEmailHTML(booking: BookingRequest, agent: any, complexity: any, propertyValue: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Inter, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .booking-details { background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca; }
        .alternatives { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bae6fd; }
        .cta-button { 
          background: #3b82f6; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          display: inline-block; 
          margin: 20px 0; 
        }
        .footer { background: #f1f5f9; padding: 15px; text-align: center; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📅 Booking Update Required</h1>
        <p>We need to reschedule your videography request</p>
      </div>
      
      <div class="content">
        <p>Hi ${agent?.name || 'Agent'},</p>
        
        <p>Unfortunately, we cannot accommodate your videography booking for the requested date due to capacity constraints.</p>
        
        <div class="booking-details">
          <h3>Original Request:</h3>
          <p><strong>Property:</strong> ${booking.property_address}</p>
          <p><strong>Requested Date:</strong> ${formatDate(booking.preferred_date)}</p>
          <p><strong>Complexity:</strong> ${complexity.label}</p>
        </div>
        
        <div class="alternatives">
          <h3>🎯 Available Alternatives:</h3>
          <ul>
            <li><strong>Priority Booking:</strong> Consider higher value properties for priority scheduling</li>
            <li><strong>Flexible Dates:</strong> Submit request with "flexible for optimization" enabled</li>
            <li><strong>Off-Peak Times:</strong> Tuesday-Thursday typically have better availability</li>
            <li><strong>Advance Notice:</strong> Book 7+ days ahead for best availability</li>
          </ul>
        </div>
        
        ${booking.manager_notes ? `
          <div style="background: #fffbeb; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin: 15px 0;">
            <strong>Manager Notes:</strong><br>
            ${booking.manager_notes}
          </div>
        ` : ''}
        
        <p><strong>What's Next?</strong></p>
        <ul>
          <li>📝 Submit a new booking request with alternative dates</li>
          <li>📞 Call us to discuss priority options</li>
          <li>⏰ Consider booking further in advance</li>
        </ul>
        
        <a href="#" class="cta-button">Submit New Request</a>
      </div>
      
      <div class="footer">
        <p>VideoPro - Professional Real Estate Videography</p>
        <p>Questions? Reply to this email or call (555) 123-4567</p>
      </div>
    </body>
    </html>
  `
}

function generateDeclinedEmailText(booking: BookingRequest, agent: any, complexity: any, propertyValue: any): string {
  return `
📅 BOOKING UPDATE REQUIRED

Hi ${agent?.name || 'Agent'},

Unfortunately, we cannot accommodate your videography booking for the requested date due to capacity constraints.

ORIGINAL REQUEST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Property: ${booking.property_address}
Requested: ${formatDate(booking.preferred_date)}
Type: ${complexity.label}

AVAILABLE ALTERNATIVES:
• Priority Booking: Higher value properties get priority
• Flexible Dates: Enable "flexible for optimization"
• Off-Peak Times: Tuesday-Thursday have better availability
• Advance Notice: Book 7+ days ahead

${booking.manager_notes ? `\nMANAGER NOTES: ${booking.manager_notes}` : ''}

Submit a new request with alternative dates or call (555) 123-4567 to discuss options.

Best regards,
The VideoPro Team
  `.trim()
}

function generateReminderEmailHTML(booking: BookingRequest, agent: any, complexity: any, daysUntil: number): string {
  const isToday = daysUntil === 0
  const reminderText = isToday ? 'TODAY' : `${daysUntil} day${daysUntil > 1 ? 's' : ''}`
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Inter, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .countdown { background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .checklist { background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #f1f5f9; padding: 15px; text-align: center; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⏰ Videography Shoot Reminder</h1>
        <p>Your scheduled shoot is coming up!</p>
      </div>
      
      <div class="content">
        <p>Hi ${agent?.name || 'Agent'},</p>
        
        <div class="countdown">
          <h2>${isToday ? '🚨 TODAY' : `📅 ${reminderText.toUpperCase()}`}</h2>
          <p>Your videography shoot is scheduled ${reminderText}</p>
        </div>
        
        <p><strong>Shoot Details:</strong></p>
        <ul>
          <li><strong>Property:</strong> ${booking.property_address}</li>
          <li><strong>Date:</strong> ${formatDate(booking.scheduled_date || booking.preferred_date)}</li>
          <li><strong>Time:</strong> ${formatTime(booking.scheduled_time || '09:00')}</li>
          <li><strong>Duration:</strong> ${booking.estimated_duration} minutes</li>
          <li><strong>Type:</strong> ${complexity.label}</li>
        </ul>
        
        <div class="checklist">
          <h3>✅ Final Checklist:</h3>
          <ul>
            <li>Property access is arranged and confirmed</li>
            <li>Any staging or prep work is completed</li>
            <li>Exterior and interior lights are working</li>
            <li>Property is clean and photo-ready</li>
            <li>Your contact info is up to date</li>
            ${booking.property_access.includes('occupied') ? '<li>Tenants/owners have been notified</li>' : ''}
          </ul>
        </div>
        
        ${booking.special_requirements ? `
          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin: 15px 0;">
            <strong>Special Requirements:</strong><br>
            ${booking.special_requirements}
          </div>
        ` : ''}
        
        <p><strong>Need to make changes?</strong> Please contact us at least ${isToday ? '2 hours' : '24 hours'} before the shoot.</p>
      </div>
      
      <div class="footer">
        <p>VideoPro - Professional Real Estate Videography</p>
        <p>Emergency contact: (555) 123-4567</p>
      </div>
    </body>
    </html>
  `
}

function generateReminderEmailText(booking: BookingRequest, agent: any, complexity: any, daysUntil: number): string {
  const isToday = daysUntil === 0
  const reminderText = isToday ? 'TODAY' : `${daysUntil} day${daysUntil > 1 ? 's' : ''}`
  
  return `
⏰ VIDEOGRAPHY SHOOT REMINDER

Hi ${agent?.name || 'Agent'},

${isToday ? '🚨 TODAY' : `📅 ${reminderText.toUpperCase()}`} - Your videography shoot is scheduled ${reminderText}!

SHOOT DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Property: ${booking.property_address}
Date: ${formatDate(booking.scheduled_date || booking.preferred_date)}
Time: ${formatTime(booking.scheduled_time || '09:00')}
Duration: ${booking.estimated_duration} minutes
Type: ${complexity.label}

FINAL CHECKLIST:
✓ Property access arranged and confirmed
✓ Staging/prep work completed
✓ Lights working (exterior & interior)
✓ Property clean and photo-ready
✓ Contact info up to date
${booking.property_access.includes('occupied') ? '✓ Tenants/owners notified\n' : ''}
${booking.special_requirements ? `\nSPECIAL REQUIREMENTS: ${booking.special_requirements}` : ''}

Need changes? Contact us at least ${isToday ? '2 hours' : '24 hours'} before the shoot.

Emergency contact: (555) 123-4567
  `.trim()
}

function generateBatchOpportunityEmailHTML(booking: BookingRequest, agent: any, nearbyBookings: BookingRequest[]): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Inter, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .opportunity { background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #a7f3d0; }
        .nearby-bookings { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .cta-button { 
          background: #10b981; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          display: inline-block; 
          margin: 20px 0; 
        }
        .footer { background: #f1f5f9; padding: 15px; text-align: center; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚀 Batching Opportunity</h1>
        <p>Save time and get faster service!</p>
      </div>
      
      <div class="content">
        <p>Hi ${agent?.name || 'Agent'},</p>
        
        <p>Great news! We have other videography shoots scheduled near your property. Consider batching your request for:</p>
        
        <div class="opportunity">
          <h3>⚡ Benefits of Batching:</h3>
          <ul>
            <li><strong>Faster Service:</strong> Priority scheduling on batch days</li>
            <li><strong>Better Quality:</strong> Our videographer is already in the area</li>
            <li><strong>Consistency:</strong> Same crew, same day, consistent results</li>
            <li><strong>Flexibility:</strong> Easier to accommodate special requests</li>
          </ul>
        </div>

        <div class="nearby-bookings">
          <h3>📍 Nearby Scheduled Shoots:</h3>
          ${nearbyBookings.map(nb => `
            <div style="margin: 10px 0; padding: 8px; background: white; border-radius: 4px;">
              <strong>${nb.property_address}</strong><br>
              <small>Agent: Unknown | 
              ${formatDate(nb.scheduled_date || nb.preferred_date)}</small>
            </div>
          `).join('')}
        </div>
        
        <p><strong>Your Current Request:</strong></p>
        <ul>
          <li><strong>Property:</strong> ${booking.property_address}</li>
          <li><strong>Requested Date:</strong> ${formatDate(booking.preferred_date)}</li>
          <li><strong>Type:</strong> ${SHOOT_COMPLEXITIES[booking.shoot_complexity].label}</li>
        </ul>
        
        <p><strong>Recommended Action:</strong> Consider scheduling your shoot on the same day as nearby properties for optimal service.</p>
        
        <a href="#" class="cta-button">Accept Batch Scheduling</a>
      </div>
      
      <div class="footer">
        <p>VideoPro - Professional Real Estate Videography</p>
        <p>Questions? Reply to this email or call (555) 123-4567</p>
      </div>
    </body>
    </html>
  `
}

function generateBatchOpportunityEmailText(booking: BookingRequest, agent: any, nearbyBookings: BookingRequest[]): string {
  return `
🚀 BATCHING OPPORTUNITY!

Hi ${agent?.name || 'Agent'},

Great news! We have other videography shoots near your property.

BENEFITS OF BATCHING:
⚡ Faster service - priority scheduling
🎯 Better quality - crew already in area  
🔄 Consistency - same crew, same day
✨ Flexibility - easier special requests

YOUR REQUEST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Property: ${booking.property_address}
Requested: ${formatDate(booking.preferred_date)}
Type: ${SHOOT_COMPLEXITIES[booking.shoot_complexity].label}

NEARBY SCHEDULED SHOOTS:
${nearbyBookings.map(nb => 
  `• ${nb.property_address} (Unknown Agent) - ${formatDate(nb.scheduled_date || nb.preferred_date)}`
).join('\n')}

Consider scheduling on the same day for optimal service!

Reply to accept batch scheduling or call (555) 123-4567.

Best regards,
The VideoPro Team
  `.trim()
}

/**
 * Mock email sending function (in production, integrate with actual email service)
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string,
  attachments?: { filename: string; content: string; type: string }[]
): Promise<boolean> {
  // Mock implementation - replace with actual email service
  console.log('📧 Email Notification Sent:')
  console.log(`To: ${to}`)
  console.log(`Subject: ${subject}`)
  console.log(`HTML Body Length: ${htmlBody.length} chars`)
  console.log(`Text Body Length: ${textBody.length} chars`)
  if (attachments?.length) {
    console.log(`Attachments: ${attachments.map(a => a.filename).join(', ')}`)
  }
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return true
}

/**
 * Main notification orchestrator
 */
export async function sendBookingNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const { booking, recipient } = payload
    const agent = { name: 'Agent', email: 'agent@osus.com' } // Will be provided by calling component
    
    // Generate email content
    const emailTemplate = generateEmailTemplate(payload)
    
    // For approved bookings, attach calendar invitation
    let attachments: { filename: string; content: string; type: string }[] = []
    
    if (payload.type === 'booking_approved' && booking.scheduled_date && booking.scheduled_time) {
      const calendarEvent = createCalendarEventFromBooking(booking)
      const icalContent = generateICalEvent(calendarEvent)
      
      attachments.push({
        filename: `videography-booking-${booking.id}.ics`,
        content: icalContent,
        type: 'text/calendar'
      })
    }
    
    // Send email to agent
    const emailSent = await sendEmail(
      agent?.email || recipient.email,
      emailTemplate.subject,
      emailTemplate.htmlBody,
      emailTemplate.textBody,
      attachments
    )
    
    // For approved bookings, also send calendar invite to videographer
    if (payload.type === 'booking_approved' && booking.videographer_id) {
      await sendEmail(
        'videographer@videopro.com', // In production, look up actual videographer email
        `📹 New Shoot Assignment - ${booking.property_address}`,
        `<p>You have been assigned a new videography shoot:</p>${emailTemplate.htmlBody}`,
        `New shoot assignment:\n${emailTemplate.textBody}`,
        attachments
      )
    }
    
    return emailSent
  } catch (error) {
    console.error('Failed to send booking notification:', error)
    return false
  }
}

/**
 * Schedule reminder notifications
 */
export function scheduleReminderNotifications(booking: BookingRequest): void {
  const shootDate = new Date(booking.scheduled_date || booking.preferred_date)
  const now = new Date()
  
  // Calculate reminder dates
  const reminderDates = [
    { days: 7, date: new Date(shootDate.getTime() - 7 * 24 * 60 * 60 * 1000) },
    { days: 2, date: new Date(shootDate.getTime() - 2 * 24 * 60 * 60 * 1000) },
    { days: 1, date: new Date(shootDate.getTime() - 1 * 24 * 60 * 60 * 1000) }
  ]
  
  reminderDates.forEach(({ days, date }) => {
    if (date > now) {
      // In production, use a proper job scheduler like cron or a queue system
      console.log(`📅 Reminder scheduled: ${days} days before shoot (${date.toISOString()})`)
      // setTimeout(() => {
      //   sendBookingNotification({
      //     type: 'booking_reminder',
      //     booking,
      //     recipient: { name: 'Agent', email: 'agent@osus.com' } as User,
      //     additionalData: { daysUntil: days }
      //   })
      // }, date.getTime() - now.getTime())
    }
  })
}