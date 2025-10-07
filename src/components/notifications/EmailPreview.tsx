import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye, Code, Envelope } from '@phosphor-icons/react'
import { BookingRequest } from '@/lib/types'
import { generateEmailTemplate, NotificationPayload } from '@/lib/notification-service'

interface EmailPreviewProps {
  booking: BookingRequest
  type: 'booking_approved' | 'booking_declined' | 'booking_reminder' | 'batch_opportunity'
  additionalData?: any
}

export function EmailPreview({ booking, type, additionalData }: EmailPreviewProps) {
  const [activeTab, setActiveTab] = useState('preview')
  
  const agent = { name: 'Agent', email: 'agent@osus.com' } // Production will use real agent data
  if (!agent) return null

  const payload: NotificationPayload = {
    type,
    booking,
    recipient: { ...agent, role: 'agent' as const },
    additionalData
  }

  const emailTemplate = generateEmailTemplate(payload)

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'booking_approved':
        return 'Booking Approved'
      case 'booking_declined':
        return 'Booking Declined'
      case 'booking_reminder':
        return 'Booking Reminder'
      case 'batch_opportunity':
        return 'Batch Opportunity'
      default:
        return type
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'booking_approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'booking_declined':
        return <Badge variant="destructive">Declined</Badge>
      case 'booking_reminder':
        return <Badge className="bg-yellow-100 text-yellow-800">Reminder</Badge>
      case 'batch_opportunity':
        return <Badge className="bg-blue-100 text-blue-800">Opportunity</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="w-4 h-4 mr-1" />
          Preview Email
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Envelope className="w-5 h-5" />
            <span>Email Preview: {getTypeLabel(type)}</span>
            {getTypeBadge(type)}
          </DialogTitle>
          <DialogDescription>
            Preview of the email that will be sent to {agent.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">HTML Preview</TabsTrigger>
              <TabsTrigger value="text">
                <Code className="w-4 h-4 mr-1" />
                Plain Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 overflow-auto">
              <Card>
                <CardHeader className="pb-3">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>To:</strong> {agent.email}</p>
                    <p><strong>Subject:</strong> {emailTemplate.subject}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: emailTemplate.htmlBody }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="text" className="flex-1 overflow-auto">
              <Card>
                <CardHeader className="pb-3">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>To:</strong> {agent.email}</p>
                    <p><strong>Subject:</strong> {emailTemplate.subject}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm text-foreground font-mono bg-muted p-4 rounded">
                    {emailTemplate.textBody}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}