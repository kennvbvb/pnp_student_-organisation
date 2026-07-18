"use client";

import { useId, useRef, useState } from "react";

/**
 * Submit button that opens a dialog asking for a required cancellation
 * reason before submitting its parent form. The reason is posted as the
 * `cancelReason` field. Used for soft-cancelling score entries.
 */
export default function CancelEntryButton({
  message,
  detail,
  className,
}: {
  message: string;
  detail?: string;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<string | null>(null);
  const headingId = useId();
  const messageId = useId();
  const reasonId = useId();

  function confirmCancel() {
    const reason = textareaRef.current?.value.trim() ?? "";
    if (!reason) {
      setError("กรุณาระบุเหตุผลการยกเลิก");
      textareaRef.current?.focus();
      return;
    }
    setError(null);
    dialogRef.current?.close();
    triggerRef.current?.form?.requestSubmit();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="submit"
        className={className}
        onClick={(e) => {
          e.preventDefault();
          setError(null);
          dialogRef.current?.showModal();
        }}
      >
        ยกเลิกรายการ
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={headingId}
        aria-describedby={messageId}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl p-0 shadow-xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="p-5 text-left">
          <h2 id={headingId} className="text-base font-bold text-slate-800">
            ยกเลิกรายการ
          </h2>
          <p id={messageId} className="mt-2 text-sm text-slate-600">
            {message}
          </p>
          {detail && <p className="mt-1 text-xs text-slate-400">{detail}</p>}

          <label
            htmlFor={reasonId}
            className="mt-4 mb-1 block text-xs font-medium text-slate-600"
          >
            เหตุผลการยกเลิก
          </label>
          <textarea
            id={reasonId}
            ref={textareaRef}
            name="cancelReason"
            rows={2}
            placeholder="เช่น บันทึกผิดคน, จำนวนผิด"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
          />
          {error && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {error}
            </p>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              ปิด
            </button>
            <button
              type="button"
              onClick={confirmCancel}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              ยืนยันการยกเลิก
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
