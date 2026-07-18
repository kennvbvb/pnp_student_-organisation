"use client";

import { cancelWasteEntryAction } from "@/actions/recycle";
import CancelEntryButton from "@/components/CancelEntryButton";

export default function CancelWasteButton({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  return (
    <form action={cancelWasteEntryAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <CancelEntryButton
        message={`ต้องการยกเลิกรายการ "${label}" ใช่หรือไม่?`}
        detail="คะแนนนี้จะไม่ถูกนับรวม และรายการยังตรวจสอบย้อนหลังได้"
        className="text-red-600 hover:underline"
      />
    </form>
  );
}
