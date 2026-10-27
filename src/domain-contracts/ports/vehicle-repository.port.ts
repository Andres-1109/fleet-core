import { VehicleStatus } from '../enums/vehicle-status.enum';

/** Persisted shape of a vehicle, shared across modules. */
export interface VehicleRecord {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  status: VehicleStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateVehicleData = Omit<
  VehicleRecord,
  'id' | 'createdAt' | 'updatedAt'
>;
export type UpdateVehicleData = Partial<CreateVehicleData>;

export interface IVehicleRepository {
  findById(id: string): Promise<VehicleRecord | null>;
  findByPlate(plate: string): Promise<VehicleRecord | null>;
  findAll(): Promise<VehicleRecord[]>;
  create(data: CreateVehicleData): Promise<VehicleRecord>;
  update(id: string, data: UpdateVehicleData): Promise<VehicleRecord>;
}
