import { WorkshopRecord } from '../../../domain-contracts';

/** Domain representation of a workshop. Pure TypeScript, no persistence concerns. */
export class Workshop {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly address: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static fromRecord(record: WorkshopRecord): Workshop {
    return new Workshop(
      record.id,
      record.name,
      record.address,
      record.isActive,
      record.createdAt,
      record.updatedAt,
    );
  }
}
