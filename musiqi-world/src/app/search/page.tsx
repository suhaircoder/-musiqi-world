"use client";

import { Suspense } from "react";
import { SearchPage } from "@/views/pages";

export default function Page() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}
