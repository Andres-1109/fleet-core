import {
  buildVehicle,
  mockVehicleRepository,
} from '../../../../shared/testing/repository-mocks';
import { Vehicle } from '../../domain/vehicle.entity';
import { FindAllVehiclesUseCase } from './find-all-vehicles.use-case';

describe('FindAllVehiclesUseCase', () => {
  it('maps every record to a Vehicle entity', async () => {
    const vehicles = mockVehicleRepository();
    vehicles.findAll.mockResolvedValue([
      buildVehicle(),
      buildVehicle({ id: 'v2', plate: 'DEF456' }),
    ]);

    const result = await new FindAllVehiclesUseCase(vehicles).execute();

    expect(result).toHaveLength(2);
    expect(result[1]).toBeInstanceOf(Vehicle);
    expect(result.map((vehicle) => vehicle.plate)).toEqual([
      'ABC123',
      'DEF456',
    ]);
  });
});
