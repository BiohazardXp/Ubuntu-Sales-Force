import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SyncSalesDto } from './dto/sync-sales.dto';
import type { RequestUser } from '../auth/guards/roles.guard';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Submit a single sale ──────────────────────────────────────────────────

  async create(dto: CreateSaleDto, requester: RequestUser) {
    const total = dto.quantity * dto.unitPrice;

    // Dedup: if a localId was provided and already exists, return existing
    if (dto.localId) {
      const existing = await this.prisma.sale.findFirst({
        where: { localId: dto.localId, userId: requester.id },
      });
      if (existing) return existing;
    }

    return this.prisma.sale.create({
      data: {
        userId:     requester.id,
        companyId:  requester.companyId!,
        stopId:     dto.stopId,
        product:    dto.product,
        quantity:   dto.quantity,
        unitPrice:  dto.unitPrice,
        total,
        lat:        dto.lat,
        lng:        dto.lng,
        notes:      dto.notes,
        receiptUrl: dto.receiptUrl,
        localId:    dto.localId,
        syncedAt:   new Date(),
      },
    });
  }

  // ── Bulk sync (offline sales submitted together) ──────────────────────────

  async sync(dto: SyncSalesDto, requester: RequestUser) {
    const results = await Promise.all(
      dto.sales.map(sale => this.create(sale, requester)),
    );
    return { synced: results.length, sales: results };
  }

  // ── My sales today ────────────────────────────────────────────────────────

  async getMyToday(requester: RequestUser) {
    const { start, end } = this.todayRange();
    const sales = await this.prisma.sale.findMany({
      where:   { userId: requester.id, createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: 'desc' },
    });
    const total = sales.reduce((s, r) => s + r.total, 0);
    return { sales, total, count: sales.length };
  }

  // ── Company sales today (managers) ────────────────────────────────────────

  async getCompanyToday(requester: RequestUser) {
    const { start, end } = this.todayRange();
    const companyId = requester.role === Role.SUPER_ADMIN
      ? undefined : requester.companyId!;

    const sales = await this.prisma.sale.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        createdAt: { gte: start, lte: end },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        stop: { select: { customerName: true, address: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = sales.reduce((s, r) => s + r.total, 0);
    return { sales, total, count: sales.length };
  }

  // ── Sales summary by rep for company today ────────────────────────────────

  async getSummaryByRep(requester: RequestUser) {
    const { start, end } = this.todayRange();

    const grouped = await this.prisma.sale.groupBy({
      by:      ['userId'],
      where:   { companyId: requester.companyId!, createdAt: { gte: start, lte: end } },
      _sum:    { total: true },
      _count:  { id: true },
      orderBy: { _sum: { total: 'desc' } },
    });

    // Hydrate with user names
    const userIds = grouped.map(g => g.userId);
    const users   = await this.prisma.user.findMany({
      where:  { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    return grouped.map(g => ({
      userId:    g.userId,
      name:      userMap[g.userId]
        ? `${userMap[g.userId].firstName} ${userMap[g.userId].lastName}`
        : 'Unknown',
      total:     g._sum.total ?? 0,
      saleCount: g._count.id,
    }));
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private todayRange() {
    const start = new Date(); start.setUTCHours(0,0,0,0);
    const end   = new Date(); end.setUTCHours(23,59,59,999);
    return { start, end };
  }
}
