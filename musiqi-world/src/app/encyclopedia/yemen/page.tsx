"use client";

import { Suspense } from "react";
import { YemenPage } from "@/views/encyclopedia";

export default function Page() {
  return (
    <Suspense>
      <YemenPage />
    </Suspense>
  );
}
