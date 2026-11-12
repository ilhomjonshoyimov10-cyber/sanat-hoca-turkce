import { Module } from '@nestjs/common';
import { FreeLessonController } from './freelesson.controller.js';
import { FreeLessonService } from './freelesson.service.js';

@Module({ controllers: [FreeLessonController], providers: [FreeLessonService] })
export class FreeLessonModule {}
