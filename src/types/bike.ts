export type BikeType = "bambino" | "adulto" | "carrello-porta-bimbi" | "trailer";
export type BikeSize = "S" | "M" | "L" | "XL";
export type BikeSuspension = "full-suspension" | "front";

export type MaintenanceRecord = {
  id: string;
  date: Date;
  type: string;
  description: string;
  cost: number;
  mechanic?: string;
  notes?: string;
};

export type Bike = {
  id: string;
  name: string;
  brand: string;
  model?: string;
  type: BikeType;
  size?: BikeSize; // Optional for trailers
  suspension?: BikeSuspension; // Optional for trailers
  hasTrailerHook?: boolean; // Optional - only for bikes that can attach trailers
  description: string;
  minHeight?: number; // in cm - Optional for trailers
  maxHeight?: number; // in cm - Optional for trailers
  purchaseDate?: Date;
  purchasePrice?: number;
  isActive: boolean;
  maintenance: MaintenanceRecord[];
  totalMaintenanceCost: number;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
};

// Legacy type for compatibility with existing booking system
export type BikeDetails = {
  type: BikeType;
  size: BikeSize;
  suspension: BikeSuspension;
  hasTrailerHook?: boolean;
  count: number;
};

// New type for individual bike selection with names
export type AvailableBike = {
  id: string;
  name: string;
  brand: string;
  model?: string;
  type: BikeType;
  size?: BikeSize;
  suspension?: BikeSuspension;
  hasTrailerHook?: boolean;
  description: string;
  isAvailable: boolean;
  minHeight?: number;
  maxHeight?: number;
};

// For booking form - customer height and bike suggestions
export type CustomerInfo = {
  name: string;
  height: number; // in cm
  suggestedBikes: string[]; // bike IDs that fit this customer
};