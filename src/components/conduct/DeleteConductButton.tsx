"use client";

import { deleteConductEntryAction } from "@/actions/conduct";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

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
      <ConfirmSubmitButton
        message={`ต้องการลบประวัติของ "${label}" ใช่หรือไม่?`}
        detail="คะแนนของนักเรียนจะถูกปรับกลับคืน"
        className="text-red-600 hover:underline"
      >
        ลบ
      </ConfirmSubmitButton>
    </form>
  );
}
