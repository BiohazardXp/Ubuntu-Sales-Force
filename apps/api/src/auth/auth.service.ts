import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService:   JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByUsernameWithPassword(dto.username);
    if (!user) throw new UnauthorizedException('Invalid username or password.');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid username or password.');

    // companyId is included so every request knows which tenant it belongs to
    const payload = {
      sub:       user.id,
      username:  user.username,
      role:      user.role,
      companyId: user.companyId ?? null,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const { password: _pw, ...safeUser } = user;

    return { accessToken, user: safeUser };
  }

  async getProfile(userId: string) {
    return this.usersService.findOne(userId);
  }
}
