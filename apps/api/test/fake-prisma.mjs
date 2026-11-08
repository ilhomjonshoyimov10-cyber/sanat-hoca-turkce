// Testlar uchun xotiradagi soxta Prisma. Faqat ilova ishlatadigan so'rovlarni qo'llab-quvvatlaydi.
const pick = (row, select) => {
  if (!row || !select) return row ?? null;
  return Object.fromEntries(Object.keys(select).filter((k) => select[k]).map((k) => [k, row[k]]));
};
const match = (row, where) =>
  Object.entries(where).every(([k, v]) => {
    if (k === 'OR') return v.some((cond) => match(row, cond));
    if (k === 'AND') return v.every((cond) => match(row, cond));
    if (v === undefined) return true;
    if (v && typeof v === 'object' && !(v instanceof Date)) {
      // Prisma'da `{ not: null }` = "bo'sh bo'lmasin". O'qish moduli
      // nashr qilingan matnlarni aynan shunday tanlaydi.
      if ('not' in v) return (row[k] ?? null) !== (v.not ?? null);
      if ('gte' in v) return row[k] >= v.gte;
      if ('gt' in v) return row[k] > v.gt;
      if ('lte' in v) return row[k] <= v.lte;
      if ('lt' in v) return row[k] < v.lt;
      if ('in' in v) return v.in.includes(row[k]);
      if ('notIn' in v) return !v.notIn.includes(row[k]);
      if ('contains' in v) {
        const hay = String(row[k] ?? '');
        const needle = String(v.contains);
        return v.mode === 'insensitive'
          ? hay.toLowerCase().includes(needle.toLowerCase())
          : hay.includes(needle);
      }
      return false;
    }
    // Sanalarni QIYMAT bo'yicha solishtiramiz. `===` bilan ikki xil Date
    // obyekti hech qachon teng chiqmaydi — AiUsage.day kabi sana kalitlari
    // shu sababli hech topilmay qolgan edi.
    if (row[k] instanceof Date && v instanceof Date) return row[k].getTime() === v.getTime();
    return (row[k] ?? null) === (v ?? null);
  });

// { groupId_userId: { groupId, userId } } -> { groupId, userId }
const OPERATORS = ['not', 'gte', 'gt', 'lte', 'lt', 'in', 'notIn', 'contains', 'mode', 'startsWith', 'endsWith', 'equals', 'increment'];
const isOperatorObject = (v) => Object.keys(v).some((key) => OPERATORS.includes(key));
const flat = (where) =>
  Object.fromEntries(
    Object.entries(where).flatMap(([k, v]) =>
      // Qo'shma kalitni ochamiz ({userId_bookId: {...}} -> {userId, bookId}),
      // lekin operator obyektini ({not: null}) ochmaymiz — aks holda
      // "not" ustun nomiga aylanib qolardi.
      v && typeof v === 'object' && !(v instanceof Date) && !Array.isArray(v) && !isOperatorObject(v)
        ? Object.entries(v)
        : [[k, v]],
    ),
  );
const sortDesc = (rows, field = 'createdAt') => [...rows].sort((a, b) => b[field] - a[field]);


// ─────────────────────────────────────────────────────────────────────
//  Umumiy jadval (generic collection)
//
//  Loyihada 38 model bor. Har biriga qo'lda soxta jadval yozish — ko'p
//  kod va ko'p xato. Shuning uchun kitoblar, o'qish matnlari va AI
//  modellari shu umumiy yordamchi orqali ishlaydi: u Prisma'ning
//  findMany/findUnique/create/update/upsert/delete/count amallarini,
//  `select` ichidagi aloqalarni va `_count` ni qo'llab-quvvatlaydi.
// ─────────────────────────────────────────────────────────────────────

