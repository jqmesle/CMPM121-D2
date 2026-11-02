import "./style.css";

const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "D2 project";

const message = document.createElement("p");
message.textContent = "Your project starts here.";

app.append(heading, message);

const canvas = document.createElement("canvas");
canvas.width = 800;
canvas.height = 600;

const ctx = canvas.getContext("2d")!;

app.append(canvas);

type Point = { x: number; y: number };

type Stroke = {
  points: Point[];
  color: string;
  width: number;
};

type Sticker = {
  position: Point;
  text: string;
  size: number;
};

type DrawCommand = {
  draw: (target: CanvasRenderingContext2D) => void;
};

type Tool = {
  name: string;
  kind: "marker" | "sticker";
  color?: string;
  width?: number;
  text?: string;
  size?: number;
};

const commands: DrawCommand[] = [];
const redoStack: DrawCommand[] = [];

let currentStroke: Stroke | null = null;
let currentSticker: Sticker | null = null;
let currentPointerId: number | null = null;

const tools: Tool[] = [
  { name: "Normal", kind: "marker", color: "black", width: 4 },
  { name: "Thin", kind: "marker", color: "black", width: 2 },
  { name: "Thick", kind: "marker", color: "black", width: 8 },
  { name: "Smiley Face", kind: "sticker", text: ":)", size: 40 },
];

let selectedTool = tools[0];
