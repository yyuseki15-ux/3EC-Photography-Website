"use client";

import { useFormStatus } from "react-dom";

function DeleteButtonInner() {
  const { pending } = useFormStatus();

  return (
    <button
      className="danger-button"
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm("Delete this booking? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
    >
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}

export function DeleteButton() {
  return <DeleteButtonInner />;
}
