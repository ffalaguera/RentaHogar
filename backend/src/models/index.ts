import bcrypt from 'bcryptjs';
import { DataTypes, Op } from 'sequelize';
import { sequelize } from '../config/database';

const UserModel = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fullName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('owner', 'tenant'), defaultValue: 'owner' },
    phone: { type: DataTypes.STRING, defaultValue: '' },
    avatar: { type: DataTypes.STRING, defaultValue: '' },
    gender: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    registeredBy: { type: DataTypes.UUID, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    mustChangePassword: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { timestamps: true, tableName: 'users' },
);

const PropertyModel = sequelize.define(
  'Property',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    owner: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.JSONB, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    monthlyRent: { type: DataTypes.FLOAT, allowNull: false },
    rentMode: { type: DataTypes.STRING, allowNull: false, defaultValue: 'full' },
    roomRents: { type: DataTypes.JSONB, allowNull: true, defaultValue: null },
    bedrooms: { type: DataTypes.INTEGER, defaultValue: 1 },
    bathrooms: { type: DataTypes.INTEGER, defaultValue: 1 },
    squareMeters: { type: DataTypes.FLOAT, defaultValue: 0 },
    description: { type: DataTypes.TEXT, defaultValue: '' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { timestamps: true, tableName: 'properties' },
);

const TenantAssignmentModel = sequelize.define(
  'TenantAssignment',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant: { type: DataTypes.UUID, allowNull: false },
    property: { type: DataTypes.UUID, allowNull: false },
    owner: { type: DataTypes.UUID, allowNull: false },
    room: { type: DataTypes.INTEGER, allowNull: true },
    monthlyRent: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    startDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    endDate: { type: DataTypes.DATE, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { timestamps: true, tableName: 'tenant_assignments' },
);

const PaymentModel = sequelize.define(
  'Payment',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant: { type: DataTypes.UUID, allowNull: false },
    property: { type: DataTypes.UUID, allowNull: false },
    owner: { type: DataTypes.UUID, allowNull: false },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    month: { type: DataTypes.INTEGER, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    dueDate: { type: DataTypes.DATE, allowNull: false },
    paidDate: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.ENUM('pending', 'paid', 'overdue'), defaultValue: 'pending' },
    paymentMethod: { type: DataTypes.STRING, defaultValue: 'transfer' },
    notes: { type: DataTypes.TEXT, defaultValue: '' },
  },
  { timestamps: true, tableName: 'payments' },
);

const InvoiceModel = sequelize.define(
  'Invoice',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    property: { type: DataTypes.UUID, allowNull: false },
    owner: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    periodStart: { type: DataTypes.JSONB, allowNull: false },
    periodEnd: { type: DataTypes.JSONB, allowNull: false },
    issueDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    isPaid: { type: DataTypes.BOOLEAN, defaultValue: false },
    paidDate: { type: DataTypes.DATE, allowNull: true },
    reference: { type: DataTypes.STRING, defaultValue: '' },
    documentUrl: { type: DataTypes.STRING, defaultValue: null },
    notes: { type: DataTypes.TEXT, defaultValue: '' },
  },
  { timestamps: true, tableName: 'invoices' },
);

const IncidentModel = sequelize.define(
  'Incident',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant: { type: DataTypes.UUID, allowNull: false },
    property: { type: DataTypes.UUID, allowNull: false },
    owner: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    priority: { type: DataTypes.STRING, defaultValue: 'medium' },
    status: { type: DataTypes.STRING, defaultValue: 'open' },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    ownerNotes: { type: DataTypes.TEXT, defaultValue: '' },
  },
  { timestamps: true, tableName: 'incidents' },
);

const NotificationModel = sequelize.define(
  'Notification',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    recipient: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    relatedModel: { type: DataTypes.STRING, allowNull: true },
    relatedId: { type: DataTypes.UUID, allowNull: true },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { timestamps: true, tableName: 'notifications' },
);

