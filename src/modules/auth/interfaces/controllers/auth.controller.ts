import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiErrors,
  ApiSuccess,
} from '../../../../shared/swagger/api-responses.decorator';
import type { GoogleProfile } from '../../application/dtos/google-profile.dto';
import { LoginResult } from '../../application/dtos/login-result.dto';
import { LoginUserDto } from '../../application/dtos/login-user.dto';
import { RegisterUserDto } from '../../application/dtos/register-user.dto';
import { UserProfile } from '../../application/dtos/user-profile.dto';
import { LoginWithGoogleUseCase } from '../../application/use-cases/login-with-google.use-case';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { OAuthProfile } from '../decorators/oauth-profile.decorator';
import { Public } from '../../../../shared/decorators/public.decorator';
import { GoogleAuthGuard } from '../guards/google-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
    private readonly loginWithGoogle: LoginWithGoogleUseCase,
  ) {}

  @ApiOperation({
    summary: 'Register a user',
    description:
      'Public endpoint. Creates an ADMIN or MECHANIC account; `specialty` is required for mechanics. The password is stored hashed and never returned.',
  })
  @ApiSuccess(UserProfile, {
    status: HttpStatus.CREATED,
    description: 'User created.',
  })
  @ApiErrors({
    badRequest:
      'Invalid payload (e.g. weak password, missing specialty for a mechanic).',
    conflict: 'A user with this email already exists.',
  })
  @Public()
  @Post('register')
  register(@Body() dto: RegisterUserDto): Promise<UserProfile> {
    return this.registerUser.execute(dto);
  }

  @ApiOperation({
    summary: 'Log in',
    description:
      'Public endpoint. Returns a JWT access token. Use the **Authorize** button above and paste the token to call protected endpoints.',
  })
  @ApiSuccess(LoginResult, { description: 'Authenticated; token issued.' })
  @ApiErrors({
    badRequest: 'Invalid payload.',
    unauthorized: 'Wrong email or password, or the account is inactive.',
  })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginUserDto): Promise<LoginResult> {
    return this.loginUser.execute(dto);
  }

  @ApiOperation({
    summary: 'Start Google login',
    description:
      'Public endpoint. Redirects the browser to Google\'s consent screen with a signed `state` that the callback must return. Open it in a browser tab: Swagger "Try it out" cannot follow the cross-site redirect. Answers 503 when Google credentials are not configured.',
  })
  @ApiResponse({ status: HttpStatus.FOUND, description: 'Redirect to Google.' })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Google login is not configured on this server.',
  })
  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  startGoogleLogin(): void {
    // Intentionally empty: GoogleAuthGuard performs the redirect to Google.
  }

  @ApiOperation({
    summary: 'Google login callback',
    description:
      'Public endpoint called by Google after consent (the URL registered as GOOGLE_CALLBACK_URL). Finds the user by verified email, or creates a MECHANIC account on first login, and returns the same JWT payload as `POST /auth/login`.',
  })
  @ApiSuccess(LoginResult, { description: 'Authenticated; token issued.' })
  @ApiErrors({
    unauthorized:
      'State missing, invalid or expired; consent cancelled; or the Google email is not verified.',
    forbidden: 'The matching account is inactive.',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Google login is not configured on this server.',
  })
  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  googleCallback(@OAuthProfile() profile: GoogleProfile): Promise<LoginResult> {
    return this.loginWithGoogle.execute(profile);
  }
}
