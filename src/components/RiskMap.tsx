"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { useApp } from "@/lib/store";
import { RISK_LABEL } from "@/lib/agents/risk";
import { MEDICINE_LABEL, LOW_STOCK } from "@/lib/agents/supply";
import { RISK_COLOR } from "@/components/Risk";
import type { Medicine } from "@/types";

const BD_BOUNDS: L.LatLngBoundsExpression = [
  [20.55, 87.95],
  [26.7, 92.75],
];

type DistrictFeature = Feature<Geometry, { id: string; name: string }>;

export interface MapLayers {
  hospitals: boolean;
  pharmacies: boolean;
}

function hospitalIcon(full: boolean) {
  const c = full ? "var(--risk-very-high)" : "var(--brand)";
  return L.divIcon({
    className: "",
    iconSize: [20, 20],
    html: `<div style="width:20px;height:20px;border-radius:5px;background:#fff;border:2px solid ${c};color:${c};font:700 14px/16px system-ui;text-align:center">+</div>`,
  });
}

const pharmacyIcon = L.divIcon({
  className: "",
  iconSize: [14, 14],
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid #6b4fa1"></div>`,
});

function FitAndFocus({ selectedId, features }: { selectedId: string | null; features: DistrictFeature[] }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) {
      map.flyToBounds(BD_BOUNDS, { duration: 0.6, padding: [10, 10] });
      return;
    }
    const f = features.find((x) => x.properties.id === selectedId);
    if (f) map.flyToBounds(L.geoJSON(f).getBounds(), { duration: 0.6, padding: [80, 80], maxZoom: 10 });
  }, [selectedId, features, map]);
  return null;
}

export default function RiskMap({
  selectedId,
  onSelect,
  layers,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  layers: MapLayers;
}) {
  const { risk, districts, hospitals, pharmacies } = useApp();
  const [shapes, setShapes] = useState<FeatureCollection<Geometry, { id: string; name: string }> | null>(null);
  const [neighbours, setNeighbours] = useState<FeatureCollection | null>(null);
  const selectRef = useRef(onSelect);
  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    fetch("/data/districts.geojson").then((r) => r.json()).then(setShapes);
    fetch("/data/neighbours.geojson").then((r) => r.json()).then(setNeighbours);
  }, []);

  const byId = useMemo(() => Object.fromEntries(districts.map((d) => [d.id, d])), [districts]);
  // Restyle when risk or selection changes
  const styleKey = useMemo(
    () => districts.map((d) => risk[d.id]?.level).join("|") + selectedId,
    [districts, risk, selectedId],
  );

  // Country view: only large hospitals, so the colours stay readable. District view: every hospital.
  const visibleHospitals = selectedId
    ? hospitals.filter((h) => h.district === selectedId)
    : hospitals.filter((h) => h.icuBeds >= 8);
  const visiblePharmacies = selectedId ? pharmacies.filter((p) => p.district === selectedId) : pharmacies;

  return (
    <MapContainer
      bounds={BD_BOUNDS}
      maxBounds={[
        [18.5, 85],
        [28.5, 95.5],
      ]}
      minZoom={6}
      zoomSnap={0.25}
      zoomControl={false}
      className="h-full w-full"
    >
      <ZoomControl position="bottomright" />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        opacity={0.55}
      />
      {neighbours && (
        <GeoJSON
          data={neighbours}
          interactive={false}
          style={{ color: "#a9b3af", weight: 1, fillColor: "#e9ecea", fillOpacity: 0.9 }}
        />
      )}
      {shapes && (
        <GeoJSON
          key={styleKey}
          data={shapes}
          style={(f) => {
            const id = (f as DistrictFeature).properties.id;
            const lvl = risk[id]?.level ?? "low";
            const sel = id === selectedId;
            return {
              color: sel ? "#15201c" : "#ffffff",
              weight: sel ? 3 : 0.8,
              fillColor: RISK_COLOR[lvl].startsWith("var(") ? getVar(RISK_COLOR[lvl]) : RISK_COLOR[lvl],
              fillOpacity: selectedId && !sel ? 0.55 : 0.82,
            };
          }}
          onEachFeature={(f, layer) => {
            const id = (f as DistrictFeature).properties.id;
            const d = byId[id];
            const r = risk[id];
            if (d && r) {
              layer.bindTooltip(
                `<strong>${d.name}</strong> · ${RISK_LABEL[r.level]} risk<br>${d.cases7d.toLocaleString()} cases this week<br>${d.freeBeds} of ${d.dengueBeds} dengue beds free`,
                { sticky: true, className: "district-tip", direction: "top", offset: [0, -8] },
              );
            }
            layer.on({
              click: () => selectRef.current(id),
              mouseover: (e) => (e.target as L.Path).setStyle({ weight: 2.5, color: "#15201c" }),
              mouseout: (e) =>
                (e.target as L.Path).setStyle({
                  weight: id === selectedId ? 3 : 0.8,
                  color: id === selectedId ? "#15201c" : "#ffffff",
                }),
            });
          }}
        />
      )}

      {layers.hospitals &&
        visibleHospitals.map((h) => (
          <Marker key={h.id} position={[h.lat, h.lng]} icon={hospitalIcon(h.freeBeds === 0)}>
            <Popup>
              <div className="text-[13px] leading-snug">
                <div className="font-semibold">{h.name}</div>
                <div>
                  {h.freeBeds === 0 ? "No dengue beds free" : `${h.freeBeds} of ${h.dengueBeds} dengue beds free`}
                </div>
                {h.icuBeds > 0 && <div>ICU: {h.icuFree} free</div>}
                <a href={`tel:${h.phone}`} className="font-semibold text-[var(--brand)]">
                  Call {h.phone}
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

      {layers.pharmacies &&
        visiblePharmacies.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={pharmacyIcon}>
            <Popup>
              <div className="text-[13px] leading-snug">
                <div className="font-semibold">{p.name}</div>
                {(Object.keys(p.stock) as Medicine[]).map((m) => (
                  <div key={m}>
                    {MEDICINE_LABEL[m]}:{" "}
                    {p.stock[m] === 0 ? "out of stock" : p.stock[m] < LOW_STOCK ? `low (${p.stock[m]})` : "in stock"}
                  </div>
                ))}
              </div>
            </Popup>
          </Marker>
        ))}

      {shapes && <FitAndFocus selectedId={selectedId} features={shapes.features} />}
    </MapContainer>
  );
}

// Leaflet draws SVG paths with attributes, so CSS variables need resolving to real colours.
function getVar(v: string) {
  const name = v.slice(4, -1);
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#999";
}
