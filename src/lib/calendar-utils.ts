import { BookingRequest, SHOOT_COMPLEXITIES, PROPERTY_VALUES } from './types'
import { generateICalEvent, createCalendarEventFromBooking } from './notification-service'

/**
 * Downloads a calendar file for a booking
 */
export function downloadCalendarFile(booking: BookingRequest): void {
  try {
    const calendarEvent = createCalendarEventFromBooking(booking)
    const icalContent = generateICalEvent(calendarEvent)
    
    // Create blob and download
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.href = url
    link.download = `videography-booking-${booking.id}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download calendar file:', error)
  }
}

/**
 * Downloads a calendar file with multiple bookings
 */
export function downloadMultipleBookingsCalendar(bookings: BookingRequest[], filename = 'videography-schedule.ics'): void {
  try {
    const icalEvents = bookings
      .filter(b => b.status === 'approved' && b.scheduled_date && b.scheduled_time)
      .map(booking => {
        const calendarEvent = createCalendarEventFromBooking(booking)
        return generateICalEvent(calendarEvent)
          .split('\n')
          .filter(line => !line.startsWith('BEGIN:VCALENDAR') && !line.startsWith('END:VCALENDAR') && !line.startsWith('VERSION:') && !line.startsWith('PRODID:') && !line.startsWith('CALSCALE:') && !line.startsWith('METHOD:'))
          .join('\n')
      })
    
    const fullCalendar = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//VideoPro//Real Estate Videography Schedule//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...icalEvents,
      'END:VCALENDAR'
    ].join('\r\n')
    
    const blob = new Blob([fullCalendar], { type: 'text/calendar;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download calendar file:', error)
  }
}

/**
 * Generates a Google Calendar link for a booking
 */
export function generateGoogleCalendarLink(booking: BookingRequest): string {
  const calendarEvent = createCalendarEventFromBooking(booking)
  
  const formatGoogleCalendarDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  
  const startDate = formatGoogleCalendarDate(calendarEvent.start)
  const endDate = formatGoogleCalendarDate(calendarEvent.end)
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: calendarEvent.title,
    dates: `${startDate}/${endDate}`,
    location: calendarEvent.location,
    details: calendarEvent.description.replace(/\\n/g, '\n'),
    guests: calendarEvent.attendees.join(',')
  })
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Generates an Outlook calendar link for a booking
 */
export function generateOutlookCalendarLink(booking: BookingRequest): string {
  const calendarEvent = createCalendarEventFromBooking(booking)
  
  const formatOutlookDate = (date: Date) => {
    return date.toISOString()
  }
  
  const params = new URLSearchParams({
    subject: calendarEvent.title,
    startdt: formatOutlookDate(calendarEvent.start),
    enddt: formatOutlookDate(calendarEvent.end),
    location: calendarEvent.location,
    body: calendarEvent.description.replace(/\\n/g, '\n'),
    to: calendarEvent.attendees.join(';')
  })
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

/**
 * Generates calendar links for various platforms
 */
export function generateCalendarLinks(booking: BookingRequest) {
  return {
    google: generateGoogleCalendarLink(booking),
    outlook: generateOutlookCalendarLink(booking),
    download: () => downloadCalendarFile(booking)
  }
}

/**
 * Creates a calendar reminder for upcoming bookings
 */
export function createUpcomingBookingsReminder(bookings: BookingRequest[]): string {
  const upcomingBookings = bookings
    .filter(b => b.status === 'approved' && b.scheduled_date)
    .sort((a, b) => new Date(a.scheduled_date!).getTime() - new Date(b.scheduled_date!).getTime())
    .slice(0, 5) // Next 5 bookings
  
  if (upcomingBookings.length === 0) {
    return 'No upcoming videography shoots scheduled.'
  }
  
  const reminderText = [
    'UPCOMING VIDEOGRAPHY SHOOTS',
    '=' .repeat(30),
    '',
    ...upcomingBookings.map(booking => {
      const agent = { name: 'Agent', email: 'agent@osus.com' } // Will be provided by calling component
      const complexity = SHOOT_COMPLEXITIES[booking.shoot_complexity]
      
      return [
        `📅 ${booking.scheduled_date} at ${booking.scheduled_time || '09:00'}`,
        `🏠 ${booking.property_address}`,
        `👤 Agent: ${agent?.name || 'Unknown'}`,
        `⏱️  Duration: ${booking.estimated_duration} minutes (${complexity.label})`,
        ''
      ].join('\n')
    }),
    'Download full schedule: Use the "Export Calendar" feature in the dashboard'
  ].join('\n')
  
  return reminderText
}