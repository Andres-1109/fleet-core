import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../../domain-contracts';

/**
 * Injects the authenticated user (set by JwtStrategy) into a handler parameter.
 * Only meaningful on routes that are not @Public().
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | undefined =>
    context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>().user,
);
