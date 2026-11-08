import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Role } from '@prisma/client';
import { calcAge, normalizeEmail, normalizePhone } from '../auth/auth.utils.js';
import { tashkentDay } from '../games/srs.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AddMemberDto, AttendanceDto, CreateGroupDto, CreateHomeworkDto, GradeDto, SubmitDto, UpdateGroupDto,
} from './groups.dto.js';

export interface Actor { id: string; role: Role }

const NOT_FOUND = "Topilmadi";
const DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  // ───────── Ruxsat tekshiruvi (IDOR himoyasi) ─────────
  /**
   * Guruhga kirish huquqi: ADMIN, guruhning ustozi yoki a'zosi. Boshqalar uchun "topilmadi"
   * (404): guruh mavjudligini ham bilib bo'lmasligi uchun.
   */
  private async access(groupId: string, actor: Actor) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException(NOT_FOUND);
    const canManage = actor.role === 'ADMIN' || (actor.role === 'TEACHER' && group.teacherId === actor.id);
    const isMember = !canManage && !!(await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: actor.id } },
    }));
    if (!canManage && !isMember) throw new NotFoundException(NOT_FOUND);
    return { group, canManage };
  }

  private async manage(groupId: string, actor: Actor) {
    const { group, canManage } = await this.access(groupId, actor);
    if (!canManage) throw new ForbiddenException("Bu amal faqat guruh ustozi uchun");
    return group;
  }

  private audit(action: string, actor: Actor, entityId: string, meta?: Record<string, string | number | boolean>) {
    return this.prisma.auditLog
      .create({ data: { action, userId: actor.id, entity: 'group', entityId, meta: meta ?? undefined } })
      .catch(() => undefined);
  }

  // ───────── Guruhlar ─────────
  async list(actor: Actor) {
    let groups;
    if (actor.role === 'ADMIN') groups = await this.prisma.group.findMany({ orderBy: { createdAt: 'desc' } });
    else if (actor.role === 'TEACHER') groups = await this.prisma.group.findMany({ where: { teacherId: actor.id }, orderBy: { createdAt: 'desc' } });
    else {
      const mine = await this.prisma.groupMember.findMany({ where: { userId: actor.id } });
      groups = mine.length ? await this.prisma.group.findMany({ where: { id: { in: mine.map((m) => m.groupId) } }, orderBy: { createdAt: 'desc' } }) : [];
    }
    const ids = groups.map((g) => g.id);
    const members = ids.length ? await this.prisma.groupMember.findMany({ where: { groupId: { in: ids } } }) : [];
    const teachers = await this.prisma.user.findMany({
      where: { id: { in: [...new Set(groups.map((g) => g.teacherId))] } },
      select: { id: true, firstName: true, lastName: true },
    });
    const tName = new Map(teachers.map((t) => [t.id, `${t.firstName} ${t.lastName}`]));
    return groups.map((g) => ({
      id: g.id, name: g.name, level: g.level, schedule: g.schedule, meetingUrl: g.meetingUrl, isActive: g.isActive,
      memberCount: members.filter((m) => m.groupId === g.id).length, teacherName: tName.get(g.teacherId) ?? '',
    }));
  }

  async create(actor: Actor, dto: CreateGroupDto) {
    let teacherId = actor.id;
    if (dto.teacherId && dto.teacherId !== actor.id) {
      if (actor.role !== 'ADMIN') throw new ForbiddenException("Guruhni boshqa ustozga faqat administrator biriktira oladi");
      const t = await this.prisma.user.findUnique({ where: { id: dto.teacherId }, select: { id: true, role: true } });
      if (!t || (t.role !== 'TEACHER' && t.role !== 'ADMIN')) throw new BadRequestException("Ustoz topilmadi");
      teacherId = t.id;
    }
    const group = await this.prisma.group.create({
      data: { name: dto.name.trim(), level: dto.level, schedule: dto.schedule?.trim() || undefined, meetingUrl: dto.meetingUrl, teacherId },
    });
    await this.audit('GROUP_CREATED', actor, group.id);
    return group;
  }

  async detail(id: string, actor: Actor) {
    const { group, canManage } = await this.access(id, actor);
    const rows = await this.prisma.groupMember.findMany({ where: { groupId: id } });
    const users = rows.length
      ? await this.prisma.user.findMany({
          where: { id: { in: rows.map((r) => r.userId) } },
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, birthDate: true, parentConsent: true },
        })
      : [];
    const teacher = await this.prisma.user.findUnique({ where: { id: group.teacherId }, select: { firstName: true, lastName: true } });
    return {
      group: { id: group.id, name: group.name, level: group.level, schedule: group.schedule, meetingUrl: group.meetingUrl, isActive: group.isActive },
      teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : '',
      canManage,
      // Aloqa ma'lumotlari faqat ustozga ko'rinadi; o'quvchilar bir-birining email/telefonini ko'rmaydi
      members: users.map((u) => ({
        id: u.id, firstName: u.firstName, lastName: u.lastName,
        ...(canManage ? { email: u.email, phone: u.phone, isMinor: !!u.birthDate && calcAge(u.birthDate) < 18, parentConsent: u.parentConsent } : {}),
      })),
    };
  }

  async update(id: string, actor: Actor, dto: UpdateGroupDto) {
    await this.manage(id, actor);
    return this.prisma.group.update({ where: { id }, data: { ...dto, name: dto.name?.trim() } });
  }

  async addMember(id: string, actor: Actor, dto: AddMemberDto) {
    await this.manage(id, actor);
    const ident = dto.identifier.trim();
    const where = ident.includes('@') ? { email: normalizeEmail(ident) } : { phone: normalizePhone(ident) ?? '__invalid__' };
    const user = await this.prisma.user.findUnique({ where });
    if (!user || user.role !== 'STUDENT' || !user.isActive) throw new NotFoundException("Bunday o'quvchi topilmadi. U avval ro'yxatdan o'tgan bo'lishi kerak");

    const exists = await this.prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: id, userId: user.id } } });
    if (exists) throw new ConflictException("O'quvchi allaqachon guruhda");

    const minor = !!user.birthDate && calcAge(user.birthDate) < 18;
    if (minor && !user.parentConsent) {
      if (!dto.confirmParentConsent) {
        throw new ConflictException({
          statusCode: 409, code: 'PARENT_CONSENT_REQUIRED',
          message: "O'quvchi 18 yoshga to'lmagan. Ota-ona roziligi olinganini tasdiqlang",
        });
      }
      await this.prisma.user.update({ where: { id: user.id }, data: { parentConsent: true } });
      await this.audit('PARENT_CONSENT_RECORDED', actor, id, { studentId: user.id });
    }
    await this.prisma.groupMember.create({ data: { groupId: id, userId: user.id } });
    await this.audit('MEMBER_ADDED', actor, id, { studentId: user.id });
    return { ok: true };
  }

  async removeMember(id: string, userId: string, actor: Actor) {
    await this.manage(id, actor);
    const m = await this.prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: id, userId } } });
    if (!m) throw new NotFoundException(NOT_FOUND);
    await this.prisma.groupMember.delete({ where: { groupId_userId: { groupId: id, userId } } });
    await this.audit('MEMBER_REMOVED', actor, id, { studentId: userId });
    return { ok: true };
  }

  // ───────── Uy vazifalari ─────────
  async createHomework(groupId: string, actor: Actor, dto: CreateHomeworkDto) {
    await this.manage(groupId, actor);
    return this.prisma.homework.create({
      data: { groupId, title: dto.title.trim(), description: dto.description.trim(), maxScore: dto.maxScore ?? 100, dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined },
    });
  }

  async listHomework(groupId: string, actor: Actor) {
    const { canManage } = await this.access(groupId, actor);
    const items = await this.prisma.homework.findMany({ where: { groupId }, orderBy: { createdAt: 'desc' } });
    const subs = items.length ? await this.prisma.submission.findMany({ where: { homeworkId: { in: items.map((h) => h.id) } } }) : [];
    return items.map((h) => {
      const mine = subs.filter((s) => s.homeworkId === h.id);
      const base = { id: h.id, title: h.title, description: h.description, dueAt: h.dueAt, maxScore: h.maxScore, createdAt: h.createdAt };
      if (canManage) return { ...base, submittedCount: mine.length, gradedCount: mine.filter((s) => s.status === 'GRADED').length };
      const own = mine.find((s) => s.studentId === actor.id);
      return { ...base, mySubmission: own ? { id: own.id, text: own.text, status: own.status, score: own.score, feedback: own.feedback } : null };
    });
  }

  async homeworkDetail(homeworkId: string, actor: Actor) {
    const hw = await this.prisma.homework.findUnique({ where: { id: homeworkId } });
    if (!hw) throw new NotFoundException(NOT_FOUND);
    const { canManage } = await this.access(hw.groupId, actor);
    if (!canManage) return { homework: hw, submissions: [] };
    const subs = await this.prisma.submission.findMany({ where: { homeworkId } });
    const users = subs.length
      ? await this.prisma.user.findMany({ where: { id: { in: subs.map((s) => s.studentId) } }, select: { id: true, firstName: true, lastName: true } })
      : [];
    const name = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));
    return {
      homework: hw,
      submissions: subs.map((s) => ({
        id: s.id, studentId: s.studentId, studentName: name.get(s.studentId) ?? '?', text: s.text, status: s.status,
        score: s.score, feedback: s.feedback, submittedAt: s.submittedAt,
      })),
    };
  }

  async submit(homeworkId: string, actor: Actor, dto: SubmitDto) {
    const hw = await this.prisma.homework.findUnique({ where: { id: homeworkId } });
    if (!hw) throw new NotFoundException(NOT_FOUND);
    // Faqat shu guruhning o'quvchisi topshira oladi
    const member = actor.role === 'STUDENT' && (await this.prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: hw.groupId, userId: actor.id } } }));
    if (!member) throw new NotFoundException(NOT_FOUND);

    const existing = await this.prisma.submission.findUnique({ where: { homeworkId_studentId: { homeworkId, studentId: actor.id } } });
    if (existing?.status === 'GRADED') throw new ConflictException("Vazifa allaqachon baholangan, qayta topshirib bo'lmaydi");
    if (existing) {
      return this.prisma.submission.update({ where: { id: existing.id }, data: { text: dto.text.trim(), status: 'SUBMITTED', submittedAt: new Date() } });
    }
    return this.prisma.submission.create({ data: { homeworkId, studentId: actor.id, text: dto.text.trim() } });
  }

  async grade(submissionId: string, actor: Actor, dto: GradeDto) {
    const sub = await this.prisma.submission.findUnique({ where: { id: submissionId } });
    if (!sub) throw new NotFoundException(NOT_FOUND);
    const hw = await this.prisma.homework.findUnique({ where: { id: sub.homeworkId } });
    if (!hw) throw new NotFoundException(NOT_FOUND);
    await this.manage(hw.groupId, actor);

    if (dto.returnForRevision) {
      return this.prisma.submission.update({ where: { id: sub.id }, data: { status: 'RETURNED', feedback: dto.feedback?.trim() || null, score: null } });
    }
    if (dto.score === undefined) throw new BadRequestException('Ball kiriting');
    if (dto.score > hw.maxScore) throw new BadRequestException(`Ball ${hw.maxScore} dan oshmasin`);
    return this.prisma.submission.update({ where: { id: sub.id }, data: { status: 'GRADED', score: dto.score, feedback: dto.feedback?.trim() || null } });
  }

  // ───────── Davomat ─────────
  async saveAttendance(groupId: string, actor: Actor, dto: AttendanceDto) {
    await this.manage(groupId, actor);
    const day = tashkentDay(new Date());
    if (dto.date > day) throw new BadRequestException("Kelajak sanasi uchun davomat belgilab bo'lmaydi");
    if (Number.isNaN(Date.parse(`${dto.date}T00:00:00Z`))) throw new BadRequestException("Sana noto'g'ri");

    const members = await this.prisma.groupMember.findMany({ where: { groupId } });
    const ids = new Set(members.map((m) => m.userId));
    if (dto.records.some((r) => !ids.has(r.userId))) throw new BadRequestException("Ro'yxatda guruh a'zosi bo'lmagan o'quvchi bor");

    const date = new Date(`${dto.date}T00:00:00Z`);
    for (const r of dto.records) {
      const key = { groupId_userId_date: { groupId, userId: r.userId, date } };
      const found = await this.prisma.attendance.findUnique({ where: key });
      if (found) await this.prisma.attendance.update({ where: { id: found.id }, data: { present: r.present } });
      else await this.prisma.attendance.create({ data: { groupId, userId: r.userId, date, present: r.present } });
    }
    return { ok: true, saved: dto.records.length };
  }

  async attendance(groupId: string, actor: Actor) {
    const { canManage } = await this.access(groupId, actor);
    const since = new Date(Date.now() - 60 * DAY);
    const rows = await this.prisma.attendance.findMany({ where: { groupId, date: { gte: since } } });
    const visible = canManage ? rows : rows.filter((r) => r.userId === actor.id); // o'quvchi faqat o'zinikini ko'radi
    return { records: visible.map((r) => ({ date: r.date.toISOString().slice(0, 10), userId: r.userId, present: r.present })) };
  }
}
