// Testlar uchun xotiradagi soxta Prisma. Faqat ilova ishlatadigan so'rovlarni qo'llab-quvvatlaydi.

/** Har chaqiriqda kamida 1 ms keyingi vaqt: bir millisekundda yozilgan qatorlar ham tartiblansin. */
let lastTick = 0;
const tick = () => new Date((lastTick = Math.max(Date.now(), lastTick + 1)));
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
      // Massiv maydonlar uchun (Word.tags): bo'sh emasmi, ichida bormi
      if ('isEmpty' in v) return Array.isArray(row[k]) && (row[k].length === 0) === v.isEmpty;
      if ('hasSome' in v) return Array.isArray(row[k]) && v.hasSome.some((x) => row[k].includes(x));
      if ('has' in v) return Array.isArray(row[k]) && row[k].includes(v.has);
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
const OPERATORS = ['not', 'gte', 'gt', 'lte', 'lt', 'in', 'notIn', 'contains', 'mode', 'startsWith', 'endsWith', 'equals', 'increment', 'isEmpty', 'hasSome', 'has'];
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
      out[key] = rows.map((r) =>
        view(r, { select: nested.select, include: nested.include }, rel.relations ?? {}, ctx),
      );
    } else {
      const target = rel.store(ctx).find((r) => r[rel.foreign ?? 'id'] === row[rel.local]);
      out[key] = view(target, { select: nested.select, include: nested.include }, rel.relations ?? {}, ctx);
    }
  }
  return out;
}

/** Prisma `include` — "hamma oddiy maydon + sanab o'tilgan bog'lanishlar".
 *  `select` esa faqat sanab o'tilganini qaytaradi. Ikkisi ham kerak. */
