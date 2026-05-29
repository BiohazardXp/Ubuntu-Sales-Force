import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SyncSalesDto } from './dto/sync-sales.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { RequestUser } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly svc: SalesService) {}

  // POST /api/v1/sales — submit one sale
  @Post()
  @Roles(Role.SALES_REP, Role.SUPERVISOR)
  create(@Body() dto: CreateSaleDto, @CurrentUser() user: RequestUser) {
    return this.svc.create(dto, user);
  }

  // POST /api/v1/sales/sync — bulk offline sync
  @Post('sync')
  @Roles(Role.SALES_REP, Role.SUPERVISOR)
  sync(@Body() dto: SyncSalesDto, @CurrentUser() user: RequestUser) {
    return this.svc.sync(dto, user);
  }

  // GET /api/v1/sales/my/today
  @Get('my/today')
  @Roles(Role.SALES_REP, Role.SUPERVISOR)
  getMyToday(@CurrentUser() user: RequestUser) {
    return this.svc.getMyToday(user);
  }

  // GET /api/v1/sales/company/today — all company sales today
  @Get('company/today')
  @Roles(Role.SUPERVISOR, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  getCompanyToday(@CurrentUser() user: RequestUser) {
    return this.svc.getCompanyToday(user);
  }

  // GET /api/v1/sales/summary/reps — totals by rep today
  @Get('summary/reps')
  @Roles(Role.SUPERVISOR, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  getSummaryByRep(@CurrentUser() user: RequestUser) {
    return this.svc.getSummaryByRep(user);
  }
}