UserModel.beforeCreate(async (user: any) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

UserModel.beforeUpdate(async (user: any) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

const OP_MAP: Record<string, symbol> = {
  $in: Op.in,
  $lt: Op.lt,
  $lte: Op.lte,
  $gt: Op.gt,
  $gte: Op.gte,
  $ne: Op.ne,
  $or: Op.or,
  $and: Op.and,
};

const mapValue = (val: any): any => {
  if (!val || typeof val !== 'object' || Array.isArray(val) || val instanceof Date) return val;
  if (val instanceof RegExp) {
    return { [Op.iLike]: `%${String(val.source).replace(/[%_\\]/g, (c) => `\\${c}`)}%` };
  }
  const opKeys = Object.keys(val).filter((x) => x.startsWith('$'));
  if (opKeys.length === 0) return val;
  if (val.$regex) {
    return val.$options === 'i'
      ? { [Op.iLike]: `%${val.$regex}%` }
      : { [Op.like]: `%${val.$regex}%` };
  }
  const seqVal: Record<string, any> = {};
  opKeys.forEach((ok) => {
    const op = OP_MAP[ok];
    if (op) seqVal[op as unknown as string] = val[ok];
  });
  return Object.keys(seqVal).length > 0 ? seqVal : val;
};

const mapFilter = (filter: Record<string, any> = {}): any => {
  if (!filter || typeof filter !== 'object') return {};
  const plain: Record<string, any> = {};
  const jsonConditions: any[] = [];
  Object.keys(filter).forEach((k) => {
    if (k === '$or') {
      plain[Op.or as unknown as string] = filter[k].map((c: any) => mapFilter(c));
      return;
    }
    const key = k === '_id' ? 'id' : k;
    const val = filter[k];
    if (key.includes('.')) {
      const [objKey, subKey] = key.split('.');
      const mappedVal = mapValue(val);
      const isNumeric =
        ['period', 'periodStart', 'periodEnd'].includes(objKey) || typeof val === 'number';
      const col = isNumeric
        ? sequelize.literal(`("${objKey}"->>'${subKey}')::int`)
        : sequelize.literal(`"${objKey}"->>'${subKey}'`);
      const op =
        mappedVal && typeof mappedVal === 'object' && mappedVal[Op.iLike] ? Op.iLike : Op.eq;
      const rhs =
        mappedVal && typeof mappedVal === 'object' && mappedVal[Op.iLike]
          ? mappedVal[Op.iLike]
          : isNumeric
            ? parseInt(val, 10)
            : val;
      jsonConditions.push(sequelize.where(col, op, rhs));
    } else {
      plain[key] = mapValue(val);
    }
  });
  if (jsonConditions.length > 0) {
    return { [Op.and]: [plain, ...jsonConditions] };
  }
  return plain;
};

const wrapInstance = (Model: any, instance: any): any => {
  if (!instance) return null;
  const data = instance.toJSON();
  data._id = data.id;
  data.toObject = () => ({ ...data });

  if (Model === UserModel) {
    data.comparePassword = async (candidate: string) =>
      bcrypt.compare(candidate, instance.password);
    data.save = async function (this: any) {
      const updates = { ...this };
      delete updates._id;
      delete updates.id;
      await Model.update(updates, { where: { id: this._id } });
      const refreshed = await Model.findByPk(this._id);
      return wrapInstance(Model, refreshed);
    };
  } else {
    data.save = async function (this: any) {
      const updates = { ...this };
      delete updates._id;
      delete updates.id;
      await Model.update(updates, { where: { id: this._id } });
      const refreshed = await Model.findByPk(this._id);
      return wrapInstance(Model, refreshed);
    };
  }
  return data;
};

const makeThenable = (execFn: (includePassword?: boolean) => Promise<any>) => {
  let includePassword = false;
  return {
    select(sel: string) {
      if (sel === '+password') includePassword = true;
      return this;
    },
    then(resolve: any, reject?: any) {
      return execFn(includePassword).then(resolve, reject);
    },
    catch(fn: any) {
      return execFn(includePassword).catch(fn);
    },
  };
};

const matchesFilter = (doc: any, match: any): boolean => {
  if (!match || !doc) return true;
  if (match.$or) {
    return match.$or.some((cond: any) => {
      const [k, v] = Object.entries(cond)[0] || [];
      if (!k) return false;
      const val = doc[k];
      if (v instanceof RegExp) return v.test(val);
      return val === v;
    });
  }
  return true;
};

const doPopulate = async (results: any, populates: any[], isArray: boolean): Promise<any> => {
  const arr = isArray ? results : results ? [results] : [];
  if (populates.length === 0 || arr.length === 0) return results;
  const pathToModel = (path: any) => {
    const p = typeof path === 'object' ? path.path : path;
    if (['owner', 'tenant', 'recipient', 'registeredBy'].includes(p)) return UserModel;
    if (p === 'property') return PropertyModel;
    return null;
  };
  for (const path of populates) {
    const p = typeof path === 'object' ? path.path : path;
    const match = typeof path === 'object' ? path.match : null;
    const relatedModel = pathToModel(path);
    if (!relatedModel) continue;
    for (const r of arr) {
      const fk = r && r[p];
      if (!fk) continue;
      try {
        const relInst = await relatedModel.findByPk(fk);
        let wrapped = relInst ? wrapInstance(relatedModel, relInst) : null;
        if (wrapped && match && !matchesFilter(wrapped, match)) wrapped = null;
        r[p] = wrapped;
      } catch {
        r[p] = null;
      }
    }
  }
  return isArray ? arr : arr[0];
};

const buildModelWrapper = (Model: any) => ({
  findOne: (filter: Record<string, any> = {}) => {
    const where = mapFilter(filter);
    const populates: any[] = [];
    let includePassword = false;
    const execFn = async () => {
      const attributes = includePassword ? undefined : { exclude: ['password'] };
      const inst = await Model.findOne({ where, attributes });
      return doPopulate(wrapInstance(Model, inst), populates, false);
    };
    const chain: any = {
      populate(_p: any, _sel?: any) {
        populates.push(typeof _p === 'object' ? _p : { path: _p, select: _sel });
        return chain;
      },
      select(sel: string) {
        if (sel === '+password') includePassword = true;
        return chain;
      },
      then(resolve: any, reject?: any) {
        return execFn().then(resolve, reject);
      },
      catch(fn: any) {
        return execFn().catch(fn);
      },
    };
    return chain;
  },

  find: (filter: Record<string, any> = {}) => {
    const where = mapFilter(filter);
    let sortObj: any = null;
    let skipN = 0;
    let limitN: number | null = null;
    const populates: any[] = [];

    const parseSort = (s: any) => {
      if (!s) return undefined;
      if (typeof s === 'string') {
        const field = s.startsWith('-') ? s.slice(1) : s;
        const dir = s.startsWith('-') ? 'DESC' : 'ASC';
        return [[field, dir]];
      }
      if (typeof s === 'object') {
        return Object.entries(s).map(([k, v]) => [
          k === '_id' ? 'id' : k,
          Number(v) === -1 ? 'DESC' : 'ASC',
        ]);
      }
      return undefined;
    };

    const execFn = async (includePassword?: boolean) => {
      const attributes = includePassword ? undefined : { exclude: ['password'] };
      const options: any = { where, attributes };
      if (skipN) options.offset = skipN;
      if (limitN) options.limit = limitN;
      if (sortObj) options.order = parseSort(sortObj);
      const insts = await Model.findAll(options);
      const results = insts.map((i: any) => wrapInstance(Model, i));
      return doPopulate(results, populates, true);
    };

    const q = {
      sort(s: any) {
        sortObj = s;
        return q;
      },
      skip(n: number) {
        skipN = Number(n) || 0;
        return q;
      },
      limit(n: number) {
        limitN = Number(n) || null;
        return q;
      },
      populate(_p: any, _sel?: any) {
        populates.push(typeof _p === 'object' ? _p : { path: _p, select: _sel });
        return q;
      },
      exec(includePassword?: boolean) {
        return execFn(includePassword);
      },
      then(resolve: any, reject?: any) {
        return execFn().then(resolve, reject);
      },
      catch(fn: any) {
        return execFn().catch(fn);
      },
    };
    return q;
  },

  countDocuments: (filter: Record<string, any> = {}) => {
    const where = mapFilter(filter);
    return Model.count({ where });
  },

  findById: (id: string) =>
    makeThenable(async (includePassword?: boolean) => {
      const attributes = includePassword ? undefined : { exclude: ['password'] };
      const inst = await Model.findByPk(id, { attributes });
      return wrapInstance(Model, inst);
    }),

  create: async (data: any) => {
    const inst = await Model.create(data);
    return wrapInstance(Model, inst);
  },

  insertMany: async (arr: any[]) => {
    const created = await Model.bulkCreate(arr);
    return created.map((c: any) => wrapInstance(Model, c));
  },

  deleteMany: async (filter: Record<string, any> = {}) => {
    const where = mapFilter(filter);
    return Model.destroy({ where });
  },

  updateMany: async (filter: Record<string, any> = {}, updates: Record<string, any> = {}) => {
    const where = mapFilter(filter);
    return Model.update(updates, { where });
  },

  findOneAndUpdate: async (
    filter: Record<string, any> = {},
    updates: Record<string, any> = {},
    _options = {},
  ) => {
    const where = mapFilter(filter);
    const inst = await Model.findOne({ where });
    if (!inst) return null;
    await Model.update(updates, { where: { id: inst.id } });
    const refreshed = await Model.findByPk(inst.id);
    return wrapInstance(Model, refreshed);
  },

  findOneAndDelete: async (filter: Record<string, any> = {}) => {
    const where = mapFilter(filter);
    const inst = await Model.findOne({ where });
    if (!inst) return null;
    await Model.destroy({ where });
    return wrapInstance(Model, inst);
  },

  findByIdAndUpdate: async (id: string, updates: Record<string, any> = {}, _options = {}) => {
    await Model.update(updates, { where: { id } });
    const refreshed = await Model.findByPk(id);
    return wrapInstance(Model, refreshed);
  },

  findByIdAndDelete: async (id: string) => {
    const inst = await Model.findByPk(id);
    if (!inst) return null;
    await Model.destroy({ where: { id } });
    return wrapInstance(Model, inst);
  },
});

type ModelWrapper = {
  findOne: (filter?: any) => any;
  find: (filter?: any) => any;
  findById: (id: string) => any;
  create: (data: any) => Promise<any>;
  countDocuments: (filter?: any) => Promise<number>;
  deleteMany: (filter?: any) => Promise<any>;
  updateMany: (filter?: any, updates?: any) => Promise<any>;
  findOneAndUpdate: (filter?: any, updates?: any, options?: any) => Promise<any>;
  findOneAndDelete: (filter?: any) => Promise<any>;
  findByIdAndUpdate: (id: string, updates?: any, options?: any) => Promise<any>;
  findByIdAndDelete: (id: string) => Promise<any>;
  insertMany: (arr: any[]) => Promise<any[]>;
};

export const User: ModelWrapper = buildModelWrapper(UserModel) as any;
export const Property: ModelWrapper = buildModelWrapper(PropertyModel) as any;
export const TenantAssignment: ModelWrapper = buildModelWrapper(TenantAssignmentModel) as any;
export const Payment: ModelWrapper = buildModelWrapper(PaymentModel) as any;
export const Invoice: ModelWrapper = buildModelWrapper(InvoiceModel) as any;
export const Incident: ModelWrapper = buildModelWrapper(IncidentModel) as any;
export const Notification: ModelWrapper = buildModelWrapper(NotificationModel) as any;

export const _models = {
  sequelize,
  UserModel,
  PropertyModel,
  TenantAssignmentModel,
  PaymentModel,
  InvoiceModel,
  IncidentModel,
  NotificationModel,
};
