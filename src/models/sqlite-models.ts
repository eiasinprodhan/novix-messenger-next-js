import { getDB } from '../lib/sqlite';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export function generateId(): string {
  return crypto.randomBytes(12).toString('hex'); // 24-char hex string, identical to MongoDB ObjectId
}

// ─── QueryChain Helper for Mongoose Compatibility ──────────────────────────
export class QueryChain<T> implements PromiseLike<T> {
  public selectFields: string[] = [];
  public sortCriteria: any = null;
  public limitVal: number | null = null;
  public skipVal: number | null = null;
  public populateFields: any[] = [];

  constructor(private executor: (chain: QueryChain<T>) => Promise<T>) {}

  select(fields: string | any): this {
    if (typeof fields === 'string') {
      this.selectFields.push(...fields.split(' ').filter(Boolean));
    }
    return this;
  }

  populate(...args: any[]): this {
    this.populateFields.push(args);
    return this;
  }

  sort(criteria: any): this {
    this.sortCriteria = criteria;
    return this;
  }

  limit(n: number): this {
    this.limitVal = n;
    return this;
  }

  skip(n: number): this {
    this.skipVal = n;
    return this;
  }

  lean(): this {
    return this;
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.executor(this).then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<T | TResult> {
    return this.executor(this).catch(onrejected);
  }
}

// ─── User Model ────────────────────────────────────────────────────────────
export class UserModel {
  public _id: string;
  public id: string;
  public name: string;
  public username: string;
  public email: string;
  public password?: string;
  public bio?: string;
  public avatar?: string;
  public gender?: string | null;
  public country?: string;
  public birthday?: Date | null;
  public isVerified: boolean;
  public verificationCode?: string;
  public verificationCodeExpires?: Date;
  public verificationResendAt?: Date;
  public resetPasswordCode?: string;
  public resetPasswordCodeExpires?: Date;
  public pendingEmail?: string;
  public pendingEmailCode?: string;
  public pendingEmailCodeExpires?: Date;
  public pendingEmailResendAt?: Date;
  public googleId?: string;
  public lastSeen: Date;
  public lastActiveAt: Date;
  public isOnline: boolean;
  public fcmToken?: string;
  public role: string;
  public notificationsEnabled: boolean;
  public lastSeenPrivacy: string;
  public readReceiptsEnabled: boolean;
  public typingIndicatorsEnabled: boolean;
  public publicKey?: string | null;
  public hiddenChats: string[];
  public devices: any[];
  public createdAt: Date;
  public updatedAt: Date;

  private _originalPassword?: string;

  constructor(data: any = {}) {
    this._id = data._id?.toString() || data.id?.toString() || generateId();
    this.id = this._id;
    this.name = data.name || '';
    this.username = (data.username || '').toLowerCase();
    this.email = (data.email || '').toLowerCase();
    this.password = data.password;
    this._originalPassword = data.password;
    this.bio = data.bio || '';
    this.avatar = data.avatar || '';
    this.gender = data.gender || null;
    this.country = data.country || '';
    this.birthday = data.birthday ? new Date(data.birthday) : null;
    this.isVerified = Boolean(data.isVerified);
    this.verificationCode = data.verificationCode;
    this.verificationCodeExpires = data.verificationCodeExpires ? new Date(data.verificationCodeExpires) : undefined;
    this.verificationResendAt = data.verificationResendAt ? new Date(data.verificationResendAt) : undefined;
    this.resetPasswordCode = data.resetPasswordCode;
    this.resetPasswordCodeExpires = data.resetPasswordCodeExpires ? new Date(data.resetPasswordCodeExpires) : undefined;
    this.pendingEmail = data.pendingEmail;
    this.pendingEmailCode = data.pendingEmailCode;
    this.pendingEmailCodeExpires = data.pendingEmailCodeExpires ? new Date(data.pendingEmailCodeExpires) : undefined;
    this.pendingEmailResendAt = data.pendingEmailResendAt ? new Date(data.pendingEmailResendAt) : undefined;
    this.googleId = data.googleId;
    this.lastSeen = data.lastSeen ? new Date(data.lastSeen) : new Date();
    this.lastActiveAt = data.lastActiveAt ? new Date(data.lastActiveAt) : new Date();
    this.isOnline = Boolean(data.isOnline);
    this.fcmToken = data.fcmToken;
    this.role = data.role || 'user';
    this.notificationsEnabled = data.notificationsEnabled !== false;
    this.lastSeenPrivacy = data.lastSeenPrivacy || 'everyone';
    this.readReceiptsEnabled = data.readReceiptsEnabled !== false;
    this.typingIndicatorsEnabled = data.typingIndicatorsEnabled !== false;
    this.publicKey = data.publicKey || null;
    this.hiddenChats = Array.isArray(data.hiddenChats) ? data.hiddenChats : [];
    this.devices = Array.isArray(data.devices) ? data.devices : [];
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  isModified(field: string): boolean {
    if (field === 'password') {
      return this.password !== this._originalPassword;
    }
    return true;
  }

  toString(): string {
    return this.id;
  }

  async comparePassword(candidate: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidate, this.password);
  }

