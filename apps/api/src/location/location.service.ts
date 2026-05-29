import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LocationPingDto, BulkLocationDto } from './dto/location-ping.dto';
import type { RequestUser } from '../auth/guards/roles.guard';

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Single ping ───────────────────────────────────────────────────────────

  async ping(dto: LocationPingDto, requester: RequestUser) {
    return this.prisma.locationPing.create({
      data: {
        userId:   requester.id,
        lat:      dto.lat,
        lng:      dto.lng,
        accuracy: dto.accuracy,
        battery:  dto.battery,
      },
    });
  }

  // ── Bulk ping (offline pings sent together on reconnect) ──────────────────

  async bulkPing(dto: BulkLocationDto, requester: RequestUser) {
    await this.prisma.locationPing.createMany({
      data: dto.pings.map(p => ({
        userId:   requester.id,
        lat:      p.lat,
        lng:      p.lng,
        accuracy: p.accuracy,
        battery:  p.battery,
      })),
    });
    return { saved: dto.pings.length };
  }

  // ── Latest location for every active rep (managers dashboard) ─────────────

  async getLatestForCompany(requester: RequestUser) {
    // Get the most recent ping per user in this company
    const reps = await this.prisma.user.findMany({
      where:  { companyId: requester.companyId!, isActive: true, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, territory: true },
    });

    const locations = await Promise.all(
      reps.map(async rep => {
        const latest = await this.prisma.locationPing.findFirst({
          where:   { userId: rep.id },
          orderBy: { timestamp: 'desc' },
        });
        return { ...rep, location: latest ?? null };
      }),
    );

    return locations;
  }

  // ── Location trail for a specific rep today ────────────────────────────────

  async getTrailForRep(userId: string, requester: RequestUser) {
    const start = new Date(); start.setUTCHours(0,0,0,0);
    const end   = new Date(); end.setUTCHours(23,59,59,999);

    return this.prisma.locationPing.findMany({
      where:   { userId, timestamp: { gte: start, lte: end } },
      orderBy: { timestamp: 'asc' },
    });
  }
}
