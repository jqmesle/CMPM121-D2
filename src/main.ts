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

function drawStroke(stroke: Stroke, target: CanvasRenderingContext2D) {
  if (stroke.points.length === 0) return;

  target.save();
  target.strokeStyle = stroke.color;
  target.lineWidth = stroke.width;
  target.lineCap = "round";
  target.lineJoin = "round";

  target.beginPath();
  const [first, ...rest] = stroke.points;
  target.moveTo(first.x, first.y);
  if (rest.length === 0) {
    target.lineTo(first.x, first.y);
  }
  for (const point of rest) {
    target.lineTo(point.x, point.y);
  }
  target.stroke();
  target.restore();
}

function drawSticker(sticker: Sticker, target: CanvasRenderingContext2D) {
  target.save();
  target.font = `${sticker.size}px Arial`;
  target.textAlign = "center";
  target.textBaseline = "middle";
  target.fillText(sticker.text, sticker.position.x, sticker.position.y);
  target.restore();
}

function addCommand(command: DrawCommand) {
  commands.push(command);
  redoStack.length = 0;
  updateHistoryButtons();
}

function replay(target: CanvasRenderingContext2D) {
  for (const command of commands) {
    command.draw(target);
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  replay(ctx);
  if (currentStroke !== null) drawStroke(currentStroke, ctx);
  if (currentSticker !== null) drawSticker(currentSticker, ctx);
}

function getPointerPos(event: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function endGesture() {
  const pointerId = currentPointerId;
  currentStroke = null;
  currentSticker = null;
  currentPointerId = null;
  if (pointerId !== null && canvas.hasPointerCapture(pointerId)) {
    canvas.releasePointerCapture(pointerId);
  }
}

function cancelGesture() {
  if (currentPointerId === null) return;
  endGesture();
  render();
}
