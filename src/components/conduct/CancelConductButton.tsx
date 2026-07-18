"use client";

import { cancelConductEntryAction } from "@/actions/conduct";
import CancelEntryButton from "@/components/CancelEntryButton";

export default function CancelConductButton({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  return (
    <form action={cancelConductEntryAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <CancelEntryButton
        message={`ต้องการยกเลิกรายการคะแนนของ "${label}" ใช่หรือไม่?`}
        detail="คะแนนของนักเรียนจะถูกปรับกลับคืน และรายการยังตรวจสอบย้อนหลังได้"
        className="text-red-600 hover:underline"
      />
    </form>
  );
}
