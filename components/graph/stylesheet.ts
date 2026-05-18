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
  SUBDOMAIN_OF: "#3bc9db",
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
        "text-margin-y": 6,
        width: 34,
        height: 34,
        "border-color": "rgba(255,255,255,0.12)",
        "border-width": 1.5,
        "overlay-opacity": 0,
        // Tween color / size / border smoothly on class or selection changes.
        "transition-property":
          "background-color, border-color, border-width, width, height, opacity",
        "transition-duration": 220,
        "transition-timing-function": "ease-out",
      } as Css.Node,
    },
    ...entitySelectors,
    {
      selector: "edge",
      style: {
        width: 1.6,
        "curve-style": "bezier",
        "target-arrow-shape": "triangle",
        "target-arrow-scale": 1.1,
        opacity: 0.55,
        "transition-property": "width, opacity, line-color",
        "transition-duration": 220,
        "transition-timing-function": "ease-out",
      } as Css.Edge,
    },
    ...relSelectors,
    {
      selector: 'edge[rel_type = "ASSOCIATED_WITH"]',
      style: { "line-style": "dashed" },
    },
    // Hovered node — grow slightly, thicker accent border, full label.
    {
      selector: "node.hovered",
      style: {
        width: 44,
        height: 44,
        "border-color": "#ffffff",
        "border-width": 2.5,
        "z-index": 99,
      } as Css.Node,
    },
    // Hovered edge — brighten + thicken.
    {
      selector: "edge.hovered",
      style: {
        width: 3,
        opacity: 1,
      } as Css.Edge,
    },
    // Dim everything that isn't connected to the hovered node for focus.
    {
      selector: ".faded",
      style: {
        opacity: 0.15,
      },
    },
    {
      selector: "node:selected",
      style: {
        "border-color": "#fab005",
        "border-width": 3.5,
        width: 42,
        height: 42,
      } as Css.Node,
    },
    {
      selector: "edge:selected",
      style: {
        width: 3.5,
        opacity: 1.0,
        "line-color": "#fab005",
        "target-arrow-color": "#fab005",
      } as Css.Edge,
    },
  ];
}
