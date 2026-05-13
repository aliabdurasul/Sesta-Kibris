"use client";
import React, { Suspense } from "react";
import Login from "@/views/auth/Login";

export default function Page() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
