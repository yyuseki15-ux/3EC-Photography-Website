"use client";

import { useEffect } from "react";

export function AutoClosePaymentPage() {
  useEffect(() => {
    window.open("", "_self");
    window.close();
  }, []);

  return null;
}
