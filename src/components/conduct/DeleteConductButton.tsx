"use client";

import { deleteConductEntryAction } from "@/actions/conduct";

export default function DeleteConductButton({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  return (
    <form action={deleteConductEntryAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-red-600 hover:underline"
        onClick={(e) => {
          if (
            !confirm(
              `ต้องการลบประวัติของ "${label}" ใช่หรือไม่?\nคะแนนของนักเรียนจะถูกปรับกลับคืน`,
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        ลบ
      </button>
    </form>
  );
}
