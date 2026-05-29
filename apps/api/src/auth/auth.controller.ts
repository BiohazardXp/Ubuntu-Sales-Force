import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/v1/auth/login  — public
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // GET /api/v1/auth/me  — requires valid JWT
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: { id: string }) {
    return this.authService.getProfile(user.id);
  }
}