/** Aloqalarni ham hisobga oladigan select. */
function project(row, select, relations, ctx) {
  if (!row) return null;
  if (!select) return row;
  const out = {};
  for (const [key, want] of Object.entries(select)) {
    if (!want) continue;
    if (key === '_count') {
      out._count = {};
      for (const [rel, on] of Object.entries(want.select ?? {})) {
        if (!on) continue;
        out._count[rel] = resolveMany(row, rel, relations, ctx).length;
      }
      continue;
    }
    const rel = relations[key];
    if (!rel) {
      out[key] = row[key];
      continue;
    }
    const nested = typeof want === 'object' ? want : {};
    if (rel.kind === 'many') {
      let rows = resolveMany(row, key, relations, ctx);
      if (nested.orderBy) rows = sortBy(rows, nested.orderBy);
      if (nested.take) rows = rows.slice(0, nested.take);
      out[key] = rows.map((r) => project(r, nested.select, rel.relations ?? {}, ctx));
    } else {
      const target = rel.store(ctx).find((r) => r[rel.foreign ?? 'id'] === row[rel.local]);
      out[key] = project(target, nested.select, rel.relations ?? {}, ctx);
    }
  }
  return out;
}

function resolveMany(row, key, relations, ctx) {
  const rel = relations[key];
  if (!rel || rel.kind !== 'many') return [];
  return rel.store(ctx).filter((r) => r[rel.foreign] === row[rel.local ?? 'id']);
}

function sortBy(rows, orderBy) {
  const list = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...rows].sort((a, b) => {
    for (const rule of list) {
      for (const [field, dir] of Object.entries(rule)) {
        const av = a[field], bv = b[field];
        if (av === bv) continue;
        const less = av === null || av === undefined ? true : bv === null || bv === undefined ? false : av < bv;
        return (less ? -1 : 1) * (dir === 'desc' ? -1 : 1);
      }
    }
    return 0;
  });
}

/**
 * @param store   () => massiv — qatorlar qayerda turadi
 * @param options defaults: yangi qator uchun standart qiymatlar
 *                relations: { nom: {kind:'many'|'one', store, local, foreign} }
 *                uniques: [['slug'], ['textId','turkish']] — P2002 uchun
 *                pk: ['userId','bookId'] — qo'shma kalit
 */
function collection(store, nextId, ctx, { defaults = {}, relations = {}, uniques = [], pk = ['id'] } = {}) {
  const rows = () => store(ctx);
  const byWhere = (where = {}) => rows().find((r) => match(r, flat(where)));
  const breaksUnique = (candidate, ignore) =>
    uniques.some((cols) =>
      rows().some(
        (r) => r !== ignore && cols.every((c) => r[c] !== undefined && r[c] !== null && r[c] === candidate[c]),
      ),
    );

  return {
    async findMany({ where = {}, orderBy, take, skip, select } = {}) {
      let list = rows().filter((r) => match(r, flat(where)));
      if (orderBy) list = sortBy(list, orderBy);
      if (skip) list = list.slice(skip);
      if (take) list = list.slice(0, take);
      return list.map((r) => project(r, select, relations, ctx));
    },
    async findUnique({ where, select } = {}) {
      return project(byWhere(where), select, relations, ctx);
    },
    async findFirst({ where = {}, orderBy, select } = {}) {
      let list = rows().filter((r) => match(r, flat(where)));
      if (orderBy) list = sortBy(list, orderBy);
      return project(list[0], select, relations, ctx);
    },
    async create({ data, select } = {}) {
      const row = { ...defaults };
      if (pk.length === 1 && pk[0] === 'id') row.id = nextId();
      Object.assign(row, data);
      if (breaksUnique(row)) throw Object.assign(new Error('unique'), { code: 'P2002' });
      rows().push(row);
      return project(row, select, relations, ctx);
    },
    async createMany({ data, skipDuplicates } = {}) {
      let count = 0;
      for (const d of data) {
        const row = { ...defaults };
        if (pk.length === 1 && pk[0] === 'id') row.id = nextId();
        Object.assign(row, d);
        if (breaksUnique(row)) {
          if (skipDuplicates) continue;
          throw Object.assign(new Error('unique'), { code: 'P2002' });
        }
        rows().push(row);
        count++;
      }
      return { count };
    },
    async update({ where, data, select } = {}) {
      const row = byWhere(where);
      if (!row) throw Object.assign(new Error('not found'), { code: 'P2025' });
      applyData(row, data);
      return project(row, select, relations, ctx);
    },
    async upsert({ where, create, update, select } = {}) {
      const row = byWhere(where);
      if (row) {
        applyData(row, update);
        return project(row, select, relations, ctx);
      }
      const made = { ...defaults };
      if (pk.length === 1 && pk[0] === 'id') made.id = nextId();
      Object.assign(made, create);
      rows().push(made);
      return project(made, select, relations, ctx);
    },
    async delete({ where, select } = {}) {
      const row = byWhere(where);
      if (!row) throw Object.assign(new Error('not found'), { code: 'P2025' });
      const list = rows();
      list.splice(list.indexOf(row), 1);
      return project(row, select, relations, ctx);
    },
    async deleteMany({ where = {} } = {}) {
      const list = rows();
      const doomed = list.filter((r) => match(r, flat(where)));
      for (const r of doomed) list.splice(list.indexOf(r), 1);
      return { count: doomed.length };
    },
    async count({ where = {} } = {}) {
      return rows().filter((r) => match(r, flat(where))).length;
    },
  };
}