function view(row, opts, relations, ctx) {
  if (!row) return null;
  if (opts.select) return project(row, opts.select, relations, ctx);
  if (opts.include) return { ...row, ...project(row, opts.include, relations, ctx) };
  return row;
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

/** OR/AND ichida ham, "bitta" bog'lanish (`user: {...}`) ustida ham ishlaydigan filtr.
 *  OR/AND/NOT bo'lmagan oddiy shart eski yo'l bilan (splitWhere/relOk) tekshiriladi. */
function hitWith(r, where, relations, ctx, splitWhere, relOk) {
  const plain = {};
  for (const [k, v] of Object.entries(where ?? {})) {
    if (k === 'OR') {
      if (!v.some((c) => hitWith(r, c, relations, ctx, splitWhere, relOk))) return false;
      continue;
    }
    if (k === 'AND') {
      const list = Array.isArray(v) ? v : [v];
      if (!list.every((c) => hitWith(r, c, relations, ctx, splitWhere, relOk))) return false;
      continue;
    }
    if (k === 'NOT') {
      if (hitWith(r, v, relations, ctx, splitWhere, relOk)) return false;
      continue;
    }
    const rel = relations[k];
    if (rel && rel.kind === 'one' && v && typeof v === 'object' && !(v instanceof Date)) {
      const target = rel.store(ctx).find((t) => t[rel.foreign ?? 'id'] === r[rel.local]);
      if (!target) return false;
      const sub = rel.relations ?? {};
      if (!hitWith(target, v, sub, ctx, (w) => ({ scalar: w, rels: [] }), () => true)) return false;
      continue;
    }
    plain[k] = v;
  }
  const { scalar, rels } = splitWhere(plain);
  return match(r, flat(scalar)) && relOk(r, rels);
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

  /** Prisma bog'lanish bo'yicha ham filtrlaydi: `{ dismissals: { none: {...} } }`.
   *  Shart oddiy maydonlar va bog'lanishlarga ajratiladi. */
  const splitWhere = (where = {}) => {
    const scalar = {};
    const rels = [];
    for (const [k, v] of Object.entries(where)) {
      if (relations[k] && v && typeof v === 'object' && !(v instanceof Date)) rels.push([k, v]);
      else scalar[k] = v;
    }
    return { scalar, rels };
  };

  const relOk = (row, rels) =>
    rels.every(([key, cond]) => {
      const children = resolveMany(row, key, relations, ctx);
      return Object.entries(cond).every(([op, sub]) => {
        const hit = (c) => match(c, flat(sub ?? {}));
        if (op === 'none') return !children.some(hit);
        if (op === 'some') return children.some(hit);
        if (op === 'every') return children.every(hit);
        return true;
      });
    });

  const hit = (r, where = {}) => hitWith(r, where, relations, ctx, splitWhere, relOk);

  const byWhere = (where = {}) => rows().find((r) => hit(r, where));
  const breaksUnique = (candidate, ignore) =>
    uniques.some((cols) =>
      rows().some(
        (r) => r !== ignore && cols.every((c) => r[c] !== undefined && r[c] !== null && r[c] === candidate[c]),
      ),
    );

  return {
    async findMany({ where = {}, orderBy, take, skip, select, include, distinct } = {}) {
      let list = rows().filter((r) => hit(r, where));
      if (orderBy) list = sortBy(list, orderBy);
      if (distinct) {
        const keys = Array.isArray(distinct) ? distinct : [distinct];
        const seen = new Set();
        list = list.filter((r) => {
          const k = keys.map((key) => String(r[key])).join('\u0000');
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      }
      if (skip) list = list.slice(skip);
      if (take) list = list.slice(0, take);
      return list.map((r) => view(r, { select, include }, relations, ctx));
    },
    async groupBy({ by }) {
      const key = by[0];
      const counts = new Map();
      for (const r of rows()) counts.set(r[key], (counts.get(r[key]) ?? 0) + 1);
      return [...counts.entries()].map(([k, c]) => ({ [key]: k, _count: { _all: c } }));
    },
    async findUnique({ where, select, include } = {}) {
      return view(byWhere(where), { select, include }, relations, ctx);
    },
    async findUniqueOrThrow({ where, select, include } = {}) {
      const row = byWhere(where);
      if (!row) throw Object.assign(new Error('not found'), { code: 'P2025' });
      return view(row, { select, include }, relations, ctx);
    },
    async findFirst({ where = {}, orderBy, select, include } = {}) {
      let list = rows().filter((r) => hit(r, where));
      if (orderBy) list = sortBy(list, orderBy);
      return view(list[0], { select, include }, relations, ctx);
    },
    async create({ data, select, include } = {}) {
      // Funksiya ko'rinishidagi standart qiymat har qatorda qayta hisoblanadi
      // (masalan createdAt: har xabarga o'z vaqti — tartiblash uchun muhim).
      const row = Object.fromEntries(Object.entries(defaults).map(([k, v]) => [k, typeof v === 'function' ? v() : v]));
      if (pk.length === 1 && pk[0] === 'id') row.id = nextId();
      Object.assign(row, withoutUndefined(data));
      if (breaksUnique(row)) throw Object.assign(new Error('unique'), { code: 'P2002' });
      rows().push(row);
      return view(row, { select, include }, relations, ctx);
    },
    async createMany({ data, skipDuplicates } = {}) {
      let count = 0;
      for (const d of data) {
        const row = Object.fromEntries(Object.entries(defaults).map(([k, v]) => [k, typeof v === 'function' ? v() : v]));
        if (pk.length === 1 && pk[0] === 'id') row.id = nextId();
        Object.assign(row, withoutUndefined(d));
        if (breaksUnique(row)) {
          if (skipDuplicates) continue;
          throw Object.assign(new Error('unique'), { code: 'P2002' });
        }
        rows().push(row);
        count++;
      }
      return { count };
    },
    async update({ where, data, select, include } = {}) {
      const row = byWhere(where);
      if (!row) throw Object.assign(new Error('not found'), { code: 'P2025' });
      applyData(row, data);
      return view(row, { select, include }, relations, ctx);
    },
    async upsert({ where, create, update, select } = {}) {
      const row = byWhere(where);
      if (row) {
        applyData(row, update);
        return project(row, select, relations, ctx);
      }
      const made = Object.fromEntries(Object.entries(defaults).map(([k, v]) => [k, typeof v === 'function' ? v() : v]));
      if (pk.length === 1 && pk[0] === 'id') made.id = nextId();
      Object.assign(made, withoutUndefined(create));
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
    async updateMany({ where = {}, data } = {}) {
      const doomed = rows().filter((r) => hit(r, where));
      for (const r of doomed) applyData(r, data);
      return { count: doomed.length };
    },
    async deleteMany({ where = {} } = {}) {
      const list = rows();
      const doomed = list.filter((r) => hit(r, where));
      for (const r of doomed) list.splice(list.indexOf(r), 1);
      return { count: doomed.length };
    },
    async count({ where = {} } = {}) {
      return rows().filter((r) => hit(r, where)).length;
    },
  };
}

/** Prisma `undefined` qiymatni "bu maydonga tegmaslik" deb tushunadi.
 *  Soxta jadval ham shunday bo'lishi SHART: aks holda DTO dagi to'ldirilmagan
 *  maydonlar (class-transformer ularni undefined qilib yaratadi) mavjud
 *  qiymatlarni o'chirib yuboradi va test haqiqatdan uzoqlashadi. */
function applyData(row, data) {
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    row[k] = v && typeof v === 'object' && !(v instanceof Date) && 'increment' in v ? (row[k] ?? 0) + v.increment : v;
  }
}

/** create/upsert uchun: undefined maydonlar standart qiymatni buzmasin. */
function withoutUndefined(data = {}) {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

export function createFakePrisma() {
  const db = { users: [], tokens: [], audits: [], leads: [], recovery: [], words: [], userWords: [], stats: [], results: [], groups: [], members: [], homework: [], submissions: [], attendance: [], messages: [], notifications: [], lessons: [], lessonAttendees: [],
    // Yangi modellar — umumiy collection() orqali ishlaydi
    books: [], bookChapters: [], bookProgress: [], readingTexts: [], readingQuestions: [], readingGlossary: [], readingAttempts: [], aiConversations: [], aiMessages: [], aiUsage: [], wordSets: [], wordSetItems: [], sentences: [], suffixDrills: [], verificationCodes: [],
    announcements: [], announcementDismissals: [], supportRequests: [], supportReplies: [], mediaItems: [],
    lessonVideos: [], leadVideos: [], leadMessages: [], liveSessions: [], liveAttendees: [],
    clozeItems: [], verbForms: [], dialogueItems: [], wordPairs: [], seenItems: [] };
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
      async findMany({ where, select, take, orderBy }) {
        let rows = db.users.filter((u) => match(u, where));
        if (orderBy) rows = sortBy(rows, orderBy);
        if (take) rows = rows.slice(0, take);
        return rows.map((u) => {
          const out = pick(u, select);
          if (select?.memberships) {
            out.memberships = db.members
              .filter((m) => m.userId === u.id)
              .map((m) => ({ groupId: m.groupId, group: { name: db.groups.find((g) => g.id === m.groupId)?.name ?? '' } }));
          }
          return out;
        });
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
          emailVerifiedAt: null, telegramVerifiedAt: null, telegramChatId: null,
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
      // Profildagi "qaysi qurilmadan kirilgan" ro'yxati shu so'rovni yuboradi
      async findMany({ where = {}, orderBy, take, select } = {}) {
        let list = db.tokens.filter((t) => match(t, where));
        if (orderBy) list = sortBy(list, orderBy);
        if (take) list = list.slice(0, take);
        return list.map((t) => pick(t, select));
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
    // Lug'at moduli to'liq CRUD, groupBy va distinct ishlatadi, shuning
    // uchun qo'lda yozilgan soxta jadval o'rniga umumiysini qo'yamiz.
    word: collection((c) => c.words, id, db, {
      uniques: [['turkish', 'uzbek']],
      defaults: {
        russian: null, exampleTr: null, exampleUz: null, exampleRu: null, audioUrl: null,
        category: null, position: 0, partOfSpeech: null, pronunciation: null, tags: [],
        frequency: null, verified: false, notes: null, createdAt: new Date(), updatedAt: new Date(),
      },
    }),
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
          if (r.createdAt < where.createdAt.gte || (where.createdAt.lt && r.createdAt >= where.createdAt.lt)) continue;
          if (where.user?.leaderboardOptIn && !optIn(r.userId)) continue;
          totals.set(r.userId, (totals.get(r.userId) ?? 0) + r.score);
        }
        return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, take ?? undefined)
          .map(([userId, score]) => ({ userId, _sum: { score } }));
      },
      async aggregate({ where }) {
        const rows = db.results.filter((r) => match(r, where));
        return { _sum: { score: rows.reduce((n, r) => n + r.score, 0) } };
      },
    },

    group: {
      async create({ data }) {
        const row = { id: id(), isActive: true, schedule: null, meetingUrl: null, joinCode: null, createdAt: new Date(Date.now() + db.groups.length), ...data };
        db.groups.push(row);
        return row;
      },
      async findUnique({ where }) { return db.groups.find((g) => match(g, where)) ?? null; },
      async findMany({ where = {}, orderBy } = {}) {
        const rows = db.groups.filter((g) => match(g, where));
        return orderBy ? sortDesc(rows) : rows;
      },
      async findFirst({ where = {} } = {}) { return db.groups.find((g) => match(g, where)) ?? null; },
      async update({ where, data }) {
        const row = db.groups.find((g) => match(g, where));
        if (!row) throw Object.assign(new Error('not found'), { code: 'P2025' });
        if (data.joinCode && db.groups.some((g) => g !== row && g.joinCode === data.joinCode)) {
          throw Object.assign(new Error('unique'), { code: 'P2002' });
        }
        for (const [k, v] of Object.entries(data)) if (v !== undefined) row[k] = v;
        return row;
      },
      async count({ where = {} } = {}) { return db.groups.filter((g) => match(g, where)).length; },
    },
    groupMember: {
      async create({ data }) { db.members.push({ joinedAt: new Date(), ...data }); },
      async findUnique({ where }) { const w = flat(where); return db.members.find((m) => match(m, w)) ?? null; },
      async findMany({ where = {}, select } = {}) {
        const rows = db.members.filter((m) => match(m, where));
        if (!select?.group) return rows;
        return rows.map((m) => ({ ...m, group: pick(db.groups.find((g) => g.id === m.groupId), select.group.select) }));
      },
      async count({ where = {} } = {}) { return db.members.filter((m) => match(m, where)).length; },
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
    lead: collection((c) => c.leads, id, db, {
      defaults: { status: 'NEW', level: null, message: null, userId: null, createdAt: new Date() },
      relations: {
        user: { kind: 'one', store: (c) => c.users, local: 'userId' },
        videos: {
          kind: 'many', store: (c) => c.leadVideos, foreign: 'leadId', local: 'id',
          relations: { video: { kind: 'one', store: (c) => c.lessonVideos, local: 'videoId' } },
        },
        messages: {
          kind: 'many', store: (c) => c.leadMessages, foreign: 'leadId', local: 'id',
          relations: { sender: { kind: 'one', store: (c) => c.users, local: 'senderId' } },
        },
      },
    }),
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
      defaults: { task: 'CHAT', title: 'Yangi suhbat', createdAt: tick, updatedAt: tick },
      relations: {
        messages: { kind: 'many', store: (c) => c.aiMessages, foreign: 'conversationId', local: 'id' },
        user: { kind: 'one', store: (c) => c.users, local: 'userId' },
      },
    }),
    aiMessage: collection((c) => c.aiMessages, id, db, {
      defaults: { model: null, error: null, createdAt: tick },
    }),
    aiUsage: collection((c) => c.aiUsage, id, db, {
      pk: ['userId', 'day'],
      defaults: { requests: 0, chars: 0 },
    }),
    wordSet: collection((c) => c.wordSets, id, db, {
      uniques: [['slug']],
      defaults: { description: null, level: null, position: 0, createdAt: new Date() },
      relations: { items: { kind: 'many', store: (c) => c.wordSetItems, foreign: 'setId', local: 'id' } },
    }),
    wordSetItem: collection((c) => c.wordSetItems, id, db, { pk: ['setId', 'wordId'], defaults: { position: 0 } }),
    sentence: collection((c) => c.sentences, id, db, { uniques: [['turkish']], defaults: { topic: null, note: null, verified: false, position: 0, createdAt: new Date() } }),
    suffixDrill: collection((c) => c.suffixDrills, id, db, { defaults: { alternates: [], explanation: null, rule: null, verified: false, position: 0, createdAt: new Date() } }),
    verificationCode: collection((c) => c.verificationCodes, id, db, {
      defaults: { attempts: 0, usedAt: null, createdAt: new Date() },
    }),
    mediaItem: collection((c) => c.mediaItems, id, db, {
      uniques: [['seedKey']],
      defaults: {
        description: '', descI18n: null, level: null, videoId: null, playlistId: null,
        channel: null, ytTitle: null, thumbnail: null, checkedAt: null, checkNote: null,
        position: 0, published: true, seedKey: null, createdById: null,
        createdAt: new Date(), updatedAt: new Date(),
      },
    }),
    announcement: collection((c) => c.announcements, id, db, {
      defaults: {
        kind: 'INFO', audience: 'ALL', imageUrl: null, linkUrl: null, linkLabel: null,
        dismissible: true, pinned: false, startsAt: new Date(), endsAt: null, isActive: true,
        createdAt: new Date(), updatedAt: new Date(),
      },
      relations: {
        createdBy: { kind: 'one', store: (c) => c.users, local: 'createdById' },
        dismissals: { kind: 'many', store: (c) => c.announcementDismissals, foreign: 'announcementId', local: 'id' },
      },
    }),
    announcementDismissal: collection((c) => c.announcementDismissals, id, db, {
      pk: ['announcementId', 'userId'],
      defaults: { dismissedAt: new Date() },
    }),
    supportRequest: collection((c) => c.supportRequests, id, db, {
      defaults: { topic: 'OTHER', status: 'OPEN', handledById: null, createdAt: new Date(), updatedAt: new Date() },
      relations: {
        user: { kind: 'one', store: (c) => c.users, local: 'userId' },
        replies: { kind: 'many', store: (c) => c.supportReplies, foreign: 'requestId', local: 'id' },
      },
    }),
    supportReply: collection((c) => c.supportReplies, id, db, {
      defaults: { createdAt: new Date() },
      relations: { author: { kind: 'one', store: (c) => c.users, local: 'authorId' } },
    }),
    lessonVideo: collection((c) => c.lessonVideos, id, db, {
      defaults: { description: null, coverUrl: null, level: null, position: 0, isActive: true, isDefault: false, createdAt: tick, updatedAt: tick },
      relations: { assignments: { kind: 'many', store: (c) => c.leadVideos, foreign: 'videoId', local: 'id' } },
    }),
    leadVideo: collection((c) => c.leadVideos, id, db, {
      uniques: [['leadId', 'videoId']],
      defaults: { assignedAt: new Date(), watchedAt: null },
      relations: { video: { kind: 'one', store: (c) => c.lessonVideos, local: 'videoId' } },
    }),
    leadMessage: collection((c) => c.leadMessages, id, db, {
      defaults: { readAt: null, createdAt: new Date() },
      relations: { sender: { kind: 'one', store: (c) => c.users, local: 'senderId' } },
    }),
    liveSession: collection((c) => c.liveSessions, id, db, {
      uniques: [['roomName']],
      defaults: {
        description: null, status: 'SCHEDULED', durationMin: 60, level: null, isPublic: false,
        groupId: null, provider: 'JITSI', externalUrl: null, maxParticipants: 100, createdAt: tick, updatedAt: tick,
      },
      relations: {
        host: { kind: 'one', store: (c) => c.users, local: 'hostId' },
        group: { kind: 'one', store: (c) => c.groups, local: 'groupId' },
        attendees: { kind: 'many', store: (c) => c.liveAttendees, foreign: 'sessionId', local: 'id' },
      },
    }),
    liveAttendee: collection((c) => c.liveAttendees, id, db, {
      uniques: [['sessionId', 'userId']],
      defaults: { joinedAt: new Date() },
    }),
    clozeItem: collection((c) => c.clozeItems, id, db, {
      uniques: [['masked', 'answer']],
      defaults: { options: [], uzbek: null, explanation: null, topic: null, verified: false, position: 0, createdAt: new Date() },
    }),
    verbForm: collection((c) => c.verbForms, id, db, {
      uniques: [['infinitive', 'person', 'tense', 'negative']],
      defaults: { negative: false, uzbek: null, explanation: null, verified: false, position: 0, createdAt: new Date() },
    }),
    dialogueItem: collection((c) => c.dialogueItems, id, db, {
      uniques: [['prompt', 'answer']],
      defaults: { options: [], situation: null, uzbek: null, verified: false, position: 0, createdAt: new Date() },
    }),
    wordPair: collection((c) => c.wordPairs, id, db, {
      uniques: [['kind', 'first', 'second']],
      defaults: { uzbek: null, verified: false, position: 0, createdAt: new Date() },
    }),
    seenItem: collection((c) => c.seenItems, id, db, {
      pk: ['userId', 'kind', 'itemId'],
      defaults: { times: 1, seenAt: new Date() },
    }),
  };
  return self;
}