  async save(): Promise<this> {
    const db = getDB();
    const existing = db.prepare('SELECT id, password FROM users WHERE id = ?').get(this.id) as any;

    let passwordToSave: string | null = null;
    if (this.password !== undefined && this.password !== null && this.password !== '') {
      if (!this.password.startsWith('$2')) {
        this.password = await bcrypt.hash(this.password, 10);
      }
      passwordToSave = this.password;
      this._originalPassword = this.password;
    } else if (this._originalPassword) {
      passwordToSave = this._originalPassword;
    } else if (existing && existing.password) {
      passwordToSave = existing.password;
    }

    const now = new Date().toISOString();
    this.updatedAt = new Date();

    if (!existing) {
      db.prepare(`
        INSERT INTO users (
          id, name, username, email, password, bio, avatar, gender, country, birthday,
          is_verified, verification_code, verification_code_expires, verification_resend_at,
          reset_password_code, reset_password_code_expires, pending_email, pending_email_code,
          pending_email_code_expires, pending_email_resend_at, google_id, last_seen, last_active_at,
          is_online, fcm_token, role, notifications_enabled, last_seen_privacy,
          read_receipts_enabled, typing_indicators_enabled, public_key, hidden_chats,
          devices_json, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?
        )
      `).run(
        this.id, this.name, this.username, this.email, passwordToSave, this.bio || '', this.avatar || '', this.gender || null, this.country || '', this.birthday ? this.birthday.toISOString() : null,
        this.isVerified ? 1 : 0, this.verificationCode || null, this.verificationCodeExpires ? this.verificationCodeExpires.toISOString() : null, this.verificationResendAt ? this.verificationResendAt.toISOString() : null,
        this.resetPasswordCode || null, this.resetPasswordCodeExpires ? this.resetPasswordCodeExpires.toISOString() : null, this.pendingEmail || null, this.pendingEmailCode || null,
        this.pendingEmailCodeExpires ? this.pendingEmailCodeExpires.toISOString() : null, this.pendingEmailResendAt ? this.pendingEmailResendAt.toISOString() : null, this.googleId || null, this.lastSeen.toISOString(), this.lastActiveAt.toISOString(),
        this.isOnline ? 1 : 0, this.fcmToken || null, this.role, this.notificationsEnabled ? 1 : 0, this.lastSeenPrivacy,
        this.readReceiptsEnabled ? 1 : 0, this.typingIndicatorsEnabled ? 1 : 0, this.publicKey || null, JSON.stringify(this.hiddenChats),
        JSON.stringify(this.devices), this.createdAt.toISOString(), now
      );
    } else {
      db.prepare(`
        UPDATE users SET
          name = ?, username = ?, email = ?, password = ?, bio = ?, avatar = ?, gender = ?, country = ?, birthday = ?,
          is_verified = ?, verification_code = ?, verification_code_expires = ?, verification_resend_at = ?,
          reset_password_code = ?, reset_password_code_expires = ?, pending_email = ?, pending_email_code = ?,
          pending_email_code_expires = ?, pending_email_resend_at = ?, google_id = ?, last_seen = ?, last_active_at = ?,
          is_online = ?, fcm_token = ?, role = ?, notifications_enabled = ?, last_seen_privacy = ?,
          read_receipts_enabled = ?, typing_indicators_enabled = ?, public_key = ?, hidden_chats = ?,
          devices_json = ?, updated_at = ?
        WHERE id = ?
      `).run(
        this.name, this.username, this.email, passwordToSave, this.bio || '', this.avatar || '', this.gender || null, this.country || '', this.birthday ? this.birthday.toISOString() : null,
        this.isVerified ? 1 : 0, this.verificationCode || null, this.verificationCodeExpires ? this.verificationCodeExpires.toISOString() : null, this.verificationResendAt ? this.verificationResendAt.toISOString() : null,
        this.resetPasswordCode || null, this.resetPasswordCodeExpires ? this.resetPasswordCodeExpires.toISOString() : null, this.pendingEmail || null, this.pendingEmailCode || null,
        this.pendingEmailCodeExpires ? this.pendingEmailCodeExpires.toISOString() : null, this.pendingEmailResendAt ? this.pendingEmailResendAt.toISOString() : null, this.googleId || null, this.lastSeen.toISOString(), this.lastActiveAt.toISOString(),
        this.isOnline ? 1 : 0, this.fcmToken || null, this.role, this.notificationsEnabled ? 1 : 0, this.lastSeenPrivacy,
        this.readReceiptsEnabled ? 1 : 0, this.typingIndicatorsEnabled ? 1 : 0, this.publicKey || null, JSON.stringify(this.hiddenChats),
        JSON.stringify(this.devices), now, this.id
      );
    }
    return this;
  }

  toObject(): any {
    const obj: any = { ...this };
    delete obj._originalPassword;
    return obj;
  }

  toJSON(): any {
    const obj = this.toObject();
    delete obj.password;
    delete obj.verificationCode;
    delete obj.verificationCodeExpires;
    delete obj.googleId;
    return obj;
  }

