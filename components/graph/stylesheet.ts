import type { Css, StylesheetStyle } from "cytoscape";

import type { EntityType, RelationshipType } from "@/lib/entityTypes";

// Hex colors matching Mantine's default palette shade 5 for each theme color.
// We can't pull CSS custom properties at stylesheet-build time (cytoscape needs
// literal values), so we embed the hexes directly.
const ENTITY_COLOR_HEX: Record<EntityType, string> = {
  PERSON: "#4c6ef5", // blue
  ORGANIZATION: "#be4bdb", // grape
  DOMAIN: "#12b886", // teal
  IP_ADDRESS: "#15aabf", // cyan
  EMAIL: "#fab005", // yellow
  PHONE: "#e64980", // pink
  URL: "#4c4cb5", // indigo
  CRYPTO_ADDRESS: "#fd7e14", // orange
};

const REL_COLOR_HEX: Record<RelationshipType | "DEFAULT", string> = {
  OWNS: "#495057",
  EMPLOYED_BY: "#1864ab",
  REGISTERED_BY: "#862e9c",
  HOSTED_ON: "#0b7285",
  RESOLVES_TO: "#0ca678",
  ASSOCIATED_WITH: "#868e96",
  COMMUNICATED_WITH: "#e8590c",
  MENTIONS: "#ae3ec9",
  DEFAULT: "#495057",
};

// Stylesheet entries use cytoscape's loose CSS-map shape. The packaged types
// are stricter than what the runtime accepts (e.g. target-arrow-scale is
// missing from Css.Edge), so we model each block as StylesheetStyle and cast
// the inner style maps as needed.
export function buildStylesheet(): StylesheetStyle[] {
  const entitySelectors = (Object.keys(ENTITY_COLOR_HEX) as EntityType[]).map((t) => ({
    selector: `node[type = "${t}"]`,
    style: {
      "background-color": ENTITY_COLOR_HEX[t],
      "border-color": "#ffffff",
      "border-width": 2,
    } as Css.Node,
  }));

  const relSelectors = (Object.keys(REL_COLOR_HEX) as (RelationshipType | "DEFAULT")[]).map(
    (t) => ({
      selector: t === "DEFAULT" ? "edge" : `edge[rel_type = "${t}"]`,
      style: {
        "line-color": REL_COLOR_HEX[t],
        "target-arrow-color": REL_COLOR_HEX[t],
      } as Css.Edge,
    }),
  );

  return [
    {
      selector: "node",
      style: {
        label: "data(label)",
        color: "#e9ecef",
        "font-size": 11,
        "font-weight": 500,
        "text-outline-color": "#1a1b1e",
        "text-outline-width": 1,
        "text-valign": "bottom",
        "text-margin-y": 4,
        width: 36,
        height: 36,
        "overlay-opacity": 0,
      },
    },
    ...entitySelectors,
    {
      selector: "edge",
      style: {
        width: 2,
        "curve-style": "bezier",
        "target-arrow-shape": "triangle",
        "target-arrow-scale": 1.2,
        opacity: 0.7,
      } as Css.Edge,
    },
    ...relSelectors,
    {
      selector: 'edge[rel_type = "ASSOCIATED_WITH"]',
      style: { "line-style": "dashed" },
    },
    {
      selector: "node:selected",
      style: {
        "border-color": "#fab005",
        "border-width": 4,
      },
    },
    {
      selector: "edge:selected",
      style: {
        width: 4,
        opacity: 1.0,
      },
    },
  ];
}
