"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
  type FormState,
} from "@/actions/users";
import {
  PERMISSIONS,
  PERMISSION_LABELS,
  ROLE_LABELS,
  ROLE_DEFAULT_PERMISSIONS,
  ADMIN_ONLY_GRANTABLE,
  isAdminRole,
  type Permission,
} from "@/lib/permissions";
import type { Role } from "@/generated/prisma/enums";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

export type UserRow = {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  active: boolean;
  permissions: Permission[];
};

const initialState: FormState = {};
const ALL_ROLES: Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "PRESIDENT",
  "VICE_PRESIDENT",
  "DEPT_HEAD",
  "MEMBER",
];

/** Roles the actor is allowed to assign (mirrors server rules). */
function assignableRoles(actorRole: Role): Role[] {
  return ALL_ROLES.filter((r) => {
    if (r === "SUPER_ADMIN") return actorRole === "SUPER_ADMIN";
    if (r === "ADMIN") return isAdminRole(actorRole);
    return true;
  });
}

function PermissionCheckboxes({
  selected,
  onToggle,
  actorIsAdmin,
}: {
  selected: Set<Permission>;
  onToggle: (p: Permission) => void;
  actorIsAdmin: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {PERMISSIONS.map((p) => {
        const disabled = !actorIsAdmin && ADMIN_ONLY_GRANTABLE.includes(p);
        return (
          <label
            key={p}
            className={`flex items-center gap-2 text-sm ${disabled ? "opacity-40" : ""}`}
          >
            <input
              type="checkbox"
              name="permissions"
              value={p}
              checked={selected.has(p)}
              disabled={disabled}
              onChange={() => onToggle(p)}
            />
            {PERMISSION_LABELS[p]}
          </label>
        );
      })}
    </div>
  );
}

