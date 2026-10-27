import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser, Role } from '../../domain-contracts';
import { buildExecutionContext } from '../testing/execution-context';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

// Real decorators on fake controllers, so the metadata wiring is tested too.
@Roles(Role.ADMIN, Role.MECHANIC)
class FakeController {
  open(): void {}

  @Roles(Role.ADMIN)
  adminOnly(): void {}
}

class UndecoratedController {
  anything(): void {}
}

const requestAs = (role: Role | null): { user?: AuthenticatedUser } =>
  role ? { user: { id: 'u1', email: 'u@x.com', role } } : {};

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('allows any authenticated user when no @Roles() is declared', () => {
    const context = buildExecutionContext({
      controller: UndecoratedController,
      handler: UndecoratedController.prototype.anything,
      request: requestAs(Role.MECHANIC),
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('uses the controller-level roles when the method declares none', () => {
    const context = buildExecutionContext({
      controller: FakeController,
      handler: FakeController.prototype.open,
      request: requestAs(Role.MECHANIC),
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('lets a method-level @Roles() override the controller', () => {
    const context = buildExecutionContext({
      controller: FakeController,
      handler: FakeController.prototype.adminOnly,
      request: requestAs(Role.MECHANIC),
    });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      'Access denied. Required role: ADMIN',
    );
  });

  it('allows a user holding a required role', () => {
    const context = buildExecutionContext({
      controller: FakeController,
      handler: FakeController.prototype.adminOnly,
      request: requestAs(Role.ADMIN),
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies when roles are required but no user is attached', () => {
    const context = buildExecutionContext({
      controller: FakeController,
      handler: FakeController.prototype.adminOnly,
      request: requestAs(null),
    });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
