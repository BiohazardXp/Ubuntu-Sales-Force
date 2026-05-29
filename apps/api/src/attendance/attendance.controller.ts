import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { RequestUser } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly svc: AttendanceService) {}

  // POST /api/v1/attendance/clock-in
  @Post('clock-in')
  @Roles(Role.SALES_REP, Role.SUPERVISOR, Role.COMPANY_ADMIN)
  clockIn(@Body() dto: ClockInDto, @CurrentUser() user: RequestUser) {
    return this.svc.clockIn(dto, user);
  }

  // POST /api/v1/attendance/clock-out
  @Post('clock-out')
  @Roles(Role.SALES_REP, Role.SUPERVISOR, Role.COMPANY_ADMIN)
  clockOut(@Body() dto: ClockOutDto, @CurrentUser() user: RequestUser) {
    return this.svc.clockOut(dto, user);
  }

  // GET /api/v1/attendance/today — my record today
  @Get('today')
  getToday(@CurrentUser() user: RequestUser) {
    return this.svc.getToday(user);
  }

  // GET /api/v1/attendance/company/today — all reps today (managers)
  @Get('company/today')
  @Roles(Role.SUPERVISOR, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  getCompanyToday(@CurrentUser() user: RequestUser) {
    return this.svc.getCompanyToday(user);
  }

  // GET /api/v1/attendance/:userId/history
  @Get(':userId/history')
  @Roles(Role.SUPERVISOR, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  getHistory(@Param('userId') userId: string, @CurrentUser() user: RequestUser) {
    return this.svc.getHistory(userId, user);
  }
}
