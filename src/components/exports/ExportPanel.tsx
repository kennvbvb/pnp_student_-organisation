"use client";

import { useMemo, useState } from "react";

type StudentOption = {
  id: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  classRoom: string;
};

function download(url: string) {
  window.location.href = url;
}

export default function ExportPanel({
  students,
  classRooms,
}: {
  students: StudentOption[];
  classRooms: string[];
}) {
  // Conduct export state
  const [conductScope, setConductScope] = useState<"all" | "room" | "student">(
    "all",
  );
  const [conductRoom, setConductRoom] = useState("");
  const [conductStudentRoom, setConductStudentRoom] = useState("");
  const [conductStudentId, setConductStudentId] = useState("");

  // Recycle export state
  const [recycleScope, setRecycleScope] = useState<"room" | "student">("room");
  const [recycleRoom, setRecycleRoom] = useState("");
  const [recycleStudentRoom, setRecycleStudentRoom] = useState("");
  const [recycleStudentId, setRecycleStudentId] = useState("");

  const conductStudents = useMemo(
    () =>
      conductStudentRoom
        ? students.filter((s) => s.classRoom === conductStudentRoom)
        : [],
    [students, conductStudentRoom],
  );
  const recycleStudents = useMemo(
    () =>
      recycleStudentRoom
        ? students.filter((s) => s.classRoom === recycleStudentRoom)
        : [],
    [students, recycleStudentRoom],
  );

  function exportConduct() {
    if (conductScope === "all") {
      download("/api/exports/conduct?scope=all");
    } else if (conductScope === "room") {
      if (!conductRoom) return alert("กรุณาเลือกห้อง");
      download(`/api/exports/conduct?scope=room&classRoom=${encodeURIComponent(conductRoom)}`);
    } else {
      if (!conductStudentId) return alert("กรุณาเลือกนักเรียน");
      download(`/api/exports/conduct?scope=student&studentId=${conductStudentId}`);
    }
  }

  function exportRecycle() {
    if (recycleScope === "room") {
      if (!recycleRoom) return alert("กรุณาเลือกห้อง");
      download(`/api/exports/recycle?scope=room&classRoom=${encodeURIComponent(recycleRoom)}`);
    } else {
      if (!recycleStudentId) return alert("กรุณาเลือกนักเรียน");
      download(`/api/exports/recycle?scope=student&studentId=${recycleStudentId}`);
    }
  }

  const selectCls =
    "w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Conduct export */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-800">
          ส่งออกคะแนนความประพฤติ
        </h2>

        <div className="flex flex-wrap gap-2">
          {[
            { v: "all", l: "ทั้งหมด" },
            { v: "room", l: "รายห้อง" },
            { v: "student", l: "รายบุคคล" },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setConductScope(o.v as typeof conductScope)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                conductScope === o.v
                  ? "border-blue-800 bg-blue-50 text-blue-900"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>

        {conductScope === "room" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              เลือกห้อง
            </label>
            <select
              value={conductRoom}
              onChange={(e) => setConductRoom(e.target.value)}
              className={selectCls}
            >
              <option value="">-- เลือกห้อง --</option>
              {classRooms.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {conductScope === "student" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                1. เลือกห้อง
              </label>
              <select
                value={conductStudentRoom}
                onChange={(e) => {
                  setConductStudentRoom(e.target.value);
                  setConductStudentId("");
                }}
                className={selectCls}
              >
                <option value="">-- เลือกห้อง --</option>
                {classRooms.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                2. เลือกนักเรียน
              </label>
              <select
                value={conductStudentId}
                onChange={(e) => setConductStudentId(e.target.value)}
                disabled={!conductStudentRoom}
                className={`${selectCls} disabled:bg-slate-50 disabled:text-slate-400`}
              >
                <option value="">
                  {conductStudentRoom ? "-- เลือกนักเรียน --" : "เลือกห้องก่อน"}
                </option>
                {conductStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.studentCode} {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-400">
          {conductScope === "student"
            ? "ไฟล์จะมีข้อมูลนักเรียน + ประวัติการเพิ่ม/ลดคะแนนทั้งหมด"
            : "ไฟล์จะมีรายชื่อนักเรียนพร้อมคะแนนความประพฤติปัจจุบัน"}
        </p>

        <button
          type="button"
          onClick={exportConduct}
          className="rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          ดาวน์โหลด Excel
        </button>
      </div>

      {/* Recycle export */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-800">
          ส่งออกคะแนนขยะแลกแต้ม
        </h2>

        <div className="flex flex-wrap gap-2">
          {[
            { v: "room", l: "รายห้อง" },
            { v: "student", l: "รายบุคคล" },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setRecycleScope(o.v as typeof recycleScope)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                recycleScope === o.v
                  ? "border-blue-800 bg-blue-50 text-blue-900"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>

        {recycleScope === "room" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              เลือกห้อง
            </label>
            <select
              value={recycleRoom}
              onChange={(e) => setRecycleRoom(e.target.value)}
              className={selectCls}
            >
              <option value="">-- เลือกห้อง --</option>
              {classRooms.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {recycleScope === "student" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                1. เลือกห้อง
              </label>
              <select
                value={recycleStudentRoom}
                onChange={(e) => {
                  setRecycleStudentRoom(e.target.value);
                  setRecycleStudentId("");
                }}
                className={selectCls}
              >
                <option value="">-- เลือกห้อง --</option>
                {classRooms.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                2. เลือกนักเรียน
              </label>
              <select
                value={recycleStudentId}
                onChange={(e) => setRecycleStudentId(e.target.value)}
                disabled={!recycleStudentRoom}
                className={`${selectCls} disabled:bg-slate-50 disabled:text-slate-400`}
              >
                <option value="">
                  {recycleStudentRoom ? "-- เลือกนักเรียน --" : "เลือกห้องก่อน"}
                </option>
                {recycleStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.studentCode} {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-400">
          ไฟล์จะมีรายการบันทึกคะแนนขยะแลกแต้มพร้อมยอดรวม
        </p>

        <button
          type="button"
          onClick={exportRecycle}
          className="rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          ดาวน์โหลด Excel
        </button>
      </div>
    </div>
  );
}
