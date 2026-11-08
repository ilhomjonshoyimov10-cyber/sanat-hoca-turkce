import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { JwtAuthGuard, MfaGuard, RolesGuard } from './auth.guards.js';
import { AuthService } from './auth.service.js';
import { TwoFactorService } from './twofactor.service.js';

@Module({
  imports: [JwtModule.register({})], // secret har chaqiruvda beriladi (auth.service, auth.guards)
  controllers: [AuthController],
  providers: [
    AuthService,
    TwoFactorService,
    // Global: standart holatda hamma yo'l yopiq, @Public() bilan ochiladi
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: MfaGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
