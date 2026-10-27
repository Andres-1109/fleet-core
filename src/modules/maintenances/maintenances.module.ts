import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MAINTENANCE_REPOSITORY } from '../../domain-contracts';
import { AuthModule } from '../auth/auth.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { WorkshopsModule } from '../workshops/workshops.module';
import { CreateMaintenanceUseCase } from './application/use-cases/create-maintenance.use-case';
import { FindActiveMaintenancesUseCase } from './application/use-cases/find-active-maintenances.use-case';
import { FindAllMaintenancesUseCase } from './application/use-cases/find-all-maintenances.use-case';
import { FindMaintenancesByMechanicUseCase } from './application/use-cases/find-maintenances-by-mechanic.use-case';
import { FindMaintenancesByVehicleUseCase } from './application/use-cases/find-maintenances-by-vehicle.use-case';
import { FindVehicleHistoryUseCase } from './application/use-cases/find-vehicle-history.use-case';
import { UpdateMaintenanceStatusUseCase } from './application/use-cases/update-maintenance-status.use-case';
import { MaintenanceTypeormRepository } from './infrastructure/persistence/maintenance-typeorm.repository';
import { MaintenanceOrmEntity } from './infrastructure/persistence/maintenance.orm-entity';
import { MaintenancesController } from './interfaces/controllers/maintenances.controller';
import { VehicleHistoryController } from './interfaces/controllers/vehicle-history.controller';

/**
 * Imports provide the USER_REPOSITORY (+ ApiKeyGuard), VEHICLE_REPOSITORY and
 * WORKSHOP_REPOSITORY tokens consumed by the use cases.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([MaintenanceOrmEntity]),
    AuthModule,
    VehiclesModule,
    WorkshopsModule,
  ],
  controllers: [MaintenancesController, VehicleHistoryController],
  providers: [
    CreateMaintenanceUseCase,
    UpdateMaintenanceStatusUseCase,
    FindAllMaintenancesUseCase,
    FindActiveMaintenancesUseCase,
    FindMaintenancesByVehicleUseCase,
    FindMaintenancesByMechanicUseCase,
    FindVehicleHistoryUseCase,
    { provide: MAINTENANCE_REPOSITORY, useClass: MaintenanceTypeormRepository },
  ],
})
export class MaintenancesModule {}
