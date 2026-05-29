import { useEffect, useState } from 'react';
import {
  Users, Plus, Search, Edit2, Key, UserX, UserCheck,
  X, Loader2, CheckCircle, AlertCircle, Shield, ChevronDown,
} from 'lucide-react';
import { usersApi, tokenHelpers } from '../../services/api';
import type { AuthUser, UserRole, CreateUserPayload, UpdateUserPayload } from '../../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ROLES: UserRole[] = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR', 'SALES_REP'];

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN:   'Super Admin',
  COMPANY_ADMIN: 'Company Admin',
  ADMIN:         'Admin',        // legacy — kept for display only
  SUPERVISOR:    'Supervisor',
  SALES_REP:     'Sales Rep',
};

const ROLE_STYLE: Record<string, { bg: string; text: string }> = {
  SUPER_ADMIN:   { bg: '#ede9fe', text: '#6d28d9' },
  COMPANY_ADMIN: { bg: '#dbeafe', text: '#1d4ed8' },
  ADMIN:         { bg: '#dbeafe', text: '#1d4ed8' }, // legacy fallback
  SUPERVISOR:    { bg: '#fef9c3', text: '#a16207' },
  SALES_REP:     { bg: '#dcfce7', text: '#16a34a' },
};

// Safe getter — never returns undefined
const getRoleStyle = (role: string) =>
  ROLE_STYLE[role] ?? { bg: '#f1f5f9', text: '#64748b' };

const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#f97316','#ec4899'];

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────

interface Toast { id: number; type: 'success' | 'error'; message: string; }

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id}
          className="flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-in"
          style={{ background: t.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: t.type === 'success' ? '#16a34a' : '#dc2626', minWidth: 260 }}>
          {t.type === 'success' ? <CheckCircle size={15}/> : <AlertCircle size={15}/>}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="opacity-50 hover:opacity-100">
            <X size={13}/>
          </button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal shell
// ─────────────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={16}/>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Form helpers
// ─────────────────────────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inputCls = "w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition";

