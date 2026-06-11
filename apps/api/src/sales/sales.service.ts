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

  // ── Bulk sync ─────────────────────────────────────────────────────────────

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
    return { sales, total: sales.reduce((s,r) => s + r.total, 0), count: sales.length };
  }

  // ── Company sales today ───────────────────────────────────────────────────

  async getCompanyToday(requester: RequestUser) {
    const { start, end } = this.todayRange();

    // SUPER_ADMIN has no companyId — don't filter by it
    const where: any = { createdAt: { gte: start, lte: end } };
    if (requester.companyId) where.companyId = requester.companyId;

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        stop: { select: { customerName: true, address: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { sales, total: sales.reduce((s,r) => s + r.total, 0), count: sales.length };
  }

  // ── Summary by rep ────────────────────────────────────────────────────────

  async getSummaryByRep(requester: RequestUser) {
    const { start, end } = this.todayRange();

    // SUPER_ADMIN has no companyId — don't filter by it
    const where: any = { createdAt: { gte: start, lte: end } };
    if (requester.companyId) where.companyId = requester.companyId;

    const grouped = await this.prisma.sale.groupBy({
      by:      ['userId'],
      where,
      _sum:    { total: true },
      _count:  { id: true },
      orderBy: { _sum: { total: 'desc' } },
    });

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