function CreateUserForm({
  actorRole,
  onDone,
}: {
  actorRole: Role;
  onDone: () => void;
}) {
  const actorIsAdmin = isAdminRole(actorRole);
  const [state, formAction, pending] = useActionState(
    createUserAction,
    initialState,
  );
  const [role, setRole] = useState<Role>("MEMBER");
  const [selected, setSelected] = useState<Set<Permission>>(
    new Set(ROLE_DEFAULT_PERMISSIONS.MEMBER),
  );

  useEffect(() => {
    if (state.success) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function handleRoleChange(next: Role) {
    setRole(next);
    setSelected(new Set(ROLE_DEFAULT_PERMISSIONS[next]));
  }

  function toggle(p: Permission) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label
            htmlFor="uc-username"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            ชื่อผู้ใช้
          </label>
          <input
            id="uc-username"
            name="username"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="uc-password"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            รหัสผ่านเริ่มต้น
          </label>
          <input
            id="uc-password"
            type="password"
            name="password"
            required
            minLength={8}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="uc-fullname"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            ชื่อ-นามสกุล
          </label>
          <input
            id="uc-fullname"
            name="fullName"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="uc-role"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            บทบาท
          </label>
          <select
            id="uc-role"
            name="role"
            value={role}
            onChange={(e) => handleRoleChange(e.target.value as Role)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {assignableRoles(actorRole).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-slate-600">สิทธิ์การใช้งาน</p>
        <PermissionCheckboxes
          selected={selected}
          onToggle={toggle}
          actorIsAdmin={actorIsAdmin}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {pending ? "กำลังสร้าง..." : "สร้างผู้ใช้"}
        </button>
        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}

function EditUserForm({
  user,
  actorRole,
  isSelf,
  onDone,
}: {
  user: UserRow;
  actorRole: Role;
  isSelf: boolean;
  onDone: () => void;
}) {
  const actorIsAdmin = isAdminRole(actorRole);
  const [state, formAction, pending] = useActionState(
    updateUserAction,
    initialState,
  );
  const [selected, setSelected] = useState<Set<Permission>>(
    new Set(user.permissions),
  );

  useEffect(() => {
    if (state.success) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function toggle(p: Permission) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  return (
    <tr className="border-b border-slate-100 bg-slate-50">
      <td colSpan={5} className="px-4 py-4">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={user.id} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="ue-fullname"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                ชื่อ-นามสกุล
              </label>
              <input
                id="ue-fullname"
                name="fullName"
                required
                defaultValue={user.fullName}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="ue-role"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                บทบาท
              </label>
              <select
                id="ue-role"
                name="role"
                defaultValue={user.role}
                disabled={isSelf || (!actorIsAdmin && isAdminRole(user.role))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {/* Include the current role so the select shows it even when the actor couldn't assign it. */}
                {[...new Set([user.role, ...assignableRoles(actorRole)])].map(
                  (r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label
                htmlFor="ue-newpassword"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                ตั้งรหัสผ่านใหม่ (ถ้าต้องการ)
              </label>
              <input
                id="ue-newpassword"
                type="password"
                name="newPassword"
                minLength={8}
                placeholder="เว้นว่างหากไม่เปลี่ยน"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={user.active}
                  disabled={isSelf}
                />
                ใช้งานได้ (Active)
              </label>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-slate-600">สิทธิ์การใช้งาน</p>
            <PermissionCheckboxes
              selected={selected}
              onToggle={toggle}
              actorIsAdmin={actorIsAdmin}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
            >
              บันทึก
            </button>
            <button
              type="button"
              onClick={onDone}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white"
            >
              ยกเลิก
            </button>
            {state.error && (
              <p role="alert" className="text-sm text-red-600">
                {state.error}
              </p>
            )}
          </div>
        </form>
      </td>
    </tr>
  );
}

function DeleteUserForm({ user }: { user: UserRow }) {
  const [state, formAction] = useActionState(deleteUserAction, initialState);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={user.id} />
      <ConfirmSubmitButton
        message={`ต้องการลบผู้ใช้ "${user.username}" ใช่หรือไม่?`}
        detail="ประวัติการใช้งาน (Log) ของผู้ใช้นี้จะยังคงอยู่ในระบบ"
        className="text-red-600 hover:underline"
      >
        ลบ
      </ConfirmSubmitButton>
      {state.error && (
        <span role="alert" className="ml-2 text-xs text-red-600">
          {state.error}
        </span>
      )}
    </form>
  );
}

export default function UserManager({
  users,
  actorId,
  actorRole,
}: {
  users: UserRow[];
  actorId: string;
  actorRole: Role;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const actorIsSuperAdmin = actorRole === "SUPER_ADMIN";
  const actorIsAdmin = isAdminRole(actorRole);

  return (
    <div className="space-y-4">
      <div>
        {showAdd ? (
          <CreateUserForm
            actorRole={actorRole}
            onDone={() => setShowAdd(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            + สร้างผู้ใช้ใหม่
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">ชื่อผู้ใช้</th>
              <th className="px-4 py-3">ชื่อ-นามสกุล</th>
              <th className="px-4 py-3">บทบาท</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === actorId;
              const targetIsSuperAdmin = u.role === "SUPER_ADMIN";
              const targetIsAdmin = u.role === "ADMIN";
              // Mirrors the server rules — the server re-checks everything.
              const canEdit = targetIsSuperAdmin
                ? isSelf || actorIsSuperAdmin
                : targetIsAdmin
                  ? isSelf || actorIsSuperAdmin
                  : actorIsAdmin || !isAdminRole(u.role);
              const canDelete =
                !isSelf &&
                !targetIsSuperAdmin &&
                (targetIsAdmin ? actorIsSuperAdmin : true);
              return editingId === u.id ? (
                <EditUserForm
                  key={u.id}
                  user={u}
                  actorRole={actorRole}
                  isSelf={isSelf}
                  onDone={() => setEditingId(null)}
                />
              ) : (
                <tr key={u.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-600">{u.username}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {u.fullName}
                    {isSelf && (
                      <span className="ml-2 text-xs text-slate-400">(คุณ)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {targetIsSuperAdmin ? (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        {ROLE_LABELS[u.role]}
                      </span>
                    ) : (
                      ROLE_LABELS[u.role]
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.active ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                        ใช้งานอยู่
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        ระงับการใช้งาน
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setEditingId(u.id)}
                        className="mr-3 text-blue-800 hover:underline"
                      >
                        แก้ไข
                      </button>
                    )}
                    {canDelete && <DeleteUserForm user={u} />}
                    {!canEdit && !canDelete && (
                      <span
                        className="text-xs text-slate-300"
                        title={
                          targetIsSuperAdmin
                            ? "บัญชีผู้ดูแลระบบหลักได้รับการปกป้อง"
                            : "เฉพาะผู้ดูแลระบบหลักเท่านั้นที่จัดการบัญชีนี้ได้"
                        }
                      >
                        —
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
