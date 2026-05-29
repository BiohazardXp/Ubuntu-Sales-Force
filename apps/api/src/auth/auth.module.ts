import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { JwtModuleOptions } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
 
@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (): JwtModuleOptions => ({
        secret:      process.env.JWT_SECRET ?? 'fallback_secret',
        signOptions: {
          // Cast to any to bypass the overly strict StringValue type
          // from the ms library — a plain string like '7d' works at runtime
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as any,
        },
      }),
    }),
  ],
  providers:   [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports:     [AuthService],
})
export class AuthModule {}