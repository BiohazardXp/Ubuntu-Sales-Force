import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateStopDto } from './dto/update-stop.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { RequestUser } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('routes')
export class RoutesController {
  constructor(private readonly svc: RoutesService) {}

  // POST /api/v1/routes — create route + stops for a rep
  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.SUPERVISOR, Role.SUPER_ADMIN)
  create(@Body() dto: CreateRouteDto, @CurrentUser() user: RequestUser) {
    return this.svc.create(dto, user);
  }

  // GET /api/v1/routes/my/today — rep's own route today
  @Get('my/today')
  @Roles(Role.SALES_REP, Role.SUPERVISOR)
  getMyToday(@CurrentUser() user: RequestUser) {
    return this.svc.getMyToday(user);
  }

  // GET /api/v1/routes/company/today — all routes today (managers)
  @Get('company/today')
  @Roles(Role.SUPERVISOR, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  getCompanyToday(@CurrentUser() user: RequestUser) {
    return this.svc.getCompanyToday(user);
  }

  // GET /api/v1/routes/rep/:userId — history for a specific rep
  @Get('rep/:userId')
  @Roles(Role.SUPERVISOR, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  getForRep(@Param('userId') userId: string, @CurrentUser() user: RequestUser) {
    return this.svc.getForRep(userId, user);
  }

  // PATCH /api/v1/routes/stops/:stopId — mark stop visited/skipped
  @Patch('stops/:stopId')
  @Roles(Role.SALES_REP, Role.SUPERVISOR, Role.COMPANY_ADMIN)
  updateStop(
    @Param('stopId') stopId: string,
    @Body() dto: UpdateStopDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.updateStop(stopId, dto, user);
  }
}
