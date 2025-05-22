export const LAYOUT_CONFIG = {
  // Spacing configuration
  NODE_GAP: 350, // Increased minimum distance between nodes

  // Canvas dimensions
  CANVAS_WIDTH: 2400,
  CANVAS_HEIGHT: 1400,

  // Node dimensions
  NODE_WIDTH: 300,
  NODE_HEIGHT: 100,

  // Visual settings
  EDGE_STROKE_WIDTH: 2,
  EDGE_COLOR: "#60A5FA",
  EDGE_HOVER_COLOR: "#93C5FD",

  // Animation
  EDGE_ANIMATION_SPEED: "0.8s",

  // Layout
  MIN_ZOOM: 0.01,
  MAX_ZOOM: 5.5,
  FIT_VIEW_PADDING: 0.2,
};

export const aiIntractions = [
  {
    id: 1,
    label: "Sequential Intraction",
    description: "Agents Work One By One",
    value: "sequential",
    icon: "/knowledge/sequential.svg",
  },
  {
    id: 2,
    label: "Unstructured Cohesive Interaction",
    description:
      "Agent work Parrellaly and establish meaning full communication with each other",
    value: "unstructured",
    icon: "/knowledge/unsturctredC.svg",
  },
];

// animation for stack sidebar
export const variants = {
  open: {
    x: 0,
    width: "60%",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  closed: {
    x: "100%",
    width: "auto",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
};
