import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreateMechanicUseCase } from './application/use-cases/create-mechanic.use-case';
import { FindAllMechanicsUseCase } from './application/use-cases/find-all-mechanics.use-case';
import { FindOneMechanicUseCase } from './application/use-cases/find-one-mechanic.use-case';
import { ToggleMechanicStatusUseCase } from './application/use-cases/toggle-mechanic-status.use-case';
import { UpdateMechanicUseCase } from './application/use-cases/update-mechanic.use-case';
import { MechanicsController } from './interfaces/controllers/mechanics.controller';

/**
 * Mechanics are users with role MECHANIC, so this module owns no table of its
 * own: it reuses the user repository and password hasher exported by AuthModule.
 */
@Module({
  imports: [AuthModule],
  controllers: [MechanicsController],
  providers: [
    CreateMechanicUseCase,
    FindAllMechanicsUseCase,
    FindOneMechanicUseCase,
    UpdateMechanicUseCase,
    ToggleMechanicStatusUseCase,
  ],
})
export class MechanicsModule {}
