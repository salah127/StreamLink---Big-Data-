import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Role } from '../../../common/prisma/mock-prisma';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Password (minimum 6 characters)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(100, { message: 'Password is too long' })
  password: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Display name for the user',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Display name must be at least 2 characters' })
  @MaxLength(50, { message: 'Display name is too long' })
  displayName?: string;

  @ApiProperty({
    example: 'johndoe',
    description: 'Unique username (3-30 characters, alphanumeric and .-_ only)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(30, { message: 'Username is too long' })
  username?: string;

  @ApiProperty({
    enum: Role,
    example: Role.VIEWER,
    description: 'User role',
    required: false,
    default: Role.VIEWER,
  })
  @IsOptional()
  @IsEnum(Role, { message: 'Invalid role' })
  role?: Role;
}
