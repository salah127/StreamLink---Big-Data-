import { Controller, Get, Patch, Delete, Body, Param, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  getCurrentUser(@Req() req) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  updateProfile(@Req() req, @Body() body: { displayName?: string; avatarUrl?: string }) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Get('me/points')
  @ApiOperation({ summary: 'Get user points balance' })
  @ApiResponse({ status: 200, description: 'Points balance retrieved' })
  getPointsBalance(@Req() req, @Query('streamerId') streamerId?: string) {
    return this.usersService.getPointsBalance(req.user.id, streamerId);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete user account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  deleteAccount(@Req() req) {
    return this.usersService.deleteAccount(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}