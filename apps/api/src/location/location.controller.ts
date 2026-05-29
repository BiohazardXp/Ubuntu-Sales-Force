import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { LocationService } from './location.service';
import { LocationPingDto, BulkLocationDto } from './dto/location-ping.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { RequestUser } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('location')
export class LocationController {
  constructor(private readonly svc: LocationService) {}

  @Post('ping')
  @Roles(Role.SALES_REP, Role.SUPERVISOR)
  ping(@Body() dto: LocationPingDto, @CurrentUser() user: RequestUser) {
    return this.svc.ping(dto, user);
  }

  @Post('ping/bulk')
  @Roles(Role.SALES_REP, Role.SUPERVISOR)
  bulkPing(@Body() dto: BulkLocationDto, @CurrentUser() user: RequestUser) {
    return this.svc.bulkPing(dto, user);
  }

  @Get('company/latest')
  @Roles(Role.SUPERVISOR, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  getLatestForCompany(@CurrentUser() user: RequestUser) {
    return this.svc.getLatestForCompany(user);
  }

  @Get('rep/:userId/trail')
  @Roles(Role.SUPERVISOR, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  getTrail(@Param('userId') userId: string, @CurrentUser() user: RequestUser) {
    return this.svc.getTrailForRep(userId, user);
  }
}
