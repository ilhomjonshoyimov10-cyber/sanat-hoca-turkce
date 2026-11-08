import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/auth.decorators.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Salomatlik tekshiruvi: Docker va nazorat tizimlari ilova tirikligini shu yerdan biladi.
 * Ichki tafsilotlar (versiya, baza manzili, xato matni) oshkor qilinmaydi.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Throttle({ default: { limit: 120, ttl: 60 * 1000 } })
  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'down' });
    }
    return { status: 'ok' };
  }
}
