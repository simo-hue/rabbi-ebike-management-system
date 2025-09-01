export type BikeType = "bambino" | "adulto" | "carrello-porta-bimbi";
export type BikeSize = "S" | "M" | "L" | "XL";
export type BikeSuspension = "full-suspension" | "front-only";

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
  size: BikeSize;
  suspension: BikeSuspension;
  description: string;
  minHeight: number; // in cm
  maxHeight: number; // in cm
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
  count: number;
};

// For booking form - customer height and bike suggestions
export type CustomerInfo = {
  name: string;
  height: number; // in cm
  suggestedBikes: string[]; // bike IDs that fit this customer
};