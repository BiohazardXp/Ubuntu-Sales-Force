import {
  Injectable, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { AttendanceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import type { RequestUser } from '../auth/guards/roles.guard';

// Expected clock-in time — 08:00. Reps later than this are marked LATE
const LATE_HOUR = 8;

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Clock in ──────────────────────────────────────────────────────────────

  async clockIn(dto: ClockInDto, requester: RequestUser) {
    const now       = dto.clockIn ? new Date(dto.clockIn) : new Date();
    const startOfDay = this.startOfDay(now);

    // One record per user per day
    const existing = await this.prisma.attendance.findUnique({
      where: { userId_date: { userId: requester.id, date: startOfDay } },
    });
    if (existing?.clockIn) {
      throw new BadRequestException('You have already clocked in today.');
    }

    const status: AttendanceStatus =
      now.getHours() >= LATE_HOUR + 1 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

    return this.prisma.attendance.upsert({
      where: { userId_date: { userId: requester.id, date: startOfDay } },
      update: { clockIn: now, clockInLat: dto.lat, clockInLng: dto.lng, status, notes: dto.notes },
      create: {
        userId:     requester.id,
        companyId:  requester.companyId!,
        date:       startOfDay,
        clockIn:    now,
        clockInLat: dto.lat,
        clockInLng: dto.lng,
        status,
        notes:      dto.notes,
      },
    });
  }

  // ── Clock out ─────────────────────────────────────────────────────────────

  async clockOut(dto: ClockOutDto, requester: RequestUser) {
    const now        = dto.clockOut ? new Date(dto.clockOut) : new Date();
    const startOfDay = this.startOfDay(now);

    const record = await this.prisma.attendance.findUnique({
      where: { userId_date: { userId: requester.id, date: startOfDay } },
    });
    if (!record) throw new BadRequestException('You have not clocked in today.');
    if (record.clockOut) throw new BadRequestException('You have already clocked out today.');

    return this.prisma.attendance.update({
      where: { id: record.id },
      data:  {
        clockOut:    now,
        clockOutLat: dto.lat,
        clockOutLng: dto.lng,
        notes:       dto.notes ?? record.notes,
      },
    });
  }

  // ── Today's record for the current user ───────────────────────────────────

  async getToday(requester: RequestUser) {
    const startOfDay = this.startOfDay(new Date());
    return this.prisma.attendance.findUnique({
      where: { userId_date: { userId: requester.id, date: startOfDay } },
    });
  }

  // ── History for a rep (scoped by company) ─────────────────────────────────

  async getHistory(userId: string, requester: RequestUser) {
    return this.prisma.attendance.findMany({
      where: {
        userId,
        companyId: requester.companyId ?? undefined,
      },
      orderBy: { date: 'desc' },
      take: 30,
    });
  }

  // ── All attendance for company today (SUPERVISOR / COMPANY_ADMIN) ─────────

  async getCompanyToday(requester: RequestUser) {
    const startOfDay = this.startOfDay(new Date());
    return this.prisma.attendance.findMany({
      where:   { companyId: requester.companyId!, date: startOfDay },
      include: { user: { select: { id: true, firstName: true, lastName: true, territory: true } } },
      orderBy: { clockIn: 'asc' },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private startOfDay(d: Date): Date {
    const s = new Date(d);
    s.setUTCHours(0, 0, 0, 0);
    return s;
  }
}
