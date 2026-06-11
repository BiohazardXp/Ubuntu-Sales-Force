import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role, StopStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateStopDto } from './dto/update-stop.dto';
import type { RequestUser } from '../auth/guards/roles.guard';

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Create route with stops ───────────────────────────────────────────────

  async create(dto: CreateRouteDto, requester: RequestUser) {
    const companyId = requester.companyId!;

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

  // ── Today's route for the logged-in user ──────────────────────────────────

  async getMyToday(requester: RequestUser) {
    const { start, end } = this.todayRange();

    // Build where clause — only filter companyId when it's set
    const where: any = {
      userId: requester.id,
      date:   { gte: start, lte: end },
    };
    if (requester.companyId) where.companyId = requester.companyId;

    return this.prisma.route.findFirst({
      where,
      include: { stops: { orderBy: { order: 'asc' } } },
    });
  }

  // ── All routes for a specific rep ─────────────────────────────────────────

  async getForRep(userId: string, requester: RequestUser) {
    const where: any = { userId };
    if (requester.companyId) where.companyId = requester.companyId;

    return this.prisma.route.findMany({
      where,
      include: { stops: { orderBy: { order: 'asc' } } },
      orderBy: { date: 'desc' },
      take:    30,
    });
  }

  // ── All routes for company today ──────────────────────────────────────────

  async getCompanyToday(requester: RequestUser) {
    const { start, end } = this.todayRange();

    const where: any = { date: { gte: start, lte: end } };
    if (requester.companyId) where.companyId = requester.companyId;

    return this.prisma.route.findMany({
      where,
      include: {
        user:  { select: { id: true, firstName: true, lastName: true, territory: true } },
        stops: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ── Update stop status ────────────────────────────────────────────────────

  async updateStop(stopId: string, dto: UpdateStopDto, requester: RequestUser) {
    const stop = await this.prisma.stop.findUnique({
      where:   { id: stopId },
      include: { route: true },
    });
    if (!stop) throw new NotFoundException('Stop not found.');

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

  private todayRange() {
    const start = new Date(); start.setUTCHours(0,0,0,0);
    const end   = new Date(); end.setUTCHours(23,59,59,999);
    return { start, end };
  }
}
