import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VEHICLE_REPOSITORY } from '../../domain-contracts';
import { CreateVehicleUseCase } from './application/use-cases/create-vehicle.use-case';
import { DeactivateVehicleUseCase } from './application/use-cases/deactivate-vehicle.use-case';
import { FindAllVehiclesUseCase } from './application/use-cases/find-all-vehicles.use-case';
import { FindVehicleUseCase } from './application/use-cases/find-vehicle.use-case';
import { UpdateVehicleUseCase } from './application/use-cases/update-vehicle.use-case';
import { VehicleTypeormRepository } from './infrastructure/persistence/vehicle-typeorm.repository';
import { VehicleOrmEntity } from './infrastructure/persistence/vehicle.orm-entity';
import { VehiclesController } from './interfaces/controllers/vehicles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleOrmEntity])],
  controllers: [VehiclesController],
  providers: [
    CreateVehicleUseCase,
    FindAllVehiclesUseCase,
    FindVehicleUseCase,
    UpdateVehicleUseCase,
    DeactivateVehicleUseCase,
    { provide: VEHICLE_REPOSITORY, useClass: VehicleTypeormRepository },
  ],
  // Maintenances reuse the vehicle repository to read and sync vehicle status.
  exports: [VEHICLE_REPOSITORY],
})
export class VehiclesModule {}
