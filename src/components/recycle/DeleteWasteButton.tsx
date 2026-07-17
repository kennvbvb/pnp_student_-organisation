"use client";

import { deleteWasteEntryAction } from "@/actions/recycle";

export default function DeleteWasteButton({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  return (
    <form action={deleteWasteEntryAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-red-600 hover:underline"
        onClick={(e) => {
          if (!confirm(`ต้องการลบประวัติ "${label}" ใช่หรือไม่?`)) {
            e.preventDefault();
          }
        }}
      >
        ลบ
      </button>
    </form>
  );
}