  static fromRow(row: any, selectPassword = false): UserModel | null {
    if (!row) return null;
    const user = new UserModel({
      _id: row.id,
      id: row.id,
      name: row.name,
      username: row.username,
      email: row.email,
      password: selectPassword ? row.password : undefined,
      bio: row.bio,
      avatar: row.avatar,
      gender: row.gender,
      country: row.country,
      birthday: row.birthday,
      isVerified: Boolean(row.is_verified),
      verificationCode: row.verification_code,
      verificationCodeExpires: row.verification_code_expires,
      verificationResendAt: row.verification_resend_at,
      resetPasswordCode: row.reset_password_code,
      resetPasswordCodeExpires: row.reset_password_code_expires,
      pendingEmail: row.pending_email,
      pendingEmailCode: row.pending_email_code,
      pendingEmailCodeExpires: row.pending_email_code_expires,
      pendingEmailResendAt: row.pending_email_resend_at,
      googleId: row.google_id,
      lastSeen: row.last_seen,
      lastActiveAt: row.last_active_at,
      isOnline: Boolean(row.is_online),
      fcmToken: row.fcm_token,
      role: row.role,
      notificationsEnabled: Boolean(row.notifications_enabled),
      lastSeenPrivacy: row.last_seen_privacy,
      readReceiptsEnabled: Boolean(row.read_receipts_enabled),
      typingIndicatorsEnabled: Boolean(row.typing_indicators_enabled),
      publicKey: row.public_key,
      hiddenChats: JSON.parse(row.hidden_chats || '[]'),
      devices: JSON.parse(row.devices_json || '[]'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
    user._originalPassword = row.password;
    return user;
  }

  static findById(id: any): QueryChain<UserModel | null> {
    return new QueryChain(async (chain) => {
      if (!id) return null;
      const strId = id?._id?.toString() || id?.toString();
      const db = getDB();
      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(strId);
      const withPassword = chain.selectFields.includes('+password') || chain.selectFields.includes('password');
      return this.fromRow(row, withPassword);
    });
  }

  static findOne(query: any = {}): QueryChain<UserModel | null> {
    return new QueryChain(async (chain) => {
      const db = getDB();
      const withPassword = chain.selectFields.includes('+password') || chain.selectFields.includes('password');

      if (query.email) {
        const row = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(query.email.toLowerCase());
        return this.fromRow(row, withPassword);
      }
      if (query.username) {
        const row = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(query.username.toLowerCase());
        return this.fromRow(row, withPassword);
      }
      if (query._id || query.id) {
        const strId = (query._id || query.id)?.toString();
        const row = db.prepare('SELECT * FROM users WHERE id = ?').get(strId);
        return this.fromRow(row, withPassword);
      }
      if (query.$or && Array.isArray(query.$or)) {
        for (const cond of query.$or) {
          if (cond.email) {
            const row = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(cond.email.toLowerCase());
            if (row) return this.fromRow(row, withPassword);
          }
          if (cond.username) {
            const row = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(cond.username.toLowerCase());
            if (row) return this.fromRow(row, withPassword);
          }
          if (cond._id || cond.id) {
            const strId = (cond._id || cond.id)?.toString();
            const row = db.prepare('SELECT * FROM users WHERE id = ?').get(strId);
            if (row) return this.fromRow(row, withPassword);
          }
        }
      }
      if (query.googleId) {
        const row = db.prepare('SELECT * FROM users WHERE google_id = ?').get(query.googleId);
        return this.fromRow(row, withPassword);
      }
      if (query.verificationCode) {
        const row = db.prepare('SELECT * FROM users WHERE verification_code = ?').get(query.verificationCode);
        return this.fromRow(row, withPassword);
      }
      if (query.resetPasswordCode) {
        const row = db.prepare('SELECT * FROM users WHERE reset_password_code = ?').get(query.resetPasswordCode);
        return this.fromRow(row, withPassword);
      }
      return null;
    });
  }

  static find(query: any = {}): QueryChain<UserModel[]> {
    return new QueryChain(async (chain) => {
      const db = getDB();
      let sql = 'SELECT * FROM users WHERE 1=1';
      const params: any[] = [];

      if (query.role) {
        if (typeof query.role === 'object' && query.role.$ne) {
          sql += ' AND role != ?';
          params.push(query.role.$ne);
        } else {
          sql += ' AND role = ?';
          params.push(query.role);
        }
      }

      if (query._id && query._id.$in && Array.isArray(query._id.$in)) {
        const placeholders = query._id.$in.map(() => '?').join(',');
        sql += ` AND id IN (${placeholders})`;
        params.push(...query._id.$in.map((i: any) => i.toString()));
      }

      if (query.isOnline !== undefined) {
        sql += ' AND is_online = ?';
        params.push(query.isOnline ? 1 : 0);
      }

      if (chain.sortCriteria) {
        const sortEntries = Object.entries(chain.sortCriteria);
        if (sortEntries.length > 0) {
          const [field, dir] = sortEntries[0];
          const col = field === 'createdAt' ? 'created_at' : (field === 'lastSeen' ? 'last_seen' : field);
          sql += ` ORDER BY ${col} ${dir === -1 || dir === 'desc' ? 'DESC' : 'ASC'}`;
        }
      } else {
        sql += ' ORDER BY created_at DESC';
      }

      if (chain.limitVal) {
        sql += ` LIMIT ${chain.limitVal}`;
      }
      if (chain.skipVal) {
        sql += ` OFFSET ${chain.skipVal}`;
      }

      const rows = db.prepare(sql).all(...params);
      const withPassword = chain.selectFields.includes('+password') || chain.selectFields.includes('password');
      return rows.map((r) => this.fromRow(r, withPassword) as UserModel);
    });
  }

  static async create(data: any): Promise<UserModel> {
    const user = new UserModel(data);
    await user.save();
    return user;
  }

  static findByIdAndUpdate(id: any, update: any, options: any = {}): QueryChain<UserModel | null> {
    return new QueryChain(async (chain) => {
      const user = await this.findById(id);
      if (!user) return null;

      const applyObj = (target: any) => {
        for (const [k, v] of Object.entries(target)) {
          if (
            k in user ||
            k === 'publicKey' ||
            k === 'fcmToken' ||
            k === 'gender' ||
            k === 'country' ||
            k === 'birthday' ||
            k === 'bio' ||
            k === 'avatar'
          ) {
            (user as any)[k] = v;
          }
        }
      };

      if (update.$set) applyObj(update.$set);
      else applyObj(update);

      await user.save();
      return user;
    });
  }

  static async updateMany(query: any, update: any): Promise<{ modifiedCount: number }> {
    const db = getDB();
    if (update.isOnline !== undefined) {
      const info = db.prepare('UPDATE users SET is_online = ?').run(update.isOnline ? 1 : 0);
      return { modifiedCount: info.changes };
    }
    return { modifiedCount: 0 };
  }

  static async countDocuments(query: any = {}): Promise<number> {
    const db = getDB();
    let sql = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const params: any[] = [];

    if (query.role) {
      if (typeof query.role === 'object' && query.role.$ne) {
        sql += ' AND role != ?';
        params.push(query.role.$ne);
      } else {
        sql += ' AND role = ?';
        params.push(query.role);
      }
    }
    if (query.isOnline !== undefined) {
      sql += ' AND is_online = ?';
      params.push(query.isOnline ? 1 : 0);
    }
    if (query.isVerified !== undefined) {
      sql += ' AND is_verified = ?';
      params.push(query.isVerified ? 1 : 0);
    }

    const row: any = db.prepare(sql).get(...params);
    return row?.count || 0;
  }

  static async aggregate(pipeline: any[]): Promise<any[]> {
    const db = getDB();
    const rows = db.prepare(`
      SELECT substr(created_at, 1, 10) as _id, count(*) as count
      FROM users
      GROUP BY substr(created_at, 1, 10)
    `).all();
    return rows;
  }
}

// ─── Friendship Model ──────────────────────────────────────────────────────
export class FriendshipModel {
  public _id: string;
  public id: string;
  public requester: any;
  public recipient: any;
  public status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: any = {}) {
    this._id = data._id?.toString() || data.id?.toString() || generateId();
    this.id = this._id;
    this.requester = data.requester;
    this.recipient = data.recipient;
    this.status = data.status || 'pending';
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  async save(): Promise<this> {
    const db = getDB();
    const now = new Date().toISOString();
    const reqId = this.requester?._id?.toString() || this.requester?.toString();
    const recId = this.recipient?._id?.toString() || this.recipient?.toString();

    db.prepare(`
      INSERT INTO friendships (id, requester_id, recipient_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at
    `).run(this.id, reqId, recId, this.status, this.createdAt.toISOString(), now);

    return this;
  }

  toString(): string {
    return this.id;
  }

  toObject(): any {
    return { ...this };
  }

  toJSON(): any {
    return this.toObject();
  }

  static find(query: any = {}): QueryChain<any[]> {
    return new QueryChain(async (chain) => {
      const db = getDB();
      let sql = 'SELECT * FROM friendships WHERE 1=1';
      const params: any[] = [];

      if (query._id) {
        sql += ' AND id = ?';
        params.push(query._id.toString());
      } else if (query.id) {
        sql += ' AND id = ?';
        params.push(query.id.toString());
      }

      if (query.$or && Array.isArray(query.$or)) {
        const orClauses: string[] = [];
        for (const c of query.$or) {
          if (c.requester && c.status) {
            orClauses.push('(requester_id = ? AND status = ?)');
            params.push(c.requester.toString(), c.status);
          } else if (c.recipient && c.status) {
            orClauses.push('(recipient_id = ? AND status = ?)');
            params.push(c.recipient.toString(), c.status);
          } else if (c.requester && c.recipient) {
            orClauses.push('(requester_id = ? AND recipient_id = ?)');
            params.push(c.requester.toString(), c.recipient.toString());
          }
        }
        if (orClauses.length > 0) {
          sql += ` AND (${orClauses.join(' OR ')})`;
        }
      } else if (query.recipient && query.status) {
        sql += ' AND recipient_id = ? AND status = ?';
        params.push(query.recipient.toString(), query.status);
      } else if (query.requester && query.status) {
        sql += ' AND requester_id = ? AND status = ?';
        params.push(query.requester.toString(), query.status);
      } else if (query.status) {
        sql += ' AND status = ?';
        params.push(query.status);
      }

      sql += ' ORDER BY created_at DESC';
      const rows = db.prepare(sql).all(...params);

      const results = await Promise.all(
        rows.map(async (r: any) => {
          const requester = await UserModel.findById(r.requester_id);
          const recipient = await UserModel.findById(r.recipient_id);
          return new FriendshipModel({
            _id: r.id,
            id: r.id,
            requester,
            recipient,
            status: r.status,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          });
        })
      );
      return results;
    });
  }

  static findOne(query: any): QueryChain<any> {
    return new QueryChain(async () => {
      const list = await this.find(query);
      return list.length > 0 ? list[0] : null;
    });
  }

  static findById(id: string): QueryChain<any> {
    return new QueryChain(async () => {
      const db = getDB();
      const r: any = db.prepare('SELECT * FROM friendships WHERE id = ?').get(id);
      if (!r) return null;
      const requester = await UserModel.findById(r.requester_id);
      const recipient = await UserModel.findById(r.recipient_id);
      return new FriendshipModel({
        _id: r.id,
        id: r.id,
        requester: requester || r.requester_id,
        recipient: recipient || r.recipient_id,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      });
    });
  }

  static async findByIdAndDelete(id: string): Promise<any> {
    const db = getDB();
    const existing = await this.findById(id);
    db.prepare('DELETE FROM friendships WHERE id = ?').run(id);
    return existing;
  }

  static async create(data: any): Promise<any> {
    const friendship = new FriendshipModel(data);
    await friendship.save();
    return this.findOne({ _id: friendship.id });
  }

  static async findByIdAndUpdate(id: string, update: any): Promise<any> {
    const db = getDB();
    const status = update.status || (update.$set && update.$set.status);
    if (status) {
      db.prepare('UPDATE friendships SET status = ?, updated_at = ? WHERE id = ?').run(
        status,
        new Date().toISOString(),
        id
      );
    }
    return this.findOne({ _id: id });
  }

  static async deleteOne(query: any): Promise<any> {
    const db = getDB();
    if (query._id || query.id) {
      db.prepare('DELETE FROM friendships WHERE id = ?').run(query._id || query.id);
    }
    return { acknowledged: true };
  }

  static async countDocuments(query: any = {}): Promise<number> {
    const db = getDB();
    let sql = 'SELECT COUNT(*) as count FROM friendships WHERE 1=1';
    const params: any[] = [];
    if (query.status) {
      sql += ' AND status = ?';
      params.push(query.status);
    }
    const row: any = db.prepare(sql).get(...params);
    return row?.count || 0;
  }
}

// ─── Group Model ───────────────────────────────────────────────────────────
export class GroupModel {
  public _id: string;
  public id: string;
  public name: string;
  public description: string;
  public avatar: string;
  public createdBy: any;
  public members: any[];
  public isActive: boolean;
  public inviteToken?: string;
  public slowModeSeconds: number;
  public permissions: any;
  public autoDeleteSeconds: number;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: any = {}) {
    this._id = data._id?.toString() || data.id?.toString() || generateId();
    this.id = this._id;
    this.name = data.name || '';
    this.description = data.description || '';
    this.avatar = data.avatar || '';
    this.createdBy = data.createdBy;
    this.members = Array.isArray(data.members) ? data.members : [];
    this.isActive = data.isActive !== false;
    this.inviteToken = data.inviteToken || generateId();
    this.slowModeSeconds = data.slowModeSeconds || 0;
    this.permissions = data.permissions || {
      canSendMessages: true,
      canSendMedia: true,
      canAddMembers: true,
      canPinMessages: false,
    };
    this.autoDeleteSeconds = data.autoDeleteSeconds || 0;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  async save(): Promise<this> {
    const db = getDB();
    const now = new Date().toISOString();
    const creatorId = this.createdBy?._id?.toString() || this.createdBy?.toString();

    db.prepare(`
      INSERT INTO groups (
        id, name, description, avatar, created_by, is_active, invite_token,
        slow_mode_seconds, permissions_json, auto_delete_seconds,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        avatar = excluded.avatar,
        created_by = excluded.created_by,
        is_active = excluded.is_active,
        slow_mode_seconds = excluded.slow_mode_seconds,
        permissions_json = excluded.permissions_json,
        auto_delete_seconds = excluded.auto_delete_seconds,
        updated_at = excluded.updated_at
    `).run(
      this.id, this.name, this.description, this.avatar, creatorId, this.isActive ? 1 : 0, this.inviteToken,
      this.slowModeSeconds, JSON.stringify(this.permissions), this.autoDeleteSeconds,
      this.createdAt.toISOString(), now
    );

    if (Array.isArray(this.members)) {
      const currentUids = this.members
        .map((m: any) => m.user?._id?.toString() || m.user?.id?.toString() || (typeof m.user === 'string' ? m.user : m.user?.toString()) || m.toString())
        .filter(Boolean);

      if (currentUids.length === 0) {
        db.prepare('DELETE FROM group_members WHERE group_id = ?').run(this.id);
      } else {
        const placeholders = currentUids.map(() => '?').join(',');
        db.prepare(`DELETE FROM group_members WHERE group_id = ? AND user_id NOT IN (${placeholders})`).run(this.id, ...currentUids);
        for (const m of this.members) {
          const uid = m.user?._id?.toString() || m.user?.id?.toString() || (typeof m.user === 'string' ? m.user : m.user?.toString()) || m.toString();
          db.prepare(`
            INSERT OR REPLACE INTO group_members (group_id, user_id, role, joined_at)
            VALUES (?, ?, ?, ?)
          `).run(this.id, uid, m.role || 'member', now);
        }
      }
    }

    return this;
  }

  toObject(): any {
    return { ...this };
  }

  toJSON(): any {
    return this.toObject();
  }

  static find(query: any = {}): QueryChain<any[]> {
    return new QueryChain(async (chain) => {
      const db = getDB();
      let sql = 'SELECT g.* FROM groups g WHERE g.is_active = 1';
      const params: any[] = [];

      const memberUserId = query['members.user'] || query.userId || query.member;
      if (memberUserId) {
        sql = 'SELECT DISTINCT g.* FROM groups g JOIN group_members gm ON g.id = gm.group_id WHERE g.is_active = 1 AND gm.user_id = ?';
        params.push(memberUserId.toString());
      }

      sql += ' ORDER BY g.created_at DESC';
      const rows = db.prepare(sql).all(...params);
      return Promise.all(rows.map((r: any) => this.formatGroup(r)));
    });
  }

  static findById(id: string): QueryChain<any> {
    return new QueryChain(async () => {
      if (!id) return null;
      const db = getDB();
      const row = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
      if (!row) return null;
      return this.formatGroup(row);
    });
  }

  private static async formatGroup(row: any): Promise<any> {
    const db = getDB();
    const memberRows = db.prepare('SELECT * FROM group_members WHERE group_id = ?').all(row.id);
    const members = await Promise.all(
      memberRows.map(async (m: any) => {
        const user = await UserModel.findById(m.user_id);
        return {
          user,
          role: m.role,
          joinedAt: new Date(m.joined_at),
        };
      })
    );

    let perms = {
      canSendMessages: true,
      canSendMedia: true,
      canAddMembers: true,
      canPinMessages: false,
    };
    try {
      if (row.permissions_json) {
        perms = { ...perms, ...JSON.parse(row.permissions_json) };
      }
    } catch {}

    return new GroupModel({
      _id: row.id,
      id: row.id,
      name: row.name,
      description: row.description || '',
      avatar: row.avatar || '',
      createdBy: row.created_by,
      isActive: Boolean(row.is_active),
      inviteToken: row.invite_token,
      slowModeSeconds: Number(row.slow_mode_seconds || 0),
      permissions: perms,
      autoDeleteSeconds: Number(row.auto_delete_seconds || 0),
      members,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static async create(data: any): Promise<any> {
    const group = new GroupModel(data);
    await group.save();
    return this.findById(group.id);
  }

  static findByIdAndUpdate(id: string, update: any): QueryChain<any> {
    return new QueryChain(async (chain) => {
      const group = await this.findById(id);
      if (!group) return null;
      if (update.name !== undefined) group.name = update.name;
      if (update.description !== undefined) group.description = update.description;
      if (update.avatar !== undefined) group.avatar = update.avatar;
      if (update.isActive !== undefined) group.isActive = update.isActive;
      if (update.slowModeSeconds !== undefined) group.slowModeSeconds = update.slowModeSeconds;
      if (update.permissions !== undefined) group.permissions = { ...group.permissions, ...update.permissions };
      if (update.autoDeleteSeconds !== undefined) group.autoDeleteSeconds = update.autoDeleteSeconds;
      await group.save();
      return this.findById(id);
    });
  }

  static async countDocuments(query: any = {}): Promise<number> {
    const db = getDB();
    const row: any = db.prepare('SELECT COUNT(*) as count FROM groups WHERE is_active = 1').get();
    return row?.count || 0;
  }
}

// ─── Message Model (Ephemeral Transit Queue) ────────────────────────────────
export class MessageModel {
  public _id: string;
  public id: string;
  public sender: any;
  public senderId: string;
  public receiver?: any;
  public receiverId?: string;
  public group?: any;
  public groupId?: string;
  public content: string;
  public type: string;
  public imageUrl?: string | null;
  public status: string;
  public isDeleted: boolean;
  public isPinned: boolean;
  public isEdited: boolean;
  public editedAt?: Date | null;
  public replyToId?: string | null;
  public replyTo?: any;
  public reactions: any[];
  public isSilent: boolean;
  public scheduledFor?: Date | null;
  public expiresAt?: Date | null;
  public encryptedPayload?: string | null;
  public isEphemeralTransit: boolean;
  public attachments: any[];
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: any = {}) {
    this._id = data._id?.toString() || data.id?.toString() || generateId();
    this.id = this._id;
    this.senderId = data.sender?._id?.toString() || data.sender?.toString() || data.senderId;
    this.sender = data.sender || this.senderId;
    this.receiverId = data.receiver?._id?.toString() || data.receiver?.toString() || data.receiverId || null;
    this.receiver = data.receiver || this.receiverId;
    this.groupId = data.group?._id?.toString() || data.group?.toString() || data.groupId || null;
    this.group = data.group || this.groupId;
    this.content = data.content || '';
    this.type = data.type || 'text';
    this.imageUrl = data.imageUrl || null;
    this.status = data.status || 'sent';
    this.isDeleted = Boolean(data.isDeleted);
    this.isPinned = Boolean(data.isPinned);
    this.isEdited = Boolean(data.isEdited);
    this.editedAt = data.editedAt ? new Date(data.editedAt) : null;
    this.replyToId = data.replyToId || (data.replyTo?._id?.toString() || data.replyTo?.toString()) || null;
    this.replyTo = data.replyTo || null;
    this.reactions = Array.isArray(data.reactions) ? data.reactions : [];
    this.isSilent = Boolean(data.isSilent);
    this.scheduledFor = data.scheduledFor ? new Date(data.scheduledFor) : null;
    this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    this.encryptedPayload = data.encryptedPayload || null;
    this.isEphemeralTransit = data.isEphemeralTransit !== false;
    this.attachments = Array.isArray(data.attachments) ? data.attachments : [];
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  async save(): Promise<this> {
    const db = getDB();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO messages (
        id, sender_id, receiver_id, group_id, content, type, image_url,
        status, is_deleted, is_pinned, is_edited, edited_at, reply_to_id,
        reactions_json, is_silent, scheduled_for, expires_at,
        encrypted_payload, is_ephemeral_transit, attachments_json,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content = excluded.content,
        status = excluded.status,
        is_deleted = excluded.is_deleted,
        is_pinned = excluded.is_pinned,
        is_edited = excluded.is_edited,
        edited_at = excluded.edited_at,
        reactions_json = excluded.reactions_json,
        is_silent = excluded.is_silent,
        scheduled_for = excluded.scheduled_for,
        expires_at = excluded.expires_at,
        updated_at = excluded.updated_at
    `).run(
      this.id, this.senderId, this.receiverId, this.groupId, this.content, this.type,
      this.imageUrl, this.status, this.isDeleted ? 1 : 0, this.isPinned ? 1 : 0,
      this.isEdited ? 1 : 0, this.editedAt ? this.editedAt.toISOString() : null,
      this.replyToId, JSON.stringify(this.reactions), this.isSilent ? 1 : 0,
      this.scheduledFor ? this.scheduledFor.toISOString() : null,
      this.expiresAt ? this.expiresAt.toISOString() : null,
      this.encryptedPayload, this.isEphemeralTransit ? 1 : 0,
      JSON.stringify(this.attachments),
      this.createdAt.toISOString(), now
    );
    return this;
  }

  toObject(): any {
    return { ...this };
  }

  toJSON(): any {
    return this.toObject();
  }

  static async create(data: any): Promise<MessageModel> {
    const msg = new MessageModel(data);
    await msg.save();
    return this.findById(msg.id) as any;
  }

  static findById(id: string): QueryChain<MessageModel | null> {
    return new QueryChain(async () => {
      const db = getDB();
      const row = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
      if (!row) return null;
      return this.formatMessage(row);
    });
  }

  static find(query: any = {}): QueryChain<MessageModel[]> {
    return new QueryChain(async (chain) => {
      const db = getDB();
      let sql = 'SELECT * FROM messages WHERE is_deleted = 0';
      const params: any[] = [];

      if (query.receiver && query.isDelivered !== undefined) {
        sql += ' AND receiver_id = ? AND is_delivered = ?';
        params.push(query.receiver.toString(), query.isDelivered ? 1 : 0);
      } else if (query.receiver) {
        sql += ' AND receiver_id = ?';
        params.push(query.receiver.toString());
      } else if (query.group) {
        sql += ' AND group_id = ?';
        params.push(query.group.toString());
      } else if (query._id && query._id.$in) {
        const placeholders = query._id.$in.map(() => '?').join(',');
        sql += ` AND id IN (${placeholders})`;
        params.push(...query._id.$in.map((i: any) => i.toString()));
      }

      if (chain.sortCriteria) {
        const [field, dir] = Object.entries(chain.sortCriteria)[0];
        const col = field === 'createdAt' ? 'created_at' : field;
        sql += ` ORDER BY ${col} ${dir === -1 || dir === 'desc' ? 'DESC' : 'ASC'}`;
      } else {
        sql += ' ORDER BY created_at ASC';
      }

      if (chain.limitVal) {
        sql += ` LIMIT ${chain.limitVal}`;
      }

      const rows = db.prepare(sql).all(...params);
      return Promise.all(rows.map((r) => this.formatMessage(r)));
    });
  }

  static findOne(query: any): QueryChain<MessageModel | null> {
    return new QueryChain(async () => {
      const list = await this.find(query);
      return list.length > 0 ? list[list.length - 1] : null;
    });
  }

  static async findByIdAndDelete(id: string): Promise<any> {
    const db = getDB();
    const existing = await this.findById(id);
    db.prepare('DELETE FROM messages WHERE id = ?').run(id);
    return existing;
  }

  static async deleteMany(query: any): Promise<{ deletedCount: number }> {
    const db = getDB();
    if (query._id && query._id.$in) {
      const placeholders = query._id.$in.map(() => '?').join(',');
      const info = db.prepare(`DELETE FROM messages WHERE id IN (${placeholders})`).run(
        ...query._id.$in.map((i: any) => i.toString())
      );
      return { deletedCount: info.changes };
    }
    if (query.group) {
      const info = db.prepare('DELETE FROM messages WHERE group_id = ?').run(query.group.toString());
      return { deletedCount: info.changes };
    }
    if (query.createdAt && query.createdAt.$lt) {
      const dateStr = new Date(query.createdAt.$lt).toISOString();
      const info = db.prepare('DELETE FROM messages WHERE created_at < ?').run(dateStr);
      return { deletedCount: info.changes };
    }
    return { deletedCount: 0 };
  }

  static async updateMany(query: any, update: any): Promise<{ modifiedCount: number }> {
    const db = getDB();
    let sql = 'UPDATE messages SET ';
    const sets: string[] = [];
    const params: any[] = [];

    if (update.status) {
      sets.push('status = ?');
      params.push(update.status);
    }
    if (update.isDelivered !== undefined) {
      sets.push('is_delivered = ?');
      params.push(update.isDelivered ? 1 : 0);
    }

    if (sets.length === 0) return { modifiedCount: 0 };

    if (query.receiver && query.status) {
      sql += `${sets.join(', ')} WHERE receiver_id = ? AND status = ?`;
      params.push(query.receiver.toString(), query.status);
      const info = db.prepare(sql).run(...params);
      return { modifiedCount: info.changes };
    }
    return { modifiedCount: 0 };
  }

  static async countDocuments(query: any = {}): Promise<number> {
    const db = getDB();
    let sql = 'SELECT COUNT(*) as count FROM messages WHERE is_deleted = 0';
    const params: any[] = [];
    if (query.receiver) {
      sql += ' AND receiver_id = ?';
      params.push(query.receiver.toString());
    }
    if (query.group) {
      sql += ' AND group_id = ?';
      params.push(query.group.toString());
    }
    const row: any = db.prepare(sql).get(...params);
    return row?.count || 0;
  }

  static async aggregate(pipeline: any[]): Promise<any[]> {
    const db = getDB();
    const rows = db.prepare(`
      SELECT substr(created_at, 1, 10) as _id, count(*) as count
      FROM messages
      GROUP BY substr(created_at, 1, 10)
    `).all();
    return rows;
  }

  private static async formatMessage(row: any): Promise<MessageModel> {
    const sender = await UserModel.findById(row.sender_id);
    let replyTo: any = null;
    if (row.reply_to_id) {
      try {
        const db = getDB();
        const parentRow = db.prepare('SELECT id, sender_id, content, type, image_url FROM messages WHERE id = ?').get(row.reply_to_id) as any;
        if (parentRow) {
          const parentSender = await UserModel.findById(parentRow.sender_id);
          replyTo = {
            id: parentRow.id,
            _id: parentRow.id,
            senderId: parentRow.sender_id,
            sender: parentSender || { _id: parentRow.sender_id, name: 'User' },
            content: parentRow.content || '',
            type: parentRow.type || 'text',
            imageUrl: parentRow.image_url,
          };
        }
      } catch {}
    }

    return new MessageModel({
      _id: row.id,
      id: row.id,
      sender: sender || { _id: row.sender_id, name: 'User' },
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      receiver: row.receiver_id,
      groupId: row.group_id,
      group: row.group_id,
      content: row.content || '',
      type: row.type || 'text',
      imageUrl: row.image_url,
      status: row.status || 'sent',
      isDeleted: Boolean(row.is_deleted),
      isPinned: Boolean(row.is_pinned),
      isEdited: Boolean(row.is_edited),
      editedAt: row.edited_at ? new Date(row.edited_at) : null,
      replyToId: row.reply_to_id,
      replyTo,
      reactions: JSON.parse(row.reactions_json || '[]'),
      isSilent: Boolean(row.is_silent),
      scheduledFor: row.scheduled_for ? new Date(row.scheduled_for) : null,
      expiresAt: row.expires_at ? new Date(row.expires_at) : null,
      encryptedPayload: row.encrypted_payload,
      isEphemeralTransit: Boolean(row.is_ephemeral_transit),
      attachments: JSON.parse(row.attachments_json || '[]'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  /**
   * Mongoose-compatible populate shim.
   * The messages route calls `message.populate('sender', ...)` after `Message.create()`.
   * Since formatMessage() already eagerly loads sender and replyTo, this is a no-op
   * for the common case — but we still honour the call to avoid TypeError crashes.
   */
  async populate(fieldOrPaths: any, _select?: string): Promise<this> {
    const paths: any[] = Array.isArray(fieldOrPaths)
      ? fieldOrPaths
      : [{ path: typeof fieldOrPaths === 'string' ? fieldOrPaths : fieldOrPaths?.path, select: _select }];

    for (const p of paths) {
      const pathName: string = typeof p === 'string' ? p : (p?.path ?? '');
      if (pathName === 'sender') {
        const uid = this.senderId || (this.sender as any)?._id?.toString?.() || (this.sender as any)?.toString?.();
        if (uid && typeof this.sender !== 'object') {
          const u = await UserModel.findById(uid);
          if (u) {
            this.sender = {
              _id: u.id, id: u.id,
              name: u.name, username: u.username, avatar: u.avatar || '',
            };
          }
        }
      } else if (pathName === 'replyTo' && this.replyToId && !this.replyTo) {
        try {
          const db = getDB();
          const parentRow = db.prepare(
            'SELECT id, sender_id, content, type, image_url FROM messages WHERE id = ?'
          ).get(this.replyToId) as any;
          if (parentRow) {
            const parentSender = await UserModel.findById(parentRow.sender_id);
            this.replyTo = {
              id: parentRow.id, _id: parentRow.id,
              senderId: parentRow.sender_id,
              sender: parentSender || { _id: parentRow.sender_id, name: 'User' },
              content: parentRow.content || '',
              type: parentRow.type || 'text',
              imageUrl: parentRow.image_url,
            };
          }
        } catch {}
      }
    }
    return this;
  }
}

// ─── Story Model ───────────────────────────────────────────────────────────
export class StoryModel {
  public _id: string;
  public id: string;
  public user: any;
  public userId: string;
  public imageUrl: string;
  public mediaUrl: string;
  public type: string;
  public caption: string;
  public isArchived: boolean;
  public views: any[];
  public viewers: any[];
  public reactions: any[];
  public createdAt: Date;

  constructor(data: any = {}) {
    this._id = data._id?.toString() || data.id?.toString() || generateId();
    this.id = this._id;
    this.userId = data.userId || (data.user?._id || data.user)?.toString() || '';
    this.user = data.user || this.userId;
    this.imageUrl = data.imageUrl || data.mediaUrl || data.media_url || '';
    this.mediaUrl = this.imageUrl;
    this.type = data.type || 'image';
    this.caption = data.caption || '';
    this.isArchived = Boolean(data.isArchived ?? data.is_archived);
    this.views = Array.isArray(data.views) ? data.views : (Array.isArray(data.viewers) ? data.viewers : []);
    this.viewers = this.views;
    this.reactions = Array.isArray(data.reactions) ? data.reactions : [];
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
  }

  async save(): Promise<this> {
    const db = getDB();
    const uid = this.userId || (this.user?._id || this.user)?.toString();
    const viewsJson = JSON.stringify(this.viewers || this.views || []);
    const reactionsJson = JSON.stringify(this.reactions || []);
    const isArch = this.isArchived ? 1 : 0;
    const createdAtStr = this.createdAt.toISOString();

    db.prepare(`
      INSERT INTO stories (id, user_id, media_url, type, caption, is_archived, views_json, reactions_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        media_url = excluded.media_url,
        type = excluded.type,
        caption = excluded.caption,
        is_archived = excluded.is_archived,
        views_json = excluded.views_json,
        reactions_json = excluded.reactions_json
    `).run(this.id, uid, this.imageUrl, this.type, this.caption, isArch, viewsJson, reactionsJson, createdAtStr);
    return this;
  }

  async populate(fieldOrPaths: any, select?: string): Promise<this> {
    const paths = Array.isArray(fieldOrPaths) ? fieldOrPaths : [{ path: fieldOrPaths, select }];
    for (const p of paths) {
      const pathName = typeof p === 'string' ? p : p.path;
      if (pathName === 'user') {
        const uId = this.userId || (this.user?._id || this.user)?.toString();
        if (uId) {
          const u = await UserModel.findById(uId);
          if (u) {
            this.user = {
              _id: u.id,
              id: u.id,
              name: u.name,
              username: u.username,
              avatar: u.avatar || '',
            };
          }
        }
      } else if (pathName === 'viewers' || pathName === 'views') {
        const populatedViewers = await Promise.all(
          (this.viewers || []).map(async (v: any) => {
            const vId = (v?._id || v)?.toString();
            if (!vId) return v;
            const u = await UserModel.findById(vId);
            return u ? { _id: u.id, id: u.id, name: u.name, username: u.username, avatar: u.avatar || '' } : v;
          })
        );
        this.viewers = populatedViewers;
        this.views = populatedViewers;
      } else if (pathName === 'reactions.user') {
        const populatedReactions = await Promise.all(
          (this.reactions || []).map(async (r: any) => {
            const uId = (r.user?._id || r.user)?.toString();
            if (!uId) return r;
            const u = await UserModel.findById(uId);
            return {
              ...r,
              user: u ? { _id: u.id, id: u.id, name: u.name, username: u.username, avatar: u.avatar || '' } : r.user,
            };
          })
        );
        this.reactions = populatedReactions;
      }
    }
    return this;
  }

  toObject(): any {
    return {
      _id: this.id,
      id: this.id,
      user: this.user,
      imageUrl: this.imageUrl,
      mediaUrl: this.mediaUrl,
      type: this.type,
      caption: this.caption,
      isArchived: this.isArchived,
      views: this.views,
      viewers: this.viewers,
      reactions: this.reactions,
      createdAt: this.createdAt,
    };
  }

  toJSON(): any {
    return this.toObject();
  }

  static async create(data: any): Promise<StoryModel> {
    const story = new StoryModel(data);
    await story.save();
    return story;
  }

  static findById(id: string): QueryChain<StoryModel | null> {
    return new QueryChain(async (chain) => {
      const db = getDB();
      const row: any = db.prepare('SELECT * FROM stories WHERE id = ?').get(id);
      if (!row) return null;
      const story = StoryModel.fromRow(row);
      if (chain.populateFields.length > 0) {
        for (const popArgs of chain.populateFields) {
          await story.populate(popArgs[0], popArgs[1]);
        }
      }
      return story;
    });
  }

  static async findByIdAndDelete(id: string): Promise<any> {
    const db = getDB();
    const existing = await this.findById(id);
    db.prepare('DELETE FROM stories WHERE id = ?').run(id);
    return existing;
  }

  static async deleteOne(query: any = {}): Promise<any> {
    const db = getDB();
    if (query._id || query.id) {
      const id = (query._id || query.id).toString();
      return db.prepare('DELETE FROM stories WHERE id = ?').run(id);
    }
  }

  static fromRow(r: any): StoryModel {
    return new StoryModel({
      _id: r.id,
      id: r.id,
      userId: r.user_id,
      user: r.user_id,
      imageUrl: r.media_url,
      mediaUrl: r.media_url,
      type: r.type || 'image',
      caption: r.caption || '',
      isArchived: Boolean(r.is_archived),
      views: JSON.parse(r.views_json || '[]'),
      viewers: JSON.parse(r.views_json || '[]'),
      reactions: JSON.parse(r.reactions_json || '[]'),
      createdAt: r.created_at,
    });
  }

  static find(query: any = {}): QueryChain<StoryModel[]> {
    return new QueryChain(async (chain) => {
      const db = getDB();
      let sql = 'SELECT * FROM stories WHERE 1=1';
      const params: any[] = [];

      if (query.user) {
        if (query.user.$in && Array.isArray(query.user.$in)) {
          const placeholders = query.user.$in.map(() => '?').join(',');
          sql += ` AND user_id IN (${placeholders})`;
          params.push(...query.user.$in.map((u: any) => u.toString()));
        } else if (query.user.$nin && Array.isArray(query.user.$nin)) {
          const placeholders = query.user.$nin.map(() => '?').join(',');
          sql += ` AND user_id NOT IN (${placeholders})`;
          params.push(...query.user.$nin.map((u: any) => u.toString()));
        } else {
          sql += ' AND user_id = ?';
          params.push(query.user.toString());
        }
      }

      if (query.isArchived !== undefined) {
        sql += ' AND is_archived = ?';
        params.push(query.isArchived ? 1 : 0);
      }

      if (query.createdAt && query.createdAt.$gte) {
        const dateStr = new Date(query.createdAt.$gte).toISOString();
        sql += ' AND created_at >= ?';
        params.push(dateStr);
      }

      if (chain.sortCriteria) {
        const [field, dir] = Object.entries(chain.sortCriteria)[0];
        const col = field === 'createdAt' ? 'created_at' : field;
        sql += ` ORDER BY ${col} ${dir === -1 || dir === 'desc' ? 'DESC' : 'ASC'}`;
      } else {
        sql += ' ORDER BY created_at ASC';
      }

      if (chain.limitVal) {
        sql += ` LIMIT ${chain.limitVal}`;
      }

      const rows: any[] = db.prepare(sql).all(...params);
      const stories = rows.map((r) => StoryModel.fromRow(r));

      for (const s of stories) {
        await s.populate('user');
        if (chain.populateFields.length > 0) {
          for (const popArgs of chain.populateFields) {
            await s.populate(popArgs[0], popArgs[1]);
          }
        }
      }

      return stories;
    });
  }

  static async countDocuments(query: any = {}): Promise<number> {
    const db = getDB();
    let sql = 'SELECT COUNT(*) as count FROM stories WHERE 1=1';
    const params: any[] = [];
    if (query.user && query.user.$nin && Array.isArray(query.user.$nin)) {
      const placeholders = query.user.$nin.map(() => '?').join(',');
      sql += ` AND user_id NOT IN (${placeholders})`;
      params.push(...query.user.$nin.map((u: any) => u.toString()));
    }
    const row: any = db.prepare(sql).get(...params);
    return row?.count || 0;
  }
}

// ─── SystemSetting Model ───────────────────────────────────────────────────
export class SystemSettingModel {
  public key: string;
  public value: any;
  public updatedAt: Date;

  constructor(data: any = {}) {
    this.key = data.key;
    this.value = data.value;
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  static async findOne(query: any): Promise<SystemSettingModel | null> {
    const db = getDB();
    const row: any = db.prepare('SELECT * FROM system_settings WHERE key = ?').get(query.key);
    if (!row) return null;
    return new SystemSettingModel({
      key: row.key,
      value: row.value ? JSON.parse(row.value) : null,
      updatedAt: row.updated_at,
    });
  }

  static async create(data: any): Promise<SystemSettingModel> {
    const db = getDB();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(data.key, JSON.stringify(data.value), now);
    return new SystemSettingModel(data);
  }

  static async findOneAndUpdate(query: any, update: any, options: any = {}): Promise<SystemSettingModel | null> {
    const val = update.$set?.value !== undefined ? update.$set.value : update.value;
    return this.create({ key: query.key, value: val });
  }
}

// ─── Report Model ──────────────────────────────────────────────────────────
export class ReportModel {
  public _id: string;
  public id: string;
  public reporter: any;
  public reported: any;
  public reason: string;
  public details: string;
  public status: string;
  public createdAt: Date;

  constructor(data: any = {}) {
    this._id = data._id?.toString() || data.id?.toString() || generateId();
    this.id = this._id;
    this.reporter = data.reporter;
    this.reported = data.reported;
    this.reason = data.reason || '';
    this.details = data.details || '';
    this.status = data.status || 'pending';
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
  }

  async save(): Promise<this> {
    const db = getDB();
    const reporterId = this.reporter?._id?.toString() || this.reporter?.toString();
    const reportedId = this.reported?._id?.toString() || this.reported?.toString();
    db.prepare(`
      INSERT INTO reports (id, reporter_id, reported_id, reason, details, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET status = excluded.status
    `).run(this.id, reporterId, reportedId, this.reason, this.details, this.status, this.createdAt.toISOString());
    return this;
  }

  static find(query: any = {}): QueryChain<any[]> {
    return new QueryChain(async (chain) => {
      const db = getDB();
      let sql = 'SELECT * FROM reports WHERE 1=1';
      const params: any[] = [];
      if (query.status) {
        sql += ' AND status = ?';
        params.push(query.status);
      }
      sql += ' ORDER BY created_at DESC';
      if (chain.limitVal) sql += ` LIMIT ${chain.limitVal}`;
      const rows = db.prepare(sql).all(...params);
      return Promise.all(
        rows.map(async (r: any) => {
          const reporter = await UserModel.findById(r.reporter_id);
          const reported = await UserModel.findById(r.reported_id);
          return new ReportModel({
            _id: r.id,
            id: r.id,
            reporter,
            reported,
            reason: r.reason,
            details: r.details,
            status: r.status,
            createdAt: r.created_at,
          });
        })
      );
    });
  }

  static async findOne(query: any): Promise<any> {
    const list = await this.find(query);
    return list.length > 0 ? list[0] : null;
  }

  static async create(data: any): Promise<any> {
    const report = new ReportModel(data);
    await report.save();
    return report;
  }

  static async findByIdAndUpdate(id: string, update: any, options: any = {}): Promise<any> {
    const db = getDB();
    if (update.status) {
      db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(update.status, id);
    }
    return this.findOne({ _id: id });
  }

  static async countDocuments(query: any = {}): Promise<number> {
    const db = getDB();
    let sql = 'SELECT COUNT(*) as count FROM reports WHERE 1=1';
    const params: any[] = [];
    if (query.status) {
      sql += ' AND status = ?';
      params.push(query.status);
    }
    const row: any = db.prepare(sql).get(...params);
    return row?.count || 0;
  }
}

// ─── AuditLog Model ────────────────────────────────────────────────────────
export class AuditLogModel {
  public _id: string;
  public id: string;
  public admin: any;
  public action: string;
  public targetType?: string;
  public targetId?: string;
  public details: any;
  public ipAddress?: string;
  public createdAt: Date;

  constructor(data: any = {}) {
    this._id = data._id?.toString() || data.id?.toString() || generateId();
    this.id = this._id;
    this.admin = data.admin;
    this.action = data.action || '';
    this.targetType = data.targetType;
    this.targetId = data.targetId;
    this.details = data.details || {};
    this.ipAddress = data.ipAddress || '';
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
  }

  async save(): Promise<this> {
    const db = getDB();
    const adminId = this.admin?._id?.toString() || this.admin?.toString();
    db.prepare(`
      INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(this.id, adminId, this.action, this.targetType || null, this.targetId || null, JSON.stringify(this.details), this.ipAddress || '', this.createdAt.toISOString());
    return this;
  }

  static find(query: any = {}): QueryChain<any[]> {
    return new QueryChain(async (chain) => {
      const db = getDB();
      let sql = 'SELECT * FROM audit_logs ORDER BY created_at DESC';
      if (chain.limitVal) sql += ` LIMIT ${chain.limitVal}`;
      const rows = db.prepare(sql).all();
      return Promise.all(
        rows.map(async (r: any) => {
          const admin = await UserModel.findById(r.admin_id);
          return new AuditLogModel({
            _id: r.id,
            id: r.id,
            admin,
            action: r.action,
            targetType: r.target_type,
            targetId: r.target_id,
            details: JSON.parse(r.details || '{}'),
            ipAddress: r.ip_address,
            createdAt: r.created_at,
          });
        })
      );
    });
  }

  static async create(data: any): Promise<any> {
    const log = new AuditLogModel(data);
    await log.save();
    return log;
  }

  static async countDocuments(): Promise<number> {
    const db = getDB();
    const row: any = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get();
    return row?.count || 0;
  }
}

// ─── Draft Model (Cross-Device Cloud Sync) ─────────────────────────────────
export class DraftModel {
  public id: string;
  public _id: string;
  public userId: string;
  public targetId: string;
  public content: string;
  public updatedAt: Date;

  constructor(data: any = {}) {
    this.id = data.id || data._id || `${data.userId}_${data.targetId}`;
    this._id = this.id;
    this.userId = data.userId;
    this.targetId = data.targetId;
    this.content = data.content || '';
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  async save(): Promise<this> {
    const db = getDB();
    const now = new Date().toISOString();
    if (!this.content || this.content.trim() === '') {
      db.prepare('DELETE FROM drafts WHERE user_id = ? AND target_id = ?').run(this.userId, this.targetId);
      return this;
    }
    db.prepare(`
      INSERT INTO drafts (id, user_id, target_id, content, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content = excluded.content,
        updated_at = excluded.updated_at
    `).run(this.id, this.userId, this.targetId, this.content, now);
    return this;
  }

  static async findOne(query: { userId: string; targetId: string }): Promise<DraftModel | null> {
    const db = getDB();
    const row: any = db.prepare('SELECT * FROM drafts WHERE user_id = ? AND target_id = ?').get(query.userId, query.targetId);
    if (!row) return null;
    return new DraftModel({
      id: row.id,
      userId: row.user_id,
      targetId: row.target_id,
      content: row.content,
      updatedAt: row.updated_at,
    });
  }

  static async find(query: { userId: string }): Promise<DraftModel[]> {
    const db = getDB();
    const rows: any[] = db.prepare('SELECT * FROM drafts WHERE user_id = ?').all(query.userId);
    return rows.map(r => new DraftModel({
      id: r.id,
      userId: r.user_id,
      targetId: r.target_id,
      content: r.content,
      updatedAt: r.updated_at,
    }));
  }

  static async deleteOne(query: { userId: string; targetId: string }): Promise<void> {
    const db = getDB();
    db.prepare('DELETE FROM drafts WHERE user_id = ? AND target_id = ?').run(query.userId, query.targetId);
  }
}
