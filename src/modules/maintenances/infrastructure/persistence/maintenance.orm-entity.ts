import {
  Column,
  CreateDateColumn,
  Entity,
  Exclusion,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  MaintenanceRecord,
  MaintenanceStatus,
  MaintenanceType,
} from '../../../../domain-contracts';

const ACTIVE_STATUS_PREDICATE = `"status" IN ('SCHEDULED', 'IN_PROGRESS')`;

// numeric columns come back from pg as strings; expose them as numbers.
const decimalToNumber = {
  to: (value: number | null): number | null => value,
  from: (value: string | null): number | null =>
    value === null ? null : Number(value),
};

/**
 * Database-level guards that back up the use-case checks under concurrency:
 * - a vehicle can have at most one active maintenance (partial unique index);
 * - a mechanic's active maintenances cannot overlap in time (exclusion
 *   constraint over the half-open range [start, end), so touching is allowed).
 *
 * Relations reference other modules' entities by name to avoid importing them.
 */
@Entity('maintenances')
@Index('UQ_maintenances_active_vehicle', ['vehicleId'], {
  unique: true,
  where: ACTIVE_STATUS_PREDICATE,
})
@Exclusion(
  'EX_maintenances_mechanic_schedule',
  `USING gist ("mechanicId" WITH =, tstzrange("scheduledStartDate", "scheduledEndDate", '[)') WITH &&) WHERE (${ACTIVE_STATUS_PREDICATE})`,
)
export class MaintenanceOrmEntity implements MaintenanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: MaintenanceType,
    enumName: 'maintenance_type_enum',
  })
  type: MaintenanceType;

  @Column({ type: 'varchar', length: 1000 })
  description: string;

  @Column({ type: 'int' })
  mileage: number;

  @Column({ type: 'timestamptz' })
  scheduledStartDate: Date;

  @Column({ type: 'timestamptz' })
  scheduledEndDate: Date;

  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    enumName: 'maintenance_status_enum',
    default: MaintenanceStatus.SCHEDULED,
  })
  status: MaintenanceStatus;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  workPerformed: string | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalToNumber,
  })
  finalCost: number | null;

  @Column({ type: 'int', nullable: true })
  finalMileage: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  @Index()
  @Column({ type: 'uuid' })
  vehicleId: string;

  @Index()
  @Column({ type: 'uuid' })
  mechanicId: string;

  @Column({ type: 'uuid' })
  workshopId: string;

  // Relations exist for the foreign keys; they are never loaded.
  @ManyToOne('VehicleOrmEntity', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehicleId' })
  readonly vehicle?: unknown;

  @ManyToOne('UserOrmEntity', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'mechanicId' })
  readonly mechanic?: unknown;

  @ManyToOne('WorkshopOrmEntity', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'workshopId' })
  readonly workshop?: unknown;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
