import React from "react";
import MobileShell from "@/layouts/MobileShell";

export default function CustomerLayout({ children }) {
  return <MobileShell variant="customer">{children}</MobileShell>;
}
