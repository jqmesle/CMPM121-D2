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

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || currentPointerId !== null) return;

  const start = getPointerPos(event);
  if (selectedTool.kind === "marker") {
    currentStroke = {
      points: [start],
      color: selectedTool.color ?? "black",
      width: selectedTool.width ?? 4,
    };
  } else {
    currentSticker = {
      position: start,
      text: selectedTool.text ?? "",
      size: selectedTool.size ?? 40,
    };
  }

  currentPointerId = event.pointerId;
  canvas.setPointerCapture(event.pointerId);
  render();
});

canvas.addEventListener("pointermove", (event) => {
  if (event.pointerId !== currentPointerId) return;

  const pos = getPointerPos(event);
  if (currentStroke !== null) {
    currentStroke.points.push(pos);
  } else if (currentSticker !== null) {
    currentSticker.position = pos;
  }
  render();
});

canvas.addEventListener("pointerup", (event) => {
  if (event.pointerId !== currentPointerId) return;

  if (currentStroke !== null) {
    const stroke = currentStroke;
    addCommand({ draw: (target) => drawStroke(stroke, target) });
  }
  if (currentSticker !== null) {
    const sticker = currentSticker;
    addCommand({ draw: (target) => drawSticker(sticker, target) });
  }

  endGesture();
  render();
});

canvas.addEventListener("pointercancel", (event) => {
  if (event.pointerId !== currentPointerId) return;

  cancelGesture();
});

canvas.addEventListener("lostpointercapture", (event) => {
  if (event.pointerId === currentPointerId) cancelGesture();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") cancelGesture();
});

const toolHeading = document.createElement("h3");
toolHeading.textContent = "Drawing Tools";

const toolButtons = document.createElement("div");
toolButtons.className = "tool-buttons";

function showTools() {
  toolButtons.replaceChildren();

  for (const tool of tools) {
    const button = document.createElement("button");
    button.textContent = tool.name;
    button.classList.toggle("selected", tool === selectedTool);
    button.addEventListener("click", () => {
      cancelGesture();
      selectedTool = tool;
      showTools();
    });
    toolButtons.append(button);
  }
}

showTools();
app.append(toolHeading, toolButtons);

const customHeading = document.createElement("h3");
customHeading.textContent = "Create a custom sticker";

const nameInput = document.createElement("input");
nameInput.placeholder = "Sticker name";

const stickerInput = document.createElement("input");
stickerInput.placeholder = "Emoji or text";

const createButton = document.createElement("button");
createButton.textContent = "Create Sticker";

createButton.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const text = stickerInput.value.trim();
  if (name === "" || text === "") return; // cancelled/empty: no tool, no document change

  const newTool: Tool = { name, kind: "sticker", text, size: 40 };
  tools.push(newTool);
  selectedTool = newTool;

  nameInput.value = "";
  stickerInput.value = "";
  showTools();
});

app.append(customHeading, nameInput, stickerInput, createButton);
