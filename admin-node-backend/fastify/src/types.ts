// Type definitions for the admin backend

export interface Carrier {
  _id: string;
  name: string;
  iata: string;
  icao: string;
  callsign: string;
  country: string;
  active: boolean;
  low_cost: boolean;
  picture: string;
  alliance: string;
  regional: boolean;
  parent: string;
  mode: string;
}

export interface CarrierTable extends Carrier {
  pictures: number;
}

export interface Vehicle {
  _id: string;
  icao: string;
  iata: string;
  title: string;
  manufacturer: string;
  mode: string;
}

export interface VehicleTable extends Vehicle {
  pictures: number;
}

export interface TravelPicture {
  _id: string;
  carrier: string;
  vehicle: string;
  url: string;
}

export interface TravelPictureTable {
  carrier: string;
  vehicle: string;
  count: number;
}

export interface TravelPictureSeries {
  carrier: string;
  series: string;
  count: number;
}

export interface Region {
  _id: string;
  name: string;
  description: string;
}

export interface RegionTable extends Region {
  transit_hub_count: number;
}

export interface RegionTransitHub {
  _id: string;
  region: string;
  transit_hub: string;
}

export interface TransitHub {
  _id: string;
  name: string;
  iata: string;
  icao: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  altitude: number;
  iana: string;
  mode: string;
}

export interface TransitHubTable extends TransitHub {
  pictures: number;
}

export interface TransitHubMedia {
  _id: string;
  transit_hub: string;
  url: string;
}

export interface VehicleSeries {
  _id: string;
  series: string;
  vehicle: string;
  mode: string;
}

export interface VehicleSeriesWithPictures {
  vehicle_number: number;
  picture_count: number;
  vehicles: VehicleTable[];
  pictures: TravelPicture[];
}

export interface LatLongResponse {
  ianaTimeId: string;
  displayName: string;
  effectiveTimeZoneFull: string;
  effectiveTimeZoneShort: string;
  utcOffsetSeconds: number;
  utcOffset: string;
  isDaylightSavingsTime: boolean;
  localTime: string;
}

export interface JWTPayload {
  sub: string;
  role?: string;
  exp: number;
  iat: number;
}

export interface FPGroupKey {
  carrier: string;
  vehicle: string;
}

export interface CarrierSeriesKey {
  carrier: string;
  series: string;
}

