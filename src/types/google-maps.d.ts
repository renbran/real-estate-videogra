declare namespace google {
  namespace maps {
    class LatLng {
      constructor(lat: number, lng: number)
      lat(): number
      lng(): number
    }

    class LatLngBounds {
      constructor()
      extend(point: LatLng): void
    }

    enum MapTypeId {
      ROADMAP = 'roadmap',
      SATELLITE = 'satellite',
      HYBRID = 'hybrid',
      TERRAIN = 'terrain'
    }

    enum SymbolPath {
      CIRCLE = 0,
      FORWARD_CLOSED_ARROW = 1,
      FORWARD_OPEN_ARROW = 2,
      BACKWARD_CLOSED_ARROW = 3,
      BACKWARD_OPEN_ARROW = 4
    }

    interface MapOptions {
      center?: LatLng
      zoom?: number
      mapTypeId?: MapTypeId
    }

    class Map {
      constructor(mapDiv: HTMLElement, opts?: MapOptions)
      fitBounds(bounds: LatLngBounds): void
      setCenter(latlng: LatLng): void
      setZoom(zoom: number): void
    }

    interface MarkerLabel {
      text: string
      color?: string
      fontSize?: string
      fontWeight?: string
    }

    interface MarkerIcon {
      path: SymbolPath | string
      scale?: number
      fillColor?: string
      fillOpacity?: number
      strokeColor?: string
      strokeWeight?: number
    }

    interface MarkerOptions {
      position: LatLng
      map?: Map
      title?: string
      label?: MarkerLabel | string
      icon?: MarkerIcon | string
    }

    class Marker {
      constructor(opts?: MarkerOptions)
      addListener(eventName: string, handler: () => void): void
      setMap(map: Map | null): void
    }

    interface InfoWindowOptions {
      content?: string | HTMLElement
    }

    class InfoWindow {
      constructor(opts?: InfoWindowOptions)
      open(map?: Map, anchor?: Marker): void
      close(): void
    }

    enum TravelMode {
      DRIVING = 'DRIVING',
      WALKING = 'WALKING',
      TRANSIT = 'TRANSIT',
      BICYCLING = 'BICYCLING'
    }

    enum TrafficModel {
      BEST_GUESS = 'bestguess',
      OPTIMISTIC = 'optimistic',
      PESSIMISTIC = 'pessimistic'
    }

    interface DirectionsRequest {
      origin: LatLng | string
      destination: LatLng | string
      waypoints?: DirectionsWaypoint[]
      optimizeWaypoints?: boolean
      travelMode: TravelMode
      avoidHighways?: boolean
      avoidTolls?: boolean
      drivingOptions?: DrivingOptions
    }

    interface DirectionsWaypoint {
      location: LatLng | string
      stopover: boolean
    }

    interface DrivingOptions {
      departureTime: Date
      trafficModel: TrafficModel
    }

    interface DirectionsResult {
      routes: DirectionsRoute[]
    }

    interface DirectionsRoute {
      waypoint_order?: number[]
      legs: DirectionsLeg[]
    }

    interface DirectionsLeg {
      distance?: Distance
      duration?: Duration
    }

    interface Distance {
      value: number
      text: string
    }

    interface Duration {
      value: number
      text: string
    }

    enum DirectionsStatus {
      OK = 'OK',
      NOT_FOUND = 'NOT_FOUND',
      ZERO_RESULTS = 'ZERO_RESULTS',
      MAX_WAYPOINTS_EXCEEDED = 'MAX_WAYPOINTS_EXCEEDED',
      INVALID_REQUEST = 'INVALID_REQUEST',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR'
    }

    class DirectionsService {
      route(
        request: DirectionsRequest,
        callback: (result: DirectionsResult | null, status: DirectionsStatus) => void
      ): void
    }

    interface GeocoderRequest {
      address?: string
      location?: LatLng
    }

    interface GeocoderResult {
      formatted_address: string
      geometry: GeocoderGeometry
      address_components?: GeocoderAddressComponent[]
    }

    interface GeocoderGeometry {
      location: LatLng
    }

    interface GeocoderAddressComponent {
      long_name: string
      short_name: string
      types: string[]
    }

    enum GeocoderStatus {
      OK = 'OK',
      ZERO_RESULTS = 'ZERO_RESULTS',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      INVALID_REQUEST = 'INVALID_REQUEST',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR'
    }

    class Geocoder {
      geocode(
        request: GeocoderRequest,
        callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void
      ): void
    }

    namespace places {
      interface AutocompletePrediction {
        description: string
        place_id?: string
        matched_substrings?: PredictionSubstring[]
        structured_formatting?: AutocompleteStructuredFormatting
        types?: string[]
      }

      interface PredictionSubstring {
        length: number
        offset: number
      }

      interface AutocompleteStructuredFormatting {
        main_text?: string
        secondary_text?: string
      }

      interface AutocompleteRequest {
        input: string
        types?: string[]
        componentRestrictions?: ComponentRestrictions
      }

      interface ComponentRestrictions {
        country?: string | string[]
      }

      enum PlacesServiceStatus {
        OK = 'OK',
        ZERO_RESULTS = 'ZERO_RESULTS',
        NOT_FOUND = 'NOT_FOUND',
        INVALID_REQUEST = 'INVALID_REQUEST',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        UNKNOWN_ERROR = 'UNKNOWN_ERROR'
      }

      class AutocompleteService {
        getPlacePredictions(
          request: AutocompleteRequest,
          callback: (predictions: AutocompletePrediction[] | null, status: PlacesServiceStatus) => void
        ): void
      }

      interface PlaceDetailsRequest {
        placeId: string
        fields?: string[]
      }

      interface PlaceResult {
        formatted_address?: string
        geometry?: PlaceGeometry
        address_components?: GeocoderAddressComponent[]
      }

      interface PlaceGeometry {
        location?: LatLng
      }

      class PlacesService {
        constructor(attrContainer: HTMLElement)
        getDetails(
          request: PlaceDetailsRequest,
          callback: (result: PlaceResult | null, status: PlacesServiceStatus) => void
        ): void
      }
    }
  }
}

interface Window {
  google: typeof google
  initGoogleMaps: () => void
}