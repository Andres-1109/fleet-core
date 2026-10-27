import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { buildExecutionContext } from '../testing/execution-context';
import { Public } from '../decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

class FakeController {
  @Public()
  login(): void {}
}

describe('JwtAuthGuard', () => {
  const guard = new JwtAuthGuard(new Reflector());

  it('lets @Public() routes through without a token', () => {
    const context = buildExecutionContext({
      controller: FakeController,
      handler: FakeController.prototype.login,
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  describe('handleRequest', () => {
    it('returns the user resolved by the JWT strategy', () => {
      const user = { id: 'u1' };
      expect(guard.handleRequest(null, user)).toBe(user);
    });

    it('rejects a request without a valid token with a clear message', () => {
      expect(() => guard.handleRequest(null, false)).toThrow(
        'Missing, invalid, or expired token',
      );
    });

    it('propagates errors raised by the strategy', () => {
      const error = new UnauthorizedException('User is no longer active');
      expect(() => guard.handleRequest(error, false)).toThrow(
        'User is no longer active',
      );
    });
  });
});
