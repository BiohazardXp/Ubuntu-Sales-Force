import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub:       string;
  username:  string;
  role:      string;
  companyId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest:   ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:      process.env.JWT_SECRET!,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, isActive: true },
      include: { company: { select: { id: true, isActive: true, subscriptionStatus: true } } },
    });

    if (!user) throw new UnauthorizedException('User not found or inactive.');

    // Block users whose company has been suspended (SUPER_ADMIN exempt)
    if (user.company && !user.company.isActive) {
      throw new UnauthorizedException('Your company account has been suspended.');
    }

    return {
      id:        user.id,
      username:  user.username,
      role:      user.role,
      companyId: user.companyId ?? null,
    };
  }
}
