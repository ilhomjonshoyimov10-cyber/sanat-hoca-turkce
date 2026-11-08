import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module.js';
import { AiModule } from './ai/ai.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BooksModule } from './books/books.module.js';
import { ChatModule } from './chat/chat.module.js';
import { DictionaryModule } from './dictionary/dictionary.module.js';
import { CsrfGuard } from './common/csrf.guard.js';
import { validateEnv } from './config/env.validation.js';
import { GamesModule } from './games/games.module.js';
import { HealthModule } from './health/health.module.js';
import { GroupsModule } from './groups/groups.module.js';
import { LeadsModule } from './leads/leads.module.js';
import { LessonsModule } from './lessons/lessons.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ReadingModule } from './reading/reading.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]), // umumiy limit: daqiqasiga 120 so'rov
    PrismaModule,
    NotificationsModule, // global: boshqa modullar bildirishnoma yuboradi
    AuthModule,
    UsersModule,
    LeadsModule,
    GamesModule,
    GroupsModule,
    ChatModule,
    LessonsModule,
    BooksModule,
    ReadingModule,
    DictionaryModule,
    AiModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
})
export class AppModule {}
