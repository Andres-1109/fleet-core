import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GoogleProfile } from '../../application/dtos/google-profile.dto';

/**
 * Injects the identity extracted by GoogleStrategy (set as `request.user` by
 * Passport). Only meaningful on the Google callback route.
 */
export const OAuthProfile = createParamDecorator(
  (_data: unknown, context: ExecutionContext): GoogleProfile | undefined =>
    context.switchToHttp().getRequest<{ user?: GoogleProfile }>().user,
);
