import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, BedDouble, Bath, Square, Calendar } from '@phosphor-icons/react'
import { OSUS_BRAND } from '@/lib/osus-brand'

interface LuxuryPropertyCardProps {
  property: {
    id: string
    title: string
    location: string
    price: number
    bedrooms: number
    bathrooms: number
    sqft: number
    imageUrl?: string
    type: 'luxury' | 'executive' | 'premium'
  }
  onScheduleViewing?: (propertyId: string) => void
}

export function LuxuryPropertyCard({ property, onScheduleViewing }: LuxuryPropertyCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getPropertyTypeGradient = (type: string) => {
    switch (type) {
      case 'luxury':
        return 'bg-gradient-to-br from-osus-burgundy via-osus-primary-700 to-osus-primary-900'
      case 'executive':
        return 'bg-gradient-to-br from-osus-primary-600 via-osus-primary-700 to-osus-burgundy'
      case 'premium':
        return 'bg-gradient-to-br from-osus-primary-700 via-osus-burgundy to-osus-primary-800'
      default:
        return 'bg-gradient-to-br from-osus-burgundy to-osus-primary-700'
    }
  }

  return (
    <Card className="overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all duration-300 border-osus-primary-200/30">
      {/* Price Badge - Positioned at top right */}
      <div className="relative">
        <div className="absolute top-4 right-4 z-10">
          <Badge 
            className="bg-gradient-to-r from-osus-gold to-amber-400 text-osus-burgundy px-4 py-2 text-lg font-bold shadow-lg"
          >
            {formatPrice(property.price)}
          </Badge>
        </div>

        {/* Property Image Section */}
        <div className={`h-64 relative ${getPropertyTypeGradient(property.type)} flex items-center justify-center`}>
          {property.imageUrl ? (
            <img 
              src={property.imageUrl} 
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center text-white">
              <div className="text-2xl font-bold mb-2">Luxury Property Image</div>
              <div className="text-lg opacity-90">Professional Photography</div>
            </div>
          )}
        </div>
      </div>

      {/* Property Details */}
      <CardContent className="p-6 bg-white">
        <div className="space-y-4">
          {/* Title and Location */}
          <div>
            <h3 className="text-2xl font-bold text-osus-burgundy mb-2">
              {property.title}
            </h3>
            <div className="flex items-center text-osus-primary-600 mb-4">
              <MapPin className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">{property.location}</span>
            </div>
          </div>

          {/* Property Features */}
          <div className="flex items-center justify-between py-3 border-t border-osus-primary-100">
            <div className="flex items-center gap-6">
              <div className="flex items-center text-osus-primary-700">
                <BedDouble className="w-5 h-5 mr-2 text-osus-burgundy" />
                <span className="bg-osus-primary-100 px-3 py-1 rounded-full text-sm font-medium">
                  {property.bedrooms} Bed
                </span>
              </div>
              
              <div className="flex items-center text-osus-primary-700">
                <Bath className="w-5 h-5 mr-2 text-osus-burgundy" />
                <span className="bg-osus-primary-100 px-3 py-1 rounded-full text-sm font-medium">
                  {property.bathrooms} Bath
                </span>
              </div>
              
              <div className="flex items-center text-osus-primary-700">
                <Square className="w-5 h-5 mr-2 text-osus-burgundy" />
                <span className="bg-osus-primary-100 px-3 py-1 rounded-full text-sm font-medium">
                  {property.sqft.toLocaleString()} sq ft
                </span>
              </div>
            </div>
          </div>

          {/* Schedule Viewing Button */}
          <Button
            onClick={() => onScheduleViewing?.(property.id)}
            className="w-full bg-gradient-to-r from-osus-burgundy via-osus-primary-700 to-osus-burgundy hover:from-osus-primary-800 hover:via-osus-burgundy hover:to-osus-primary-800 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Schedule Viewing
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Demo component showing luxury properties
export function LuxuryPropertyShowcase() {
  const sampleProperties = [
    {
      id: '1',
      title: 'Modern Executive Home',
      location: 'Downtown Heritage District',
      price: 850000,
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2400,
      type: 'luxury' as const
    },
    {
      id: '2',
      title: 'Premium Waterfront Villa',
      location: 'Lakeside Premium Estates',
      price: 1250000,
      bedrooms: 5,
      bathrooms: 4,
      sqft: 3200,
      type: 'executive' as const
    },
    {
      id: '3',
      title: 'Luxury Penthouse Suite',
      location: 'Metropolitan Tower District',
      price: 975000,
      bedrooms: 3,
      bathrooms: 3,
      sqft: 1800,
      type: 'premium' as const
    }
  ]

  const handleScheduleViewing = (propertyId: string) => {
    console.log('Scheduling viewing for property:', propertyId)
    // Implementation would connect to booking system
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-osus-primary-50/40 via-white to-osus-secondary-50/30 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-osus-burgundy to-osus-primary-800 bg-clip-text text-transparent mb-4">
          Luxury Property Portfolio
        </h1>
        <p className="text-osus-primary-700 text-lg max-w-2xl mx-auto">
          Discover exceptional properties with our professional videography services showcasing each home's unique character and luxury features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sampleProperties.map((property) => (
          <LuxuryPropertyCard
            key={property.id}
            property={property}
            onScheduleViewing={handleScheduleViewing}
          />
        ))}
      </div>
    </div>
  )
}