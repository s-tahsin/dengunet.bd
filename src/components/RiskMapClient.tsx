"use client";

import dynamic from "next/dynamic";

// Leaflet needs the browser `window`, so the map only renders on the client.
const RiskMapClient = dynamic(() => import("@/components/RiskMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[var(--sea)] text-muted">Loading map…</div>
  ),
});

export default RiskMapClient;
