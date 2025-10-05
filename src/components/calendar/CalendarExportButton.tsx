import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { CalendarBlank, Download, Export } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { BookingRequest } from '@/lib/types'
import { 
  downloadCalendarFile, 
  downloadMultipleBookingsCalendar,
  generateGoogleCalendarLink,
  generateOutlookCalendarLink 
} from '@/lib/calendar-utils'

interface CalendarExportButtonProps {
  booking?: BookingRequest
  bookings?: BookingRequest[]
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function CalendarExportButton({ 
  booking, 
  bookings, 
  variant = 'outline', 
  size = 'sm',
  className 
}: CalendarExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  
  const isSingleBooking = !!booking
  const exportBookings = bookings?.filter(b => b.status === 'approved' && b.scheduled_date) || []
  const hasBookingsToExport = isSingleBooking || exportBookings.length > 0

  const handleDownloadICS = async () => {
    setIsExporting(true)
    try {
      if (isSingleBooking && booking) {
        downloadCalendarFile(booking)
        toast.success('Calendar file downloaded')
      } else if (exportBookings.length > 0) {
        downloadMultipleBookingsCalendar(exportBookings)
        toast.success(`Calendar file with ${exportBookings.length} bookings downloaded`)
      }
    } catch (error) {
      toast.error('Failed to download calendar file')
    } finally {
      setIsExporting(false)
    }
  }

  const handleGoogleCalendar = () => {
    if (isSingleBooking && booking) {
      const link = generateGoogleCalendarLink(booking)
      window.open(link, '_blank')
      toast.success('Opening Google Calendar')
    }
  }

  const handleOutlookCalendar = () => {
    if (isSingleBooking && booking) {
      const link = generateOutlookCalendarLink(booking)
      window.open(link, '_blank')
      toast.success('Opening Outlook Calendar')
    }
  }

  if (!hasBookingsToExport) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <CalendarBlank className="w-4 h-4 mr-1" />
        No Events
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={isExporting}>
          <Export className="w-4 h-4 mr-1" />
          {isExporting ? 'Exporting...' : isSingleBooking ? 'Export Event' : 'Export Calendar'}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          {isSingleBooking ? 'Export Single Event' : `Export ${exportBookings.length} Events`}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleDownloadICS}>
          <Download className="w-4 h-4 mr-2" />
          Download (.ics file)
        </DropdownMenuItem>
        
        {isSingleBooking && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleGoogleCalendar}>
              <CalendarBlank className="w-4 h-4 mr-2" />
              Add to Google Calendar
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleOutlookCalendar}>
              <CalendarBlank className="w-4 h-4 mr-2" />
              Add to Outlook Calendar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}