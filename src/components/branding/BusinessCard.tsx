import React from 'react'
import { Card } from '@/components/ui/card'
import { Phone, Envelope, MapPin, Globe } from '@phosphor-icons/react'
import { OSUS_BRAND } from '@/lib/osus-brand'

interface BusinessCardProps {
  agent: {
    name: string
    title: string
    company: string
    email: string
    phone: string
    address: string
    website?: string
  }
  variant?: 'primary' | 'gold' | 'minimal'
}

export function BusinessCard({ agent, variant = 'primary' }: BusinessCardProps) {
  const getCardStyle = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-br from-osus-burgundy via-osus-primary-700 to-osus-primary-900'
      case 'gold':
        return 'bg-gradient-to-br from-osus-gold via-amber-500 to-osus-secondary-600'
      case 'minimal':
        return 'bg-white border-2 border-osus-burgundy'
      default:
        return 'bg-gradient-to-br from-osus-burgundy via-osus-primary-700 to-osus-primary-900'
    }
  }

  const getTextStyle = () => {
    return variant === 'minimal' ? 'text-osus-burgundy' : 'text-white'
  }

  const getAccentStyle = () => {
    return variant === 'minimal' ? 'text-osus-gold' : 'text-osus-gold'
  }

  return (
    <Card className={`w-96 h-56 p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 ${getCardStyle()}`}>
      <div className="h-full flex flex-col justify-between">
        {/* Company Header */}
        <div className="text-center mb-4">
          <h1 className={`text-2xl font-bold tracking-wider ${getAccentStyle()}`}>
            {agent.company}
          </h1>
          <div className={`w-16 h-0.5 ${variant === 'minimal' ? 'bg-osus-burgundy' : 'bg-osus-gold'} mx-auto mt-2`}></div>
        </div>

        {/* Agent Information */}
        <div className="flex-1 space-y-3">
          <div>
            <h2 className={`text-xl font-bold ${getTextStyle()}`}>
              {agent.name}
            </h2>
            <p className={`text-sm font-medium ${getAccentStyle()} uppercase tracking-wide`}>
              {agent.title}
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            <div className={`flex items-center text-sm ${getTextStyle()}`}>
              <Envelope className={`w-4 h-4 mr-3 ${getAccentStyle()}`} />
              <span>{agent.email}</span>
            </div>
            
            <div className={`flex items-center text-sm ${getTextStyle()}`}>
              <Phone className={`w-4 h-4 mr-3 ${getAccentStyle()}`} />
              <span>{agent.phone}</span>
            </div>
            
            <div className={`flex items-center text-sm ${getTextStyle()}`}>
              <MapPin className={`w-4 h-4 mr-3 ${getAccentStyle()}`} />
              <span className="text-xs">{agent.address}</span>
            </div>

            {agent.website && (
              <div className={`flex items-center text-sm ${getTextStyle()}`}>
                <Globe className={`w-4 h-4 mr-3 ${getAccentStyle()}`} />
                <span className="text-xs">{agent.website}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Accent */}
        <div className={`w-full h-1 ${variant === 'minimal' ? 'bg-gradient-to-r from-osus-burgundy to-osus-gold' : 'bg-osus-gold'} rounded-full mt-4`}></div>
      </div>
    </Card>
  )
}

// Letterhead component matching the design samples
export function LetterheadDesign({ 
  companyName = "PRESTIGE REALTY",
  tagline = "Excellence in Real Estate Services"
}: {
  companyName?: string
  tagline?: string
}) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-osus-burgundy via-osus-primary-700 to-osus-burgundy p-8 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-wider text-osus-gold mb-2">
            {companyName}
          </h1>
          <div className="w-32 h-0.5 bg-osus-gold mx-auto mb-3"></div>
          <p className="text-lg font-medium text-white/90">
            {tagline}
          </p>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white p-8 min-h-96 border-l-4 border-r-4 border-osus-burgundy">
        <div className="text-osus-primary-800 space-y-6">
          <p className="text-lg leading-relaxed">
            Dear Valued Client,
          </p>
          
          <p className="leading-relaxed">
            Welcome to our premium videography services designed specifically for luxury real estate properties. 
            Our professional team specializes in capturing the essence and elegance of exceptional homes.
          </p>

          <div className="bg-osus-primary-50 p-6 rounded-lg border-l-4 border-osus-gold">
            <h3 className="text-osus-burgundy font-bold text-xl mb-3">Our Services Include:</h3>
            <ul className="space-y-2 text-osus-primary-700">
              <li className="flex items-start">
                <span className="text-osus-gold mr-2">▪</span>
                Professional property videography with 4K quality
              </li>
              <li className="flex items-start">
                <span className="text-osus-gold mr-2">▪</span>
                Drone aerial footage for comprehensive property views
              </li>
              <li className="flex items-start">
                <span className="text-osus-gold mr-2">▪</span>
                Virtual staging and enhancement services
              </li>
              <li className="flex items-start">
                <span className="text-osus-gold mr-2">▪</span>
                Same-day delivery for urgent listing needs
              </li>
            </ul>
          </div>

          <p className="leading-relaxed">
            We understand that every property has its unique character, and our goal is to showcase 
            that distinctiveness through cinematic quality videography that attracts qualified buyers.
          </p>

          <div className="mt-8 pt-6 border-t-2 border-osus-primary-100">
            <p className="font-semibold text-osus-burgundy">
              Sincerely,
            </p>
            <p className="mt-4 text-osus-primary-700">
              The {companyName} Team
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-osus-primary-100 to-osus-secondary-100 p-4 text-center border-l-4 border-r-4 border-b-4 border-osus-burgundy">
        <p className="text-osus-burgundy text-sm font-medium">
          Professional Excellence • Luxury Focus • Exceptional Results
        </p>
      </div>
    </div>
  )
}

// Demo component showing business cards and letterhead
export function BrandingShowcase() {
  const sampleAgent = {
    name: 'Sarah Thompson',
    title: 'Senior Real Estate Agent',
    company: 'PRESTIGE REALTY',
    email: 'sarah@prestigerealty.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, Suite 100',
    website: 'www.prestigerealty.com'
  }

  return (
    <div className="p-8 space-y-12 bg-gradient-to-br from-osus-primary-50/40 via-white to-osus-secondary-50/30 min-h-screen">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-osus-burgundy to-osus-gold bg-clip-text text-transparent mb-4">
          DESIGN SAMPLES
        </h1>
        <p className="text-osus-primary-700 text-lg">
          Professional branding materials for luxury real estate
        </p>
      </div>

      {/* Business Cards Section */}
      <div>
        <h2 className="text-2xl font-bold text-osus-burgundy mb-6 text-center">Business Card</h2>
        <div className="flex justify-center mb-8">
          <BusinessCard agent={sampleAgent} variant="primary" />
        </div>
        
        {/* Alternative Variants */}
        <div className="flex flex-wrap justify-center gap-8">
          <BusinessCard agent={sampleAgent} variant="gold" />
          <BusinessCard agent={sampleAgent} variant="minimal" />
        </div>
      </div>

      {/* Letterhead Section */}
      <div>
        <h2 className="text-2xl font-bold text-osus-burgundy mb-6 text-center">Letterhead Design</h2>
        <div className="flex justify-center">
          <LetterheadDesign />
        </div>
      </div>
    </div>
  )
}