function RoleSelect({ value, onChange }: { value: UserRole; onChange: (r: UserRole) => void }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value as UserRole)}
        className={inputCls + ' appearance-none pr-8 bg-white'}>
        {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
    </div>
  );
}

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all mt-5"
      style={{ background: loading ? '#93c5fd' : '#3b82f6', cursor: loading ? 'not-allowed' : 'pointer' }}>
      {loading ? <><Loader2 size={14} className="animate-spin"/>{label}ing…</> : label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add / Edit User modal
// ─────────────────────────────────────────────────────────────────────────────

interface UserFormProps {
  user?: AuthUser;
  onClose: () => void;
  onSaved: (u: AuthUser) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}

function UserFormModal({ user, onClose, onSaved, onToast }: UserFormProps) {
  const isEdit = !!user;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username:  user?.username  ?? '',
    email:     user?.email     ?? '',
    firstName: user?.firstName ?? '',
    lastName:  user?.lastName  ?? '',
    phone:     user?.phone     ?? '',
    territory: user?.territory ?? '',
    role:      (user?.role ?? 'SALES_REP') as UserRole,
    password:  '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim())  e.lastName  = 'Required';
    if (!form.username.trim())  e.username  = 'Required';
    if (!form.email.trim())     e.email     = 'Required';
    if (!isEdit && !form.password.trim()) e.password = 'Required for new users';
    if (form.password && form.password.length < 6) e.password = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEdit) {
        const payload: UpdateUserPayload = {
          firstName: form.firstName, lastName: form.lastName,
          email: form.email, phone: form.phone || undefined,
          territory: form.territory || undefined, role: form.role,
          ...(form.password ? { password: form.password } : {}),
        };
        const updated = await usersApi.update(user!.id, payload);
        onSaved(updated);
        onToast('success', `${updated.firstName} ${updated.lastName} updated.`);
      } else {
        const payload: CreateUserPayload = {
          username: form.username, email: form.email,
          password: form.password, firstName: form.firstName,
          lastName: form.lastName, role: form.role,
          phone: form.phone || undefined,
          territory: form.territory || undefined,
        };
        const created = await usersApi.create(payload);
        onSaved(created);
        onToast('success', `${created.firstName} ${created.lastName} added.`);
      }
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      onToast('error', Array.isArray(msg) ? msg[0] : (msg ?? 'Something went wrong.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={isEdit ? `Edit ${user!.firstName} ${user!.lastName}` : 'Add New User'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name" error={errors.firstName}>
            <input className={inputCls} placeholder="John" value={form.firstName} onChange={set('firstName')}/>
          </Field>
          <Field label="Last Name" error={errors.lastName}>
            <input className={inputCls} placeholder="Banda" value={form.lastName} onChange={set('lastName')}/>
          </Field>
        </div>
        <Field label="Username" error={errors.username}>
          <input className={inputCls} placeholder="jbanda" value={form.username}
            onChange={set('username')} disabled={isEdit}
            style={isEdit ? { background: '#f8fafc', color: '#94a3b8' } : {}}/>
        </Field>
        <Field label="Email" error={errors.email}>
          <input className={inputCls} type="email" placeholder="john@ubuntusales.com"
            value={form.email} onChange={set('email')}/>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <input className={inputCls} placeholder="+260 97 ..." value={form.phone} onChange={set('phone')}/>
          </Field>
          <Field label="Territory">
            <input className={inputCls} placeholder="Lusaka CBD" value={form.territory} onChange={set('territory')}/>
          </Field>
        </div>
        <Field label="Role">
          <RoleSelect value={form.role} onChange={r => setForm(p => ({ ...p, role: r }))}/>
        </Field>
        <Field label={isEdit ? 'New Password (leave blank to keep)' : 'Password'} error={errors.password}>
          <input className={inputCls} type="password"
            placeholder={isEdit ? 'Leave blank to keep current' : 'Min 6 characters'}
            value={form.password} onChange={set('password')}/>
        </Field>
        <SubmitBtn loading={loading} label={isEdit ? 'Save Changes' : 'Create User'}/>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Change Password modal
// ─────────────────────────────────────────────────────────────────────────────

function ChangePasswordModal({ user, onClose, onToast }:
  { user: AuthUser; onClose: () => void; onToast: (type: 'success'|'error', msg: string) => void }) {
  const [loading, setLoading]   = useState(false);
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6)      { setError('Minimum 6 characters.'); return; }
    if (password !== confirm)      { setError('Passwords do not match.'); return; }
    setError(''); setLoading(true);
    try {
      await usersApi.update(user.id, { password });
      onToast('success', `Password changed for ${user.firstName}.`);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      onToast('error', Array.isArray(msg) ? msg[0] : (msg ?? 'Failed to change password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Change Password — ${user.firstName} ${user.lastName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: '#fee2e2', color: '#dc2626' }}>
            <AlertCircle size={13}/>{error}
          </div>
        )}
        <Field label="New Password">
          <input className={inputCls} type="password" placeholder="Min 6 characters"
            value={password} onChange={e => setPassword(e.target.value)} autoFocus/>
        </Field>
        <Field label="Confirm Password">
          <input className={inputCls} type="password" placeholder="Repeat password"
            value={confirm} onChange={e => setConfirm(e.target.value)}/>
        </Field>
        <SubmitBtn loading={loading} label="Change Password"/>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Deactivate confirm modal
// ─────────────────────────────────────────────────────────────────────────────

function DeactivateModal({ user, onClose, onConfirm, loading }:
  { user: AuthUser; onClose: () => void; onConfirm: () => void; loading: boolean }) {
  const action = user.isActive ? 'Deactivate' : 'Reactivate';
  return (
    <Modal title={`${action} User`} onClose={onClose}>
      <p className="text-sm text-slate-600 mb-5">
        Are you sure you want to <strong>{action.toLowerCase()}</strong>{' '}
        <strong>{user.firstName} {user.lastName}</strong>?
        {user.isActive && ' They will lose access immediately.'}
      </p>
      <div className="flex gap-2">
        <button onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition"
          style={{ background: user.isActive ? '#ef4444' : '#22c55e' }}>
          {loading ? <Loader2 size={14} className="animate-spin"/> : null}
          {action}
        </button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function Settings() {
  const [users,       setUsers]       = useState<AuthUser[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [roleFilter,  setRoleFilter]  = useState<string>('All');
  const [toasts,      setToasts]      = useState<Toast[]>([]);

  // Modals
  const [showAdd,      setShowAdd]      = useState(false);
  const [editUser,     setEditUser]     = useState<AuthUser | null>(null);
  const [pwdUser,      setPwdUser]      = useState<AuthUser | null>(null);
  const [deactUser,    setDeactUser]    = useState<AuthUser | null>(null);
  const [deactLoading, setDeactLoading] = useState(false);

  const currentUser: AuthUser | null = tokenHelpers.getUser();

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  // ── Load users ─────────────────────────────────────────────────────────────
  const loadUsers = async () => {
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch {
      addToast('error', 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleUserSaved = (saved: AuthUser) => {
    setUsers(prev => {
      const exists = prev.find(u => u.id === saved.id);
      return exists ? prev.map(u => u.id === saved.id ? saved : u) : [saved, ...prev];
    });
  };

  const handleDeactivate = async () => {
    if (!deactUser) return;
    setDeactLoading(true);
    try {
      if (deactUser.isActive) {
        await usersApi.remove(deactUser.id);
        setUsers(prev => prev.map(u => u.id === deactUser.id ? { ...u, isActive: false } : u));
        addToast('success', `${deactUser.firstName} deactivated.`);
      } else {
        const updated = await usersApi.update(deactUser.id, { isActive: true });
        setUsers(prev => prev.map(u => u.id === deactUser.id ? updated : u));
        addToast('success', `${deactUser.firstName} reactivated.`);
      }
      setDeactUser(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      addToast('error', Array.isArray(msg) ? msg[0] : (msg ?? 'Action failed.'));
    } finally {
      setDeactLoading(false);
    }
  };

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const matchSearch = [u.firstName, u.lastName, u.username, u.email, u.territory ?? '']
      .join(' ').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const counts = {
    total:    users.length,
    active:   users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={id => setToasts(p => p.filter(t => t.id !== id))} />

      {/* Modals */}
      {showAdd    && <UserFormModal onClose={() => setShowAdd(false)}    onSaved={handleUserSaved} onToast={addToast} />}
      {editUser   && <UserFormModal user={editUser} onClose={() => setEditUser(null)}   onSaved={handleUserSaved} onToast={addToast} />}
      {pwdUser    && <ChangePasswordModal user={pwdUser} onClose={() => setPwdUser(null)} onToast={addToast} />}
      {deactUser  && <DeactivateModal user={deactUser} onClose={() => setDeactUser(null)} onConfirm={handleDeactivate} loading={deactLoading} />}

      <div className="flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-slate-400"/>
            <h1 className="text-sm font-semibold text-slate-700">User Management</h1>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ background: '#3b82f6' }}>
            <Plus size={13}/> Add User
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Users',   value: counts.total,    color: '#3b82f6', icon: <Users size={14}/> },
            { label: 'Active',        value: counts.active,   color: '#22c55e', icon: <UserCheck size={14}/> },
            { label: 'Inactive',      value: counts.inactive, color: '#94a3b8', icon: <UserX size={14}/> },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: c.color + '20', color: c.color }}>{c.icon}</div>
              <div>
                <p className="text-xs text-slate-500">{c.label}</p>
                <p className="text-lg font-bold text-slate-800">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Search name, username, email…"
              value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <div className="flex gap-1.5">
            {['All', ...ROLES].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                style={roleFilter === r
                  ? { background: '#3b82f6', color: 'white', borderColor: '#3b82f6' }
                  : { background: 'white', color: '#64748b', borderColor: '#e2e8f0' }}>
                {r === 'All' ? 'All' : ROLE_LABEL[r as UserRole]}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100" style={{ background: '#f8fafc' }}>
                {['User', 'Role', 'Territory', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <Loader2 size={18} className="animate-spin"/>
                    <span className="text-sm">Loading users…</span>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-300">
                    <Users size={28}/>
                    <p className="text-sm">No users found</p>
                  </div>
                </td></tr>
              ) : filtered.map((u, i) => {
                const rs = getRoleStyle(u.role);
                const initials = `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
                const isCurrentUser = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                    style={{ opacity: u.isActive ? 1 : 0.5 }}>

                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>{initials}</div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            {u.firstName} {u.lastName}
                            {isCurrentUser && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium"
                              style={{ background: '#dbeafe', color: '#1d4ed8' }}>You</span>}
                          </p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{ background: rs.bg, color: rs.text }}>
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>

                    {/* Territory */}
                    <td className="px-4 py-3 text-xs text-slate-500">{u.territory ?? '—'}</td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs font-medium w-fit">
                        <span className="w-1.5 h-1.5 rounded-full"
                          style={{ background: u.isActive ? '#22c55e' : '#94a3b8' }}/>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* Edit */}
                        <button onClick={() => setEditUser(u)} title="Edit user"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition">
                          <Edit2 size={13}/>
                        </button>
                        {/* Change password */}
                        <button onClick={() => setPwdUser(u)} title="Change password"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition">
                          <Key size={13}/>
                        </button>
                        {/* Deactivate / reactivate — can't do it to yourself */}
                        {!isCurrentUser && (
                          <button onClick={() => setDeactUser(u)}
                            title={u.isActive ? 'Deactivate' : 'Reactivate'}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition"
                            style={{ color: u.isActive ? '#94a3b8' : '#22c55e' }}
                            onMouseEnter={e => (e.currentTarget.style.background = u.isActive ? '#fee2e2' : '#dcfce7')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            {u.isActive ? <UserX size={13}/> : <UserCheck size={13}/>}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </>
  );
}
