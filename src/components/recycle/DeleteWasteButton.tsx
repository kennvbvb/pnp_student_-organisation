"use client";

import { deleteWasteEntryAction } from "@/actions/recycle";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

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
      <ConfirmSubmitButton
        message={`ต้องการลบประวัติ "${label}" ใช่หรือไม่?`}
        className="text-red-600 hover:underline"
      >
        ลบ
      </ConfirmSubmitButton>
    </form>
  );
}
