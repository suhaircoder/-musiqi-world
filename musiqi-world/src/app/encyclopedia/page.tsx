"use client";

import { Suspense } from "react";
import { EncyclopediaPage } from "@/views/encyclopedia";

export default function Page() {
  return (
    <Suspense>
      <EncyclopediaPage />
    </Suspense>
  );
}