function applyData(row, data) {
  for (const [k, v] of Object.entries(data)) {
    row[k] = v && typeof v === 'object' && !(v instanceof Date) && 'increment' in v ? (row[k] ?? 0) + v.increment : v;
  }
}

export function createFakePrisma() {
  const db = { users: [], tokens: [], audits: [], leads: [], recovery: [], words: [], userWords: [], stats: [], results: [], groups: [], members: [], homework: [], submissions: [], attendance: [], messages: [], notifications: [], lessons: [], lessonAttendees: [],
    // Yangi modellar — umumiy collection() orqali ishlaydi
    books: [], bookChapters: [], bookProgress: [], readingTexts: [], readingQuestions: [], readingGlossary: [], readingAttempts: [], aiConversations: [], aiMessages: [], aiUsage: [], wordSets: [], wordSetItems: [], sentences: [], suffixDrills: [] };
  let n = 0;
  const id = () => `id${++n}`;

  const self = {
    db,
    async $connect() {},
    // Salomatlik tekshiruvi (/health) shu so'rovni yuboradi
    async $queryRaw() { return [{ ok: 1 }]; },
    async $disconnect() {},
    // Prisma ikki shaklni qo'llab-quvvatlaydi: $transaction(fn) va $transaction([...so'rovlar])
    async $transaction(arg) {
      if (typeof arg === 'function') return arg(self);
      return Promise.all(arg);
    },
    user: {
      async findMany({ where, select }) {
        return db.users.filter((u) => match(u, where)).map((u) => pick(u, select));
      },
      async findUnique({ where, select }) {
        return pick(db.users.find((u) => match(u, where)), select);
      },
      async create({ data }) {
        for (const key of ['email', 'phone']) {
          if (data[key] && db.users.some((u) => u[key] === data[key])) throw Object.assign(new Error('unique'), { code: 'P2002' });
        }
        const { stats: _stats, ...rest } = data;
        const row = {
          id: id(), email: null, phone: null, role: 'STUDENT', locale: 'UZ', avatarUrl: null, isActive: true,
          twoFactorEnabled: false, twoFactorSecret: null, twoFactorLastStep: null, leaderboardOptIn: false, parentConsent: false, failedLoginCount: 0, lockedUntil: null, lastLoginAt: null,
          createdAt: new Date(), ...rest,
        };
        db.users.push(row);
        return row;
      },
      async update({ where, data, select }) {
        const row = db.users.find((u) => match(u, where));
        for (const [k, v] of Object.entries(data)) {
          row[k] = v && typeof v === 'object' && 'increment' in v ? row[k] + v.increment : v;
        }
        return pick(row, select);
      },
      async findFirst({ where, select }) { return pick(db.users.find((u) => match(u, where)), select); },
      async count({ where = {} } = {}) { return db.users.filter((u) => match(u, where)).length; },
      async groupBy({ by }) {
        const key = by[0];
        const counts = new Map();
        for (const u of db.users) counts.set(u[key], (counts.get(u[key]) ?? 0) + 1);
        return [...counts.entries()].map(([k, c]) => ({ [key]: k, _count: { _all: c } }));
      },
    },
    notification: {
      async create({ data }) {
        const row = { id: id(), body: null, link: null, readAt: null, createdAt: new Date(Date.now() + db.notifications.length), ...data };
        db.notifications.push(row);
        return row;
      },
      async createMany({ data }) {
        for (const d of data) {
          db.notifications.push({ id: id(), body: null, link: null, readAt: null, createdAt: new Date(Date.now() + db.notifications.length), ...d });
        }
        return { count: data.length };
      },
      async findMany({ where = {}, take } = {}) {
        const rows = sortDesc(db.notifications.filter((x) => match(x, where)));
        return take ? rows.slice(0, take) : rows;
      },
      async count({ where = {} } = {}) { return db.notifications.filter((x) => match(x, where)).length; },
      async updateMany({ where, data }) {
        const rows = db.notifications.filter((x) => match(x, where));
        for (const r of rows) Object.assign(r, data);
        return { count: rows.length };
      },
    },
    message: {
      async create({ data, include }) {
        const row = { id: id(), isAnnouncement: false, isDeleted: false, createdAt: new Date(Date.now() + db.messages.length), ...data };
        db.messages.push(row);
        if (include?.sender) return { ...row, sender: pick(db.users.find((u) => u.id === row.senderId), include.sender.select) };
        return row;
      },
      async findFirst({ where, select }) { return pick(db.messages.find((m) => match(m, where)), select); },
      async findUnique({ where }) { return db.messages.find((m) => match(m, where)) ?? null; },
      async findMany({ where = {}, orderBy, take, include } = {}) {
        let rows = db.messages.filter((m) => match(m, where));
        const dir = orderBy?.createdAt ?? 'asc';
        rows = [...rows].sort((a, b) => (dir === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt));
        if (take) rows = rows.slice(0, take);
        if (include?.sender) {
          return rows.map((m) => ({ ...m, sender: pick(db.users.find((u) => u.id === m.senderId), include.sender.select) }));
        }
        return rows;
      },
      async count({ where = {} } = {}) { return db.messages.filter((m) => match(m, where)).length; },
      async update({ where, data }) {
        const row = db.messages.find((m) => match(m, where));
        Object.assign(row, data);
        return row;
      },
    },
    lesson: {
      async create({ data }) {
        const row = { id: id(), status: 'SCHEDULED', durationMin: 60, createdAt: new Date(), ...data };
        if (db.lessons.some((l) => l.roomName === row.roomName)) throw Object.assign(new Error('unique'), { code: 'P2002' });
        db.lessons.push(row);
        return row;
      },
      async findUnique({ where }) { return db.lessons.find((l) => match(l, where)) ?? null; },
      async findMany({ where = {}, take, include } = {}) {
        let rows = [...db.lessons.filter((l) => match(l, where))].sort((a, b) => b.startsAt - a.startsAt);
        if (take) rows = rows.slice(0, take);
        if (include?._count) {
          return rows.map((l) => ({ ...l, _count: { attendees: db.lessonAttendees.filter((a) => a.lessonId === l.id).length } }));
        }
        return rows;
      },
      async update({ where, data, select }) {
        const row = db.lessons.find((l) => match(l, where));
        Object.assign(row, data);
        return pick(row, select);
      },
      async count({ where = {} } = {}) { return db.lessons.filter((l) => match(l, where)).length; },
    },
    lessonAttendee: {
      async create({ data }) {
        if (db.lessonAttendees.some((a) => a.lessonId === data.lessonId && a.userId === data.userId)) {
          throw Object.assign(new Error('unique'), { code: 'P2002' });
        }
        const row = { id: id(), joinedAt: new Date(), ...data };
        db.lessonAttendees.push(row);
        return row;
      },
      async findMany({ where = {} } = {}) { return db.lessonAttendees.filter((a) => match(a, where)); },
    },
    refreshToken: {
      async create({ data }) {
        const row = { id: id(), revokedAt: null, createdAt: new Date(), ...data };
        db.tokens.push(row);
        return row;
      },
      async findUnique({ where, include, select }) {
        const row = db.tokens.find((t) => match(t, where));
        if (!row) return null;
        if (include?.user) return { ...row, user: pick(db.users.find((u) => u.id === row.userId), include.user.select) };
        return pick(row, select);
      },
      async updateMany({ where, data }) {
        const rows = db.tokens.filter((t) => match(t, where));
        rows.forEach((r) => Object.assign(r, data));
        return { count: rows.length };
      },
    },

    recoveryCode: {
      async deleteMany({ where }) {
        const keep = db.recovery.filter((r) => !match(r, where));
        const count = db.recovery.length - keep.length;
        db.recovery = keep;
        return { count };
      },
      async create({ data }) {
        db.recovery.push({ id: id(), usedAt: null, ...data });
      },
      async updateMany({ where, data }) {
        const rows = db.recovery.filter((r) => match(r, where));
        rows.forEach((r) => Object.assign(r, data));
        return { count: rows.length };
      },
    },
    word: {
      async findUnique({ where }) { return db.words.find((w) => w.id === where.id) ?? null; },
      async findMany({ orderBy } = {}) {
        const rows = [...db.words];
        if (orderBy) rows.sort((a, b) => a.level.localeCompare(b.level) || a.position - b.position);
        return rows;
      },
      async count({ where = {} } = {}) { return db.words.filter((w) => match(w, where)).length; },
    },
    userWord: {
      async findMany({ where, select }) {
        return db.userWords.filter((u) => match(u, where)).map((u) => pick(u, select));
      },
      async findUnique({ where }) {
        const { userId, wordId } = where.userId_wordId;
        return db.userWords.find((u) => u.userId === userId && u.wordId === wordId) ?? null;
      },
      async upsert({ where, create, update }) {
        const { userId, wordId } = where.userId_wordId;
        const row = db.userWords.find((u) => u.userId === userId && u.wordId === wordId);
        if (!row) {
          db.userWords.push({ correctCount: 0, wrongCount: 0, ...create });
          return;
        }
        for (const [k, v] of Object.entries(update)) {
          row[k] = v && typeof v === 'object' && 'increment' in v ? row[k] + v.increment : v;
        }
      },
    },
    userStats: {
      async upsert({ where, create }) {
        let row = db.stats.find((t) => t.userId === where.userId);
        if (!row) {
          row = { xp: 0, level: 1, streak: 0, longestStreak: 0, lastActiveDay: null, weeklyXp: 0, ...create };
          db.stats.push(row);
        }
        return row;
      },
      async update({ where, data }) {
        const row = db.stats.find((t) => t.userId === where.userId);
        Object.assign(row, data);
        return row;
      },
    },
    gameResult: {
      async create({ data }) {
        db.results.push({ id: id(), createdAt: new Date(), ...data });
      },
      // Kunlik XP chegarasini hisoblash uchun
      async findMany({ where = {}, select } = {}) {
        return db.results.filter((r) => match(r, where)).map((r) => pick(r, select));
      },
      async groupBy({ where, take }) {
        const optIn = (uid) => db.users.find((u) => u.id === uid)?.leaderboardOptIn === true;
        const totals = new Map();
        for (const r of db.results) {
          if (r.createdAt < where.createdAt.gte || (where.user?.leaderboardOptIn && !optIn(r.userId))) continue;
          totals.set(r.userId, (totals.get(r.userId) ?? 0) + r.score);
        }
        return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, take)
          .map(([userId, score]) => ({ userId, _sum: { score } }));
      },
    },

    group: {
      async create({ data }) {
        const row = { id: id(), isActive: true, schedule: null, meetingUrl: null, createdAt: new Date(Date.now() + db.groups.length), ...data };
        db.groups.push(row);
        return row;
      },
      async findUnique({ where }) { return db.groups.find((g) => match(g, where)) ?? null; },
      async findMany({ where = {}, orderBy } = {}) {
        const rows = db.groups.filter((g) => match(g, where));
        return orderBy ? sortDesc(rows) : rows;
      },
      async update({ where, data }) {
        const row = db.groups.find((g) => match(g, where));
        for (const [k, v] of Object.entries(data)) if (v !== undefined) row[k] = v;
        return row;
      },
      async count({ where = {} } = {}) { return db.groups.filter((g) => match(g, where)).length; },
    },
    groupMember: {
      async create({ data }) { db.members.push({ joinedAt: new Date(), ...data }); },
      async findUnique({ where }) { const w = flat(where); return db.members.find((m) => match(m, w)) ?? null; },
      async findMany({ where = {} } = {}) { return db.members.filter((m) => match(m, where)); },
      async delete({ where }) { const w = flat(where); db.members = db.members.filter((m) => !match(m, w)); },
    },
    homework: {
      async create({ data }) {
        const row = { id: id(), maxScore: 100, dueAt: null, createdAt: new Date(Date.now() + db.homework.length), ...data };
        db.homework.push(row);
        return row;
      },
      async findUnique({ where }) { return db.homework.find((h) => match(h, where)) ?? null; },
      async findMany({ where = {}, orderBy } = {}) {
        const rows = db.homework.filter((h) => match(h, where));
        return orderBy ? sortDesc(rows) : rows;
      },
    },
    submission: {
      async create({ data }) {
        const row = { id: id(), status: 'SUBMITTED', score: null, feedback: null, submittedAt: new Date(), ...data };
        db.submissions.push(row);
        return row;
      },
      async findUnique({ where }) { const w = flat(where); return db.submissions.find((x) => match(x, w)) ?? null; },
      async findMany({ where = {} } = {}) { return db.submissions.filter((x) => match(x, where)); },
      async update({ where, data }) { const row = db.submissions.find((x) => match(x, where)); Object.assign(row, data); return row; },
      async count({ where = {} } = {}) { return db.submissions.filter((x) => match(x, where)).length; },
    },
    attendance: {
      async findUnique({ where }) {
        const { groupId, userId, date } = where.groupId_userId_date;
        return db.attendance.find((a) => a.groupId === groupId && a.userId === userId && +a.date === +date) ?? null;
      },
      async create({ data }) { db.attendance.push({ id: id(), ...data }); },
      async update({ where, data }) { Object.assign(db.attendance.find((a) => a.id === where.id), data); },
      async findMany({ where = {} } = {}) { return db.attendance.filter((a) => match(a, where)); },
    },
    auditLog: {
      async create({ data }) {
        const row = { id: id(), ...data, createdAt: new Date(Date.now() + db.audits.length) };
        db.audits.push(row);
        return row;
      },
      async findMany({ where = {}, skip = 0, take = 50, include } = {}) {
        let rows = sortDesc(db.audits.filter((a) => match(a, where))).slice(skip, skip + take);
        if (include?.user) {
          rows = rows.map((a) => ({ ...a, user: a.userId ? pick(db.users.find((u) => u.id === a.userId), include.user.select) : null }));
        }
        return rows;
      },
      async count({ where = {} } = {}) { return db.audits.filter((a) => match(a, where)).length; },
    },
    lead: {
      async findFirst({ where, select }) {
        return pick(db.leads.find((l) => match(l, where)), select);
      },
      async create({ data }) {
        const row = { id: id(), status: 'NEW', createdAt: new Date(), ...data };
        db.leads.push(row);
        return row;
      },
      async findMany({ take }) {
        return [...db.leads].reverse().slice(0, take);
      },
      async count({ where = {} } = {}) { return db.leads.filter((l) => match(l, where)).length; },
    },
    // ───────── Yangi modellar (umumiy collection) ─────────
    book: collection((c) => c.books, id, db, {
      defaults: { author: null, description: null, kind: 'OTHER', visibility: 'PRIVATE', coverUrl: null, fileUrl: null, fileName: null, fileSize: null, mimeType: null, pageCount: null, groupId: null, createdAt: new Date(), updatedAt: new Date() },
      relations: {
        chapters: { kind: 'many', store: (c) => c.bookChapters, foreign: 'bookId', local: 'id' },
        uploadedBy: { kind: 'one', store: (c) => c.users, local: 'uploadedById' },
        progress: { kind: 'many', store: (c) => c.bookProgress, foreign: 'bookId', local: 'id' },
      },
    }),
    bookChapter: collection((c) => c.bookChapters, id, db, {
      defaults: { position: 0, startPage: null },
    }),
    bookProgress: collection((c) => c.bookProgress, id, db, {
      pk: ['userId', 'bookId'],
      defaults: { lastPage: 1, finishedAt: null, updatedAt: new Date() },
      relations: { book: { kind: 'one', store: (c) => c.books, local: 'bookId' } },
    }),
    readingText: collection((c) => c.readingTexts, id, db, {
      uniques: [['slug']],
      defaults: { topic: null, bodyUz: null, wordCount: 0, audioUrl: null, position: 0, publishedAt: null, createdAt: new Date(), updatedAt: new Date() },
      relations: {
        questions: { kind: 'many', store: (c) => c.readingQuestions, foreign: 'textId', local: 'id' },
        glossary: { kind: 'many', store: (c) => c.readingGlossary, foreign: 'textId', local: 'id' },
        attempts: { kind: 'many', store: (c) => c.readingAttempts, foreign: 'textId', local: 'id' },
      },
    }),
    readingQuestion: collection((c) => c.readingQuestions, id, db, {
      defaults: { kind: 'MULTIPLE_CHOICE', options: [], correctIndex: null, correctText: [], explanation: null, position: 0 },
    }),
    readingGlossary: collection((c) => c.readingGlossary, id, db, {
      uniques: [['textId', 'turkish']],
      defaults: { position: 0 },
    }),
    readingAttempt: collection((c) => c.readingAttempts, id, db, {
      defaults: { createdAt: new Date() },
    }),
    aiConversation: collection((c) => c.aiConversations, id, db, {
      defaults: { task: 'CHAT', title: 'Yangi suhbat', createdAt: new Date(), updatedAt: new Date() },
      relations: { messages: { kind: 'many', store: (c) => c.aiMessages, foreign: 'conversationId', local: 'id' } },
    }),
    aiMessage: collection((c) => c.aiMessages, id, db, {
      defaults: { model: null, createdAt: new Date() },
    }),
    aiUsage: collection((c) => c.aiUsage, id, db, {
      pk: ['userId', 'day'],
      defaults: { requests: 0, chars: 0 },
    }),
    wordSet: collection((c) => c.wordSets, id, db, { uniques: [['slug']], defaults: { description: null, level: null, position: 0, createdAt: new Date() } }),
    wordSetItem: collection((c) => c.wordSetItems, id, db, { pk: ['setId', 'wordId'], defaults: { position: 0 } }),
    sentence: collection((c) => c.sentences, id, db, { uniques: [['turkish']], defaults: { topic: null, note: null, verified: false, position: 0, createdAt: new Date() } }),
    suffixDrill: collection((c) => c.suffixDrills, id, db, { defaults: { alternates: [], explanation: null, rule: null, verified: false, position: 0, createdAt: new Date() } }),
  };
  return self;
}