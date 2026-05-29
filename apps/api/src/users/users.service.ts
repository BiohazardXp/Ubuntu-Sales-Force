import {
  Injectable, ConflictException, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { RequestUser } from '../auth/guards/roles.guard';

const SALT_ROUNDS = 12;

const USER_SELECT = {
  id: true, username: true, email: true, firstName: true, lastName: true,
  phone: true, role: true, territory: true, isActive: true,
  companyId: true, createdAt: true, updatedAt: true, deletedAt: true,
  password: false,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Create ────────────────────────────────────────────────────────────────

  async create(dto: CreateUserDto, requester: RequestUser) {
    // SUPER_ADMIN can create anyone.
    // COMPANY_ADMIN can only create users within their own company.
    if (requester.role !== Role.SUPER_ADMIN) {
      if (!requester.companyId) throw new ForbiddenException('No company assigned.');
      // Force the new user into the same company as the requester
      dto.companyId = requester.companyId;
      // COMPANY_ADMIN cannot create SUPER_ADMIN or another COMPANY_ADMIN
      if (dto.role === Role.SUPER_ADMIN || dto.role === Role.COMPANY_ADMIN) {
        throw new ForbiddenException('You cannot assign this role.');
      }
    }

    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.username }, { email: dto.email }], deletedAt: null },
    });
    if (exists) throw new ConflictException('Username or email already in use.');

    const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);
    return this.prisma.user.create({
      data: { ...dto, password: hashed },
      select: USER_SELECT,
    });
  }

  // ── Find all — scoped by company unless SUPER_ADMIN ───────────────────────

  async findAll(requester: RequestUser) {
    const where: any = { deletedAt: null };
    if (requester.role !== Role.SUPER_ADMIN) {
      where.companyId = requester.companyId;
    }
    return this.prisma.user.findMany({ where, select: USER_SELECT, orderBy: { createdAt: 'desc' } });
  }

  // ── Find one — scoped by company unless SUPER_ADMIN ──────────────────────

  async findOne(id: string, requester?: RequestUser) {
    const where: any = { id, deletedAt: null };
    if (requester && requester.role !== Role.SUPER_ADMIN) {
      where.companyId = requester.companyId;
    }
    const user = await this.prisma.user.findFirst({ where, select: USER_SELECT });
    if (!user) throw new NotFoundException(`User ${id} not found.`);
    return user;
  }

  // ── Internal: for auth only ───────────────────────────────────────────────

  async findByUsernameWithPassword(username: string) {
    return this.prisma.user.findFirst({
      where: { username, deletedAt: null, isActive: true },
    });
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateUserDto, requester: RequestUser) {
    await this.findOne(id, requester); // scoped 404 check

    // Prevent privilege escalation
    if (dto.role) {
      if (requester.role === Role.COMPANY_ADMIN &&
          (dto.role === Role.SUPER_ADMIN || dto.role === Role.COMPANY_ADMIN)) {
        throw new ForbiddenException('You cannot assign this role.');
      }
    }

    const data: any = { ...dto };
    if (dto.password) data.password = await bcrypt.hash(dto.password, SALT_ROUNDS);

    return this.prisma.user.update({ where: { id }, data, select: USER_SELECT });
  }

  // ── Soft delete ───────────────────────────────────────────────────────────

  async remove(id: string, requester: RequestUser) {
    await this.findOne(id, requester); // scoped 404 check

    // Can't delete yourself
    if (id === requester.id) throw new ForbiddenException('You cannot deactivate your own account.');

    await this.prisma.user.update({
      where: { id },
      data:  { deletedAt: new Date(), isActive: false },
    });
    return { message: `User ${id} has been deactivated.` };
  }
}
