// Minimal type shim for react-cytoscapejs (no official @types package).
// The library wraps cytoscape in a React component; we expose only the props
// actually used by GraphCanvas.
declare module "react-cytoscapejs" {
  import type { Core, ElementDefinition, LayoutOptions, StylesheetStyle } from "cytoscape";
  import type { CSSProperties, ComponentType } from "react";

  export interface CytoscapeComponentProps {
    elements: ElementDefinition[];
    stylesheet?: StylesheetStyle[];
    style?: CSSProperties;
    className?: string;
    cy?: (cy: Core) => void;
    layout?: LayoutOptions;
    wheelSensitivity?: number;
    minZoom?: number;
    maxZoom?: number;
    zoom?: number;
    pan?: { x: number; y: number };
    zoomingEnabled?: boolean;
    userZoomingEnabled?: boolean;
    panningEnabled?: boolean;
    userPanningEnabled?: boolean;
    boxSelectionEnabled?: boolean;
    autoungrabify?: boolean;
    autolock?: boolean;
    autounselectify?: boolean;
  }

  const CytoscapeComponent: ComponentType<CytoscapeComponentProps>;
  export default CytoscapeComponent;
}
