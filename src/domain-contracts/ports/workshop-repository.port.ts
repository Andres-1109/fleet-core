/** Persisted shape of a workshop, shared across modules. */
export interface WorkshopRecord {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateWorkshopData = Omit<
  WorkshopRecord,
  'id' | 'createdAt' | 'updatedAt'
>;
export type UpdateWorkshopData = Partial<CreateWorkshopData>;

export interface IWorkshopRepository {
  findById(id: string): Promise<WorkshopRecord | null>;
  /** When `isActive` is provided, only workshops in that state are returned. */
  findAll(filter?: { isActive?: boolean }): Promise<WorkshopRecord[]>;
  create(data: CreateWorkshopData): Promise<WorkshopRecord>;
  update(id: string, data: UpdateWorkshopData): Promise<WorkshopRecord>;
}
