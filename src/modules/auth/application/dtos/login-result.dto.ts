import { ApiProperty } from '@nestjs/swagger';
import { UserProfile } from './user-profile.dto';

export class LoginResult {
  @ApiProperty({
    description: 'JWT to send as "Authorization: Bearer <token>".',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: 'Bearer';

  @ApiProperty({ type: UserProfile })
  user: UserProfile;
}
