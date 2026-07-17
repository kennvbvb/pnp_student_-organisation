"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createStudentAction,
  updateStudentAction,
  deleteStudentAction,
  type FormState,
} from "@/actions/students";

export type StudentRow = {
  id: string;
  studentCode: string;
  prefix: string | null;
  firstName: string;
  lastName: string;
  classRoom: string;
  conductScore: number;
  active: boolean;
};

const initialState: FormState = {};

function AddStudentForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(
    createStudentAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          รหัสนักเรียน
        </label>
        <input
          name="studentCode"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-800"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          คำนำหน้า
        </label>
        <input
          name="prefix"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-800"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          ชื่อ
        </label>
        <input
          name="firstName"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-800"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          นามสกุล
        </label>
        <input
          name="lastName"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-800"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          ห้อง
        </label>
        <input
          name="classRoom"
          required
          placeholder="เช่น ม.1/1"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-800"
        />
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {pending ? "กำลังบันทึก..." : "เพิ่มนักเรียน"}
        </button>
      </div>
      {state.error && (
        <p className="text-sm text-red-600 lg:col-span-6">{state.error}</p>
      )}
    </form>
  );
}

function EditStudentForm({
  student,
  onDone,
}: {
  student: StudentRow;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateStudentAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <tr className="border-b border-slate-100 bg-slate-50">
      <td colSpan={7} className="px-4 py-3">
        <form
          action={formAction}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6"
        >
          <input type="hidden" name="id" value={student.id} />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              คำนำหน้า
            </label>
            <input
              name="prefix"
              defaultValue={student.prefix ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              ชื่อ
            </label>
            <input
              name="firstName"
              required
              defaultValue={student.firstName}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              นามสกุล
            </label>
            <input
              name="lastName"
              required
              defaultValue={student.lastName}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              ห้อง
            </label>
            <input
              name="classRoom"
              required
              defaultValue={student.classRoom}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name="active"
                defaultChecked={student.active}
              />
              ใช้งานอยู่
            </label>
          </div>
          <div className="flex items-end gap-2">
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
          </div>
          {state.error && (
            <p className="text-sm text-red-600 lg:col-span-6">
              {state.error}
            </p>
          )}
        </form>
      </td>
    </tr>
  );
}

export default function StudentManager({
  students,
  canManage,
}: {
  students: StudentRow[];
  canManage: boolean;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {canManage && (
        <div>
          {showAdd ? (
            <AddStudentForm onDone={() => setShowAdd(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              + เพิ่มนักเรียน
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">รหัสนักเรียน</th>
              <th className="px-4 py-3">ชื่อ-นามสกุล</th>
              <th className="px-4 py-3">ห้อง</th>
              <th className="px-4 py-3">คะแนนความประพฤติ</th>
              <th className="px-4 py-3">สถานะ</th>
              {canManage && <th className="px-4 py-3 text-right">จัดการ</th>}
            </tr>
          </thead>
          <tbody>
            {students.map((s) =>
              editingId === s.id ? (
                <EditStudentForm
                  key={s.id}
                  student={s}
                  onDone={() => setEditingId(null)}
                />
              ) : (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-600">
                    {s.studentCode}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {s.prefix ?? ""}
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{s.classRoom}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {s.conductScore}
                  </td>
                  <td className="px-4 py-3">
                    {s.active ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                        ใช้งานอยู่
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        ปิดใช้งาน
                      </span>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingId(s.id)}
                        className="mr-3 text-blue-800 hover:underline"
                      >
                        แก้ไข
                      </button>
                      <form action={deleteStudentAction} className="inline">
                        <input type="hidden" name="id" value={s.id} />
                        <button
                          type="submit"
                          className="text-red-600 hover:underline"
                          onClick={(e) => {
                            if (
                              !confirm(
                                `ต้องการลบนักเรียน "${s.firstName} ${s.lastName}" ใช่หรือไม่?`,
                              )
                            ) {
                              e.preventDefault();
                            }
                          }}
                        >
                          ลบ
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              ),
            )}
            {students.length === 0 && (
              <tr>
                <td
                  colSpan={canManage ? 6 : 5}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  ไม่พบข้อมูลนักเรียน
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
