import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role, StopStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateStopDto } from './dto/update-stop.dto';
import type { RequestUser } from '../auth/guards/roles.guard';

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Create route with stops (COMPANY_ADMIN / SUPERVISOR) ─────────────────

  async create(dto: CreateRouteDto, requester: RequestUser) {
    const companyId = requester.companyId!;

    // Verify the assigned rep belongs to the same company
    const rep = await this.prisma.user.findFirst({
      where: { id: dto.userId, companyId, deletedAt: null },
    });
    if (!rep) throw new NotFoundException('Rep not found in your company.');

    return this.prisma.route.create({
      data: {
        userId:    dto.userId,
        companyId,
        date:      new Date(dto.date),
        name:      dto.name,
        notes:     dto.notes,
        stops: {
          create: dto.stops.map(s => ({
            customerName: s.customerName,
            address:      s.address,
            lat:          s.lat,
            lng:          s.lng,
            order:        s.order,
            notes:        s.notes,
          })),
        },
      },
      include: { stops: { orderBy: { order: 'asc' } } },
    });
  }

  // ── Get today's route for the logged-in rep ───────────────────────────────

  async getMyToday(requester: RequestUser) {
    const startOfDay = this.startOfDay(new Date());
    const endOfDay   = this.endOfDay(new Date());

    return this.prisma.route.findFirst({
      where: {
        userId:    requester.id,
        companyId: requester.companyId!,
        date:      { gte: startOfDay, lte: endOfDay },
      },
      include: { stops: { orderBy: { order: 'asc' } } },
    });
  }

  // ── Get all routes for a rep (managers) ──────────────────────────────────

  async getForRep(userId: string, requester: RequestUser) {
    return this.prisma.route.findMany({
      where:   { userId, companyId: requester.companyId ?? undefined },
      include: { stops: { orderBy: { order: 'asc' } } },
      orderBy: { date: 'desc' },
      take:    30,
    });
  }

  // ── Get all routes for company today (managers) ───────────────────────────

  async getCompanyToday(requester: RequestUser) {
    const startOfDay = this.startOfDay(new Date());
    const endOfDay   = this.endOfDay(new Date());

    return this.prisma.route.findMany({
      where: {
        companyId: requester.companyId!,
        date:      { gte: startOfDay, lte: endOfDay },
      },
      include: {
        user:  { select: { id: true, firstName: true, lastName: true, territory: true } },
        stops: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ── Update a stop status (rep marks visited / skipped) ───────────────────

  async updateStop(stopId: string, dto: UpdateStopDto, requester: RequestUser) {
    const stop = await this.prisma.stop.findUnique({
      where:   { id: stopId },
      include: { route: true },
    });
    if (!stop) throw new NotFoundException('Stop not found.');

    // Rep can only update stops on their own routes
    if (requester.role === Role.SALES_REP && stop.route.userId !== requester.id) {
      throw new ForbiddenException('This stop is not on your route.');
    }

    return this.prisma.stop.update({
      where: { id: stopId },
      data: {
        status:    dto.status,
        visitedAt: dto.status === StopStatus.VISITED
          ? (dto.visitedAt ? new Date(dto.visitedAt) : new Date())
          : null,
        notes: dto.notes,
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private startOfDay(d: Date): Date {
    const s = new Date(d); s.setUTCHours(0,0,0,0); return s;
  }
  private endOfDay(d: Date): Date {
    const e = new Date(d); e.setUTCHours(23,59,59,999); return e;
  }
}
