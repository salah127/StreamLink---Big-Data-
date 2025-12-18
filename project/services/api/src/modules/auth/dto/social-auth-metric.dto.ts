import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Platform } from '../../../common/prisma/mock-prisma';

export class TrackSocialAuthDto {
  @ApiProperty({
    enum: Platform,
    example: Platform.TWITCH,
    description: 'Social auth platform',
  })
  @IsEnum(Platform, { message: 'Invalid platform' })
  platform: Platform;

  @ApiProperty({
    example: 'auth_12345_67890',
    description: 'Unique analytics identifier for this auth session',
  })
  @IsString()
  @IsNotEmpty({ message: 'Analytics ID is required' })
  analyticsId: string;

  @ApiProperty({
    example: 'success',
    description: 'Outcome of the auth attempt',
    enum: ['success', 'failure', 'cancelled'],
  })
  @IsString()
  @IsNotEmpty({ message: 'Outcome is required' })
  outcome: string;

  @ApiProperty({
    example: 'User cancelled authentication',
    description: 'Error message if authentication failed',
    required: false,
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;
}
