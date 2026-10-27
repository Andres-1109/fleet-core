import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VehicleRecord, VehicleStatus } from '../../../../domain-contracts';

@Entity('vehicles')
export class VehicleOrmEntity implements VehicleRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 15, unique: true })
  plate: string;

  @Column({ type: 'varchar', length: 50 })
  brand: string;

  @Column({ type: 'varchar', length: 50 })
  model: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  mileage: number;

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    enumName: 'vehicle_status_enum',
    default: VehicleStatus.AVAILABLE,
  })
  status: VehicleStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
