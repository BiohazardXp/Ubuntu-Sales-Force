import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { RequestUser } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  create(@Body() dto: CreateUserDto, @CurrentUser() user: RequestUser) {
    return this.usersService.create(dto, user);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.SUPERVISOR)
  findAll(@CurrentUser() user: RequestUser) {
    return this.usersService.findAll(user);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.SUPERVISOR)
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.usersService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.usersService.remove(id, user);
  }
}
