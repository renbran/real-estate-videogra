/// <reference path="../types/google-maps.d.ts" />
import { GooglePlacePrediction, GoogleAddressComponent, RouteOptimizationResult } from './types'

const getApiKey = (): string => {
  // @ts-ignore
  const apiKey = window.GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE'
  if (apiKey === 'YOUR_API_KEY_HERE') {
    console.warn('Google Maps API key not configured. Please set GOOGLE_MAPS_API_KEY in index.html')
  }
  return apiKey
}

export class GoogleMapsService {
  private static instance: GoogleMapsService
  private autocompleteService?: google.maps.places.AutocompleteService
  private placesService?: google.maps.places.PlacesService
  private directionsService?: google.maps.DirectionsService
  private geocoder?: google.maps.Geocoder
  
  private constructor() {}
  
  static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService()
    }
    return GoogleMapsService.instance
  }
  
  async initializeServices(): Promise<void> {
    if (typeof google !== 'undefined' && google.maps) {
      this.autocompleteService = new google.maps.places.AutocompleteService()
      this.placesService = new google.maps.places.PlacesService(document.createElement('div'))
      this.directionsService = new google.maps.DirectionsService()
      this.geocoder = new google.maps.Geocoder()
      return Promise.resolve()
    } else {
      return this.loadGoogleMapsScript().then(() => {
        this.autocompleteService = new google.maps.places.AutocompleteService()
        this.placesService = new google.maps.places.PlacesService(document.createElement('div'))
        this.directionsService = new google.maps.DirectionsService()
        this.geocoder = new google.maps.Geocoder()
      })
    }
  }
  
  private loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.maps) {
        resolve()
        return
      }
      
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${getApiKey()}&libraries=places&callback=initGoogleMaps`
      script.async = true
      script.defer = true
      
      // @ts-ignore
      window.initGoogleMaps = () => {
        resolve()
      }
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps script'))
      }
      
      document.head.appendChild(script)
    })
  }
  
  async getAddressPredictions(input: string): Promise<GooglePlacePrediction[]> {
    if (!this.autocompleteService) {
      await this.initializeServices()
    }
    
    return new Promise((resolve, reject) => {
      if (!this.autocompleteService) {
        reject(new Error('Autocomplete service not initialized'))
        return
      }
      
      this.autocompleteService.getPlacePredictions(
        {
          input,
          types: ['address'],
          componentRestrictions: { country: 'us' }
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            const formattedPredictions: GooglePlacePrediction[] = predictions.map(p => ({
              description: p.description,
              place_id: p.place_id || '',
              matched_substrings: p.matched_substrings || [],
              structured_formatting: {
                main_text: p.structured_formatting?.main_text || '',
                secondary_text: p.structured_formatting?.secondary_text || ''
              },
              types: p.types || []
            }))
            resolve(formattedPredictions)
          } else {
            resolve([])
          }
        }
      )
    })
  }
  
  async getPlaceDetails(placeId: string): Promise<{
    coordinates: { lat: number; lng: number }
    formatted_address: string
    address_components: GoogleAddressComponent[]
  } | null> {
    if (!this.placesService) {
      await this.initializeServices()
    }
    
    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        reject(new Error('Places service not initialized'))
        return
      }
      
      this.placesService.getDetails(
        {
          placeId,
          fields: ['geometry', 'formatted_address', 'address_components']
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            if (place.geometry?.location) {
              const lat = place.geometry.location.lat()
              const lng = place.geometry.location.lng()
              
              const addressComponents: GoogleAddressComponent[] = 
                place.address_components?.map(comp => ({
                  long_name: comp.long_name,
                  short_name: comp.short_name,
                  types: comp.types
                })) || []
              
              resolve({
                coordinates: { lat, lng },
                formatted_address: place.formatted_address || '',
                address_components: addressComponents
              })
            } else {
              resolve(null)
            }
          } else {
            resolve(null)
          }
        }
      )
    })
  }
  
  async geocodeAddress(address: string): Promise<{
    coordinates: { lat: number; lng: number }
    formatted_address: string
    address_components: GoogleAddressComponent[]
  } | null> {
    if (!this.geocoder) {
      await this.initializeServices()
    }
    
    return new Promise((resolve) => {
      if (!this.geocoder) {
        resolve(null)
        return
      }
      
      this.geocoder.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const result = results[0]
          const lat = result.geometry.location.lat()
          const lng = result.geometry.location.lng()
          
          const addressComponents: GoogleAddressComponent[] = 
            result.address_components?.map(comp => ({
              long_name: comp.long_name,
              short_name: comp.short_name,
              types: comp.types
            })) || []
          
          resolve({
            coordinates: { lat, lng },
            formatted_address: result.formatted_address,
            address_components: addressComponents
          })
        } else {
          resolve(null)
        }
      })
    })
  }
  
  async optimizeRoute(waypoints: Array<{ 
    coordinates: { lat: number; lng: number }
    booking_id: string 
    address: string
    duration_minutes: number
  }>): Promise<RouteOptimizationResult | null> {
    if (!this.directionsService || waypoints.length < 2) {
      return null
    }
    
    const origin = waypoints[0].coordinates
    const destination = waypoints[waypoints.length - 1].coordinates
    const waypointLocations = waypoints.slice(1, -1).map(wp => ({
      location: new google.maps.LatLng(wp.coordinates.lat, wp.coordinates.lng),
      stopover: true
    }))
    
    return new Promise((resolve) => {
      if (!this.directionsService) {
        resolve(null)
        return
      }
      
      this.directionsService.route(
        {
          origin: new google.maps.LatLng(origin.lat, origin.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          waypoints: waypointLocations,
          optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.DRIVING,
          avoidHighways: false,
          avoidTolls: false,
          drivingOptions: {
            departureTime: new Date(),
            trafficModel: google.maps.TrafficModel.BEST_GUESS
          }
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            const route = result.routes[0]
            const waypointOrder = result.routes[0].waypoint_order || []
            
            let totalDistance = 0
            let totalDuration = 0
            
            route.legs.forEach(leg => {
              totalDistance += leg.distance?.value || 0
              totalDuration += leg.duration?.value || 0
            })
            
            // Build optimized order based on waypoint optimization
            const optimizedOrder: string[] = []
            const optimizedWaypoints = waypoints.slice()
            
            // Add origin
            optimizedOrder.push(optimizedWaypoints[0].booking_id)
            
            // Add optimized waypoints
            waypointOrder.forEach(index => {
              optimizedOrder.push(optimizedWaypoints[index + 1].booking_id)
            })
            
            // Add destination if different from origin
            if (waypoints.length > 1) {
              optimizedOrder.push(optimizedWaypoints[optimizedWaypoints.length - 1].booking_id)
            }
            
            resolve({
              optimized_order: optimizedOrder,
              total_distance: totalDistance,
              total_duration: totalDuration / 60, // Convert to minutes
              waypoints: optimizedWaypoints,
              traffic_aware: true
            })
          } else {
            resolve(null)
          }
        }
      )
    })
  }
  
  calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 3959 // Earth's radius in miles
    const dLat = this.toRadians(point2.lat - point1.lat)
    const dLng = this.toRadians(point2.lng - point1.lng)
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }
  
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
  
  determineGeographicZone(coordinates: { lat: number; lng: number }): string {
    // Simple zone determination - in a real app, this would be based on actual service areas
    const { lat, lng } = coordinates
    
    // Example zones for a metropolitan area
    if (lat > 40.7829 && lng > -73.9441) return 'north'
    if (lat < 40.7489 && lng > -73.9441) return 'south'
    if (lng > -73.9441) return 'east'
    if (lng < -74.0059) return 'west'
    
    return 'central'
  }
}

export const googleMapsService = GoogleMapsService.getInstance()