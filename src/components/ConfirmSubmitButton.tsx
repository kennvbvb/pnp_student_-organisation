"use client";

import { useId, useRef } from "react";

/**
 * Submit button that opens an accessible confirmation dialog before
 * submitting its parent form. Central replacement for window.confirm.
 *
 * Uses the native <dialog> element: focus trap, Escape-to-close, backdrop,
 * and focus restore to the trigger button all come for free.
 */
export default function ConfirmSubmitButton({
  title = "ยืนยันการลบ",
  message,
  detail,
  confirmLabel = "ลบ",
  ariaLabel,
  className,
  children,
}: {
  title?: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  /** Accessible name for the trigger button when its content is an icon. */
  ariaLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const messageId = useId();

  function confirmAndSubmit() {
    dialogRef.current?.close();
    triggerRef.current?.form?.requestSubmit();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="submit"
        aria-label={ariaLabel}
        title={ariaLabel}
        className={className}
        onClick={(e) => {
          e.preventDefault();
          dialogRef.current?.showModal();
        }}
      >
        {children}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={headingId}
        aria-describedby={messageId}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl p-0 shadow-xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm"
        onClick={(e) => {
          // A click on the backdrop targets the dialog element itself.
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="p-5 text-left">
          <h2 id={headingId} className="text-base font-bold text-slate-800">
            {title}
          </h2>
          <p id={messageId} className="mt-2 text-sm text-slate-600">
            {message}
          </p>
          {detail && <p className="mt-1 text-xs text-slate-400">{detail}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={confirmAndSubmit}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
