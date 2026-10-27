import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WORKSHOP_REPOSITORY } from '../../domain-contracts';
import { CreateWorkshopUseCase } from './application/use-cases/create-workshop.use-case';
import { FindAllWorkshopsUseCase } from './application/use-cases/find-all-workshops.use-case';
import { FindOneWorkshopUseCase } from './application/use-cases/find-one-workshop.use-case';
import { ToggleWorkshopStatusUseCase } from './application/use-cases/toggle-workshop-status.use-case';
import { UpdateWorkshopUseCase } from './application/use-cases/update-workshop.use-case';
import { WorkshopTypeormRepository } from './infrastructure/persistence/workshop-typeorm.repository';
import { WorkshopOrmEntity } from './infrastructure/persistence/workshop.orm-entity';
import { WorkshopsController } from './interfaces/controllers/workshops.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WorkshopOrmEntity])],
  controllers: [WorkshopsController],
  providers: [
    CreateWorkshopUseCase,
    FindAllWorkshopsUseCase,
    FindOneWorkshopUseCase,
    UpdateWorkshopUseCase,
    ToggleWorkshopStatusUseCase,
    { provide: WORKSHOP_REPOSITORY, useClass: WorkshopTypeormRepository },
  ],
  // Maintenances reuse the workshop repository to validate assignments.
  exports: [WORKSHOP_REPOSITORY],
})
export class WorkshopsModule {}
