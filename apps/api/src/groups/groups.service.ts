import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Role } from '@prisma/client';
import { calcAge, normalizeEmail, normalizePhone } from '../auth/auth.utils.js';
import { randomInt } from 'node:crypto';
import { tashkentDay } from '../games/srs.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AddMemberDto, AttendanceDto, CreateGroupDto, CreateHomeworkDto, GradeDto, SubmitDto, UpdateGroupDto,
} from './groups.dto.js';

export interface Actor { id: string; role: Role }

/** "malika.k@gmail.com" -> "ma***@gmail.com" */
function maskEmail(e: string | null): string | null {
  if (!e) return null;
  const [name, domain] = e.split('@');
  return `${name.slice(0, 2)}***@${domain ?? ''}`;
}

/** "+998901234567" -> "+998 ** *** 45 67" */
function maskPhone(p: string | null): string | null {
  if (!p) return null;
  const d = p.replace(/\D/g, '');
  return d.length >= 4 ? `+${d.slice(0, 3)} ** *** ${d.slice(-4, -2)} ${d.slice(-2)}` : null;
}

const NOT_FOUND = "Topilmadi";
const DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

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
      group: {
        id: group.id, name: group.name, level: group.level, schedule: group.schedule, meetingUrl: group.meetingUrl, isActive: group.isActive,
        // Qo'shilish kodi faqat ustozga ko'rinadi
        ...(canManage ? { joinCode: group.joinCode } : {}),
      },
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

  // ───────── O'quvchini topish ─────────
  /**
   * Ustoz guruhga qo'shish uchun o'quvchi qidiradi: ism, familiya, email
   * yoki telefon bo'yicha (kamida 2 belgi).
   *
   * Maxfiylik: to'liq email/telefon ko'rsatilmaydi — faqat farqlash uchun
   * yetadigan qismi ("ma***@gmail.com", "+998 ** *** 45 67"). Qidiruv faqat
   * o'quvchilar orasida va faqat o'z guruhini boshqaradigan ustozga.
   */
  async candidates(id: string, actor: Actor, q: string) {
    await this.manage(id, actor);
    const term = q.trim();
    if (term.length < 2) return [];
    const digits = term.replace(/\D/g, '');
    const parts = term.split(/\s+/).filter(Boolean).slice(0, 3);
    const rows = await this.prisma.user.findMany({
      where: {
        role: 'STUDENT',
        isActive: true,
        OR: [
          ...parts.map((p) => ({ firstName: { contains: p, mode: 'insensitive' as const } })),
          ...parts.map((p) => ({ lastName: { contains: p, mode: 'insensitive' as const } })),
          { email: { contains: term.toLowerCase() } },
          ...(digits.length >= 4 ? [{ phone: { contains: digits } }] : []),
        ],
      },
      take: 20,
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true, birthDate: true, parentConsent: true,
        memberships: { select: { groupId: true, group: { select: { name: true } } } },
      },
    });
    return rows.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      avatarUrl: u.avatarUrl,
      contact: maskEmail(u.email) ?? maskPhone(u.phone) ?? '',
      inGroup: u.memberships.some((m) => m.groupId === id),
      groups: u.memberships.map((m) => m.group.name).slice(0, 3),
      needsConsent: !!u.birthDate && calcAge(u.birthDate) < 18 && !u.parentConsent,
    }));
  }

  /** Topilgan o'quvchini ID bo'yicha qo'shish (qidiruvdan keyin). */
  async addMemberById(id: string, actor: Actor, userId: string, confirmParentConsent?: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, phone: true } });
    if (!user) throw new NotFoundException("Bunday o'quvchi topilmadi");
    const identifier = user.email ?? user.phone;
    if (!identifier) throw new NotFoundException("Bunday o'quvchi topilmadi");
    return this.addMember(id, actor, { identifier, confirmParentConsent });
  }

  // ───────── Qo'shilish kodi ─────────
  /** Yangi kod: 6 belgi, chalkash harflarsiz (0/O, 1/I yo'q). */
  async newJoinCode(id: string, actor: Actor) {
    await this.manage(id, actor);
    const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
      const taken = await this.prisma.group.findUnique({ where: { joinCode: code }, select: { id: true } });
      if (taken) continue;
      await this.prisma.group.update({ where: { id }, data: { joinCode: code } });
      return { joinCode: code };
    }
    throw new ConflictException("Kod yaratib bo'lmadi, qayta urinib ko'ring");
  }

  async disableJoinCode(id: string, actor: Actor) {
    await this.manage(id, actor);
    await this.prisma.group.update({ where: { id }, data: { joinCode: null } });
    return { joinCode: null };
  }

  /**
   * O'quvchi kodni kiritib o'zi qo'shiladi.
   * 18 yoshgacha bo'lsa va ota-ona roziligi yozilmagan bo'lsa — o'zi
   * qo'shila olmaydi: rozilikni ustoz tasdiqlaydi (qonuniy talab).
   */
  async joinByCode(actor: Actor, rawCode: string) {
    if (actor.role !== 'STUDENT') throw new ForbiddenException("Kod orqali faqat o'quvchi qo'shiladi");
    const code = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 6) throw new BadRequestException("Kod 6 belgidan iborat");
    const group = await this.prisma.group.findUnique({ where: { joinCode: code } });
    if (!group || !group.isActive) throw new NotFoundException("Bunday kod topilmadi. Ustozdan qayta so'rang");

    const exists = await this.prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId: actor.id } } });
    if (exists) return { ok: true, groupId: group.id, already: true };

    const me = await this.prisma.user.findUnique({ where: { id: actor.id }, select: { birthDate: true, parentConsent: true, firstName: true, lastName: true } });
    if (me?.birthDate && calcAge(me.birthDate) < 18 && !me.parentConsent) {
      throw new ForbiddenException({
        code: 'PARENT_CONSENT_REQUIRED',
        message: "18 yoshga to'lmagansiz: ustozingiz sizni ota-ona roziligi bilan o'zi qo'shadi",
      });
    }
    await this.prisma.groupMember.create({ data: { groupId: group.id, userId: actor.id } });
    await this.audit('MEMBER_JOINED_BY_CODE', actor, group.id, { studentId: actor.id });
    await this.notifications.push({
      userId: group.teacherId, type: 'ACCOUNT',
      title: `${group.name}: yangi o'quvchi qo'shildi`,
      body: me ? `${me.firstName} ${me.lastName}` : undefined,
      link: `/groups/${group.id}`,
    });
    return { ok: true, groupId: group.id, already: false };
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
    const group = await this.manage(groupId, actor);
    const hw = await this.prisma.homework.create({
      data: { groupId, title: dto.title.trim(), description: dto.description.trim(), maxScore: dto.maxScore ?? 100, dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined },
    });
    const members = await this.prisma.groupMember.findMany({ where: { groupId }, select: { userId: true } });
    await this.notifications.pushMany(members.map((m) => m.userId), {
      type: 'HOMEWORK_NEW',
      title: `${group.name}: yangi uy vazifasi`,
      body: hw.title,
      link: `/groups/${groupId}`,
    });
    return hw;
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
      const r = await this.prisma.submission.update({ where: { id: sub.id }, data: { status: 'RETURNED', feedback: dto.feedback?.trim() || null, score: null } });
      await this.notifications.push({
        userId: sub.studentId, type: 'HOMEWORK_GRADED',
        title: 'Vazifa qayta ishlashga qaytarildi', body: hw.title, link: `/groups/${hw.groupId}`,
      });
      return r;
    }
    if (dto.score === undefined) throw new BadRequestException('Ball kiriting');
    if (dto.score > hw.maxScore) throw new BadRequestException(`Ball ${hw.maxScore} dan oshmasin`);
    const r = await this.prisma.submission.update({ where: { id: sub.id }, data: { status: 'GRADED', score: dto.score, feedback: dto.feedback?.trim() || null } });
    await this.notifications.push({
      userId: sub.studentId, type: 'HOMEWORK_GRADED',
      title: `Vazifa baholandi: ${dto.score}/${hw.maxScore}`, body: hw.title, link: `/groups/${hw.groupId}`,
    });
    return r;
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
