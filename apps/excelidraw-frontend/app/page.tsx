"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import {
  Pencil,
  Users2,
  Github,
  Download,
  Circle,
  Square,
  Type,
  Undo2,
  Trash2,
  Play,
  Pause,
  MessageSquare,
  Activity,
  Database,
  Lock,
  ArrowRight,
  MousePointer2,
  Sparkle
} from "lucide-react";
import Link from "next/link";

interface Shape {
  type: "pencil" | "rect" | "circle" | "text";
  x: number;
  y: number;
  w?: number;
  h?: number;
  radius?: number;
  points?: { x: number; y: number }[];
  text?: string;
  color: string;
  width: number;
  isSimulated?: boolean;
}

interface Collaborator {
  name: string;
  color: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  isDrawing: boolean;
}

// Preset templates for the mock dashboard
const RETRO_BLUEPRINT_PRESET: Shape[] = [
  { type: "rect", x: 40, y: 50, w: 120, h: 60, color: "#3b82f6", width: 2 },
  { type: "text", x: 50, y: 85, text: "Auth Serv", color: "#3b82f6", width: 2 },
  { type: "rect", x: 240, y: 50, w: 120, h: 60, color: "#3b82f6", width: 2 },
  { type: "text", x: 250, y: 85, text: "API Gateway", color: "#3b82f6", width: 2 },
  { type: "rect", x: 140, y: 160, w: 140, h: 60, color: "#eab308", width: 2 },
  { type: "text", x: 160, y: 195, text: "Postgres DB", color: "#eab308", width: 2 },
  { type: "pencil", points: [{ x: 160, y: 80 }, { x: 240, y: 80 }], color: "#ffffff", width: 2, x: 0, y: 0 },
  { type: "pencil", points: [{ x: 300, y: 110 }, { x: 210, y: 160 }], color: "#ffffff", width: 2, x: 0, y: 0 },
  { type: "pencil", points: [{ x: 100, y: 110 }, { x: 210, y: 160 }], color: "#ffffff", width: 2, x: 0, y: 0 }
];

const SYSTEM_ARCHITECTURE_PRESET: Shape[] = [
  { type: "circle", x: 100, y: 100, radius: 40, color: "#ec4899", width: 2 },
  { type: "text", x: 75, y: 105, text: "React 19", color: "#ec4899", width: 2 },
  { type: "circle", x: 260, y: 100, radius: 40, color: "#a855f7", width: 2 },
  { type: "text", x: 230, y: 105, text: "Next.js 15", color: "#a855f7", width: 2 },
  { type: "circle", x: 180, y: 200, radius: 45, color: "#22c55e", width: 2 },
  { type: "text", x: 145, y: 205, text: "Tailwind v4", color: "#22c55e", width: 2 }
];

const PRISMA_SCHEMA_PRESET: Shape[] = [
  { type: "rect", x: 50, y: 70, w: 260, h: 140, color: "#94a3b8", width: 2 },
  { type: "text", x: 70, y: 100, text: "Prisma Schema Model", color: "#94a3b8", width: 2 },
  { type: "rect", x: 80, y: 120, w: 200, h: 70, color: "#ef4444", width: 2 },
  { type: "text", x: 95, y: 160, text: "PrismaClient Singleton", color: "#ef4444", width: 2 }
];

const simScripts = [
  { type: "move", user: "Alice", x: 180, y: 80 },
  { type: "chat", user: "Alice", text: "Hey folks! Check out this real-time canvas preview.", color: "#22c55e" },
  { type: "draw_start", user: "Alice", x: 180, y: 80 },
  { type: "draw_move", user: "Alice", x: 230, y: 130 },
  {
    type: "draw_end",
    user: "Alice",
    shape: { type: "circle", x: 180, y: 80, radius: 30, color: "#22c55e", width: 2, isSimulated: true }
  },
  { type: "log", text: "Alice completed drawing a green circle" },
  
  { type: "move", user: "Charlie", x: 50, y: 200 },
  { type: "chat", user: "Charlie", text: "Nice! I will add a container box here.", color: "#3b82f6" },
  { type: "draw_start", user: "Charlie", x: 50, y: 200 },
  { type: "draw_move", user: "Charlie", x: 170, y: 260 },
  {
    type: "draw_end",
    user: "Charlie",
    shape: { type: "rect", x: 50, y: 200, w: 120, h: 60, color: "#3b82f6", width: 2, isSimulated: true }
  },
  { type: "log", text: "Charlie completed drawing a blue rectangle" },

  { type: "move", user: "David", x: 65, y: 235 },
  { type: "chat", user: "David", text: "Adding a text tag inside the box.", color: "#a855f7" },
  {
    type: "draw_end",
    user: "David",
    shape: { type: "text", x: 65, y: 235, text: "UI Component", color: "#a855f7", width: 2, isSimulated: true }
  },
  { type: "log", text: "David added text 'UI Component'" }
];

const drawPencilPath = (
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  color: string,
  width: number
) => {
  if (points.length < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
};

const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (shape.type === "pencil" && shape.points) {
    drawPencilPath(ctx, shape.points, shape.color, shape.width);
  } else if (shape.type === "rect" && shape.w !== undefined && shape.h !== undefined) {
    ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
  } else if (shape.type === "circle" && shape.radius !== undefined) {
    ctx.beginPath();
    ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
    ctx.stroke();
  } else if (shape.type === "text" && shape.text) {
    ctx.fillStyle = shape.color;
    ctx.font = `${shape.width === 2 ? 14 : shape.width === 5 ? 18 : 24}px sans-serif`;
    ctx.fillText(shape.text, shape.x, shape.y);
  }
};

export default function App() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedTool, setSelectedTool] = useState<"pencil" | "rect" | "circle" | "text">("pencil");
  const [selectedColor, setSelectedColor] = useState<string>("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [activePreset, setActivePreset] = useState<string>("Scratchpad");

  // Simulation controls
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [logs, setLogs] = useState<string[]>(["Workspace session initialized.", "Database connection verified."]);
  const [chats, setChats] = useState<{ user: string; text: string; color: string }[]>([
    { user: "System", text: "Welcome to the offline drawing demo dashboard!", color: "#94a3b8" }
  ]);

  // Drawing canvas states
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [textInput, setTextInput] = useState<{
    x: number;
    y: number;
    canvasX: number;
    canvasY: number;
    value: string;
  } | null>(null);

  // Simulated collaborators state
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { name: "Alice", color: "#22c55e", x: 80, y: 140, targetX: 80, targetY: 140, isDrawing: false },
    { name: "Charlie", color: "#3b82f6", x: 300, y: 120, targetX: 300, targetY: 120, isDrawing: false },
    { name: "David", color: "#a855f7", x: 220, y: 220, targetX: 220, targetY: 220, isDrawing: false }
  ]);

  // Scripted actions simulation
  const [scriptIndex, setScriptIndex] = useState<number>(0);

  // Helper: get coordinates relative to canvas
  const getMousePos = (canvas: HTMLCanvasElement, e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Canvas Drawing Operations
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear Canvas with smooth slate background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid points
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    const gridSize = 24;
    for (let x = 0; x < canvas.width; x += gridSize) {
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    // Draw saved shapes
    shapes.forEach((shape) => drawShape(ctx, shape));

    // Draw active pencil stroke
    if (isDrawing && selectedTool === "pencil" && currentPath.length > 0) {
      drawPencilPath(ctx, currentPath, selectedColor, strokeWidth);
    }

    // Draw active dragging preview (rectangle/circle)
    if (isDrawing && dragStart && dragCurrent) {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (selectedTool === "rect") {
        const w = dragCurrent.x - dragStart.x;
        const h = dragCurrent.y - dragStart.y;
        ctx.strokeRect(dragStart.x, dragStart.y, w, h);
      } else if (selectedTool === "circle") {
        const w = dragCurrent.x - dragStart.x;
        const h = dragCurrent.y - dragStart.y;
        const radius = Math.sqrt(w * w + h * h);
        ctx.beginPath();
        ctx.arc(dragStart.x, dragStart.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, [shapes, currentPath, isDrawing, dragStart, dragCurrent, selectedColor, selectedTool, strokeWidth]);

  // Resize canvas dynamic handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateSize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        redraw();
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [shapes, currentPath, isDrawing, dragStart, dragCurrent, redraw]);

  // Redraw canvas whenever shapes change
  useEffect(() => {
    redraw();
  }, [shapes, currentPath, isDrawing, dragStart, dragCurrent, redraw]);

  // Mouse Handlers for Drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === "text") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getMousePos(canvas, e);
    setIsDrawing(true);
    setDragStart(pos);
    setDragCurrent(pos);

    if (selectedTool === "pencil") {
      setCurrentPath([pos]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !dragStart) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getMousePos(canvas, e);
    setDragCurrent(pos);

    if (selectedTool === "pencil") {
      setCurrentPath((prev) => [...prev, pos]);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !dragStart) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getMousePos(canvas, e);

    if (selectedTool === "pencil") {
      if (currentPath.length > 1) {
        setShapes((prev) => [
          ...prev,
          {
            type: "pencil",
            x: dragStart.x,
            y: dragStart.y,
            points: currentPath,
            color: selectedColor,
            width: strokeWidth
          }
        ]);
        setLogs((prev) => ["You drew a custom line stroke.", ...prev.slice(0, 7)]);
      }
      setCurrentPath([]);
    } else if (selectedTool === "rect") {
      const w = pos.x - dragStart.x;
      const h = pos.y - dragStart.y;
      if (Math.abs(w) > 4 && Math.abs(h) > 4) {
        setShapes((prev) => [
          ...prev,
          {
            type: "rect",
            x: dragStart.x,
            y: dragStart.y,
            w,
            h,
            color: selectedColor,
            width: strokeWidth
          }
        ]);
        setLogs((prev) => ["You created a rectangle.", ...prev.slice(0, 7)]);
      }
    } else if (selectedTool === "circle") {
      const w = pos.x - dragStart.x;
      const h = pos.y - dragStart.y;
      const radius = Math.sqrt(w * w + h * h);
      if (radius > 4) {
        setShapes((prev) => [
          ...prev,
          {
            type: "circle",
            x: dragStart.x,
            y: dragStart.y,
            radius,
            color: selectedColor,
            width: strokeWidth
          }
        ]);
        setLogs((prev) => ["You created a circle.", ...prev.slice(0, 7)]);
      }
    }

    setDragStart(null);
    setDragCurrent(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool !== "text") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getMousePos(canvas, e);
    setTextInput({
      x: pos.x,
      y: pos.y,
      canvasX: pos.x,
      canvasY: pos.y,
      value: ""
    });
  };

  const handleUndo = () => {
    if (shapes.length > 0) {
      setShapes((prev) => prev.slice(0, -1));
      setLogs((prev) => ["Undo operation applied.", ...prev.slice(0, 7)]);
    }
  };

  const handleClear = () => {
    setShapes([]);
    setLogs((prev) => ["Workspace cleared.", ...prev.slice(0, 7)]);
  };

  // Preset templates handler
  const loadPreset = (name: string) => {
    setActivePreset(name);
    if (name === "Retro Blueprint") {
      setShapes(RETRO_BLUEPRINT_PRESET);
      setLogs((prev) => ["Loaded 'Retro Blueprint' layout.", ...prev.slice(0, 7)]);
    } else if (name === "System Architecture") {
      setShapes(SYSTEM_ARCHITECTURE_PRESET);
      setLogs((prev) => ["Loaded 'System Architecture' layout.", ...prev.slice(0, 7)]);
    } else if (name === "Prisma Schema Flow") {
      setShapes(PRISMA_SCHEMA_PRESET);
      setLogs((prev) => ["Loaded 'Prisma Schema Flow' layout.", ...prev.slice(0, 7)]);
    } else {
      setShapes([]);
      setLogs((prev) => ["Clean Scratchpad activated.", ...prev.slice(0, 7)]);
    }
  };

  // Cursors smooth interpolation loop
  useEffect(() => {
    let animId: number;
    const updateCursors = () => {
      setCollaborators((prev) =>
        prev.map((c) => {
          const dx = c.targetX - c.x;
          const dy = c.targetY - c.y;
          return {
            ...c,
            x: c.x + dx * 0.1,
            y: c.y + dy * 0.1
          };
        })
      );
      animId = requestAnimationFrame(updateCursors);
    };
    animId = requestAnimationFrame(updateCursors);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Scripted Collaboration Simulator Tick
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const action = simScripts[scriptIndex];
      if (!action) {
        // simulation loop finishes, clear simulated shapes and reset
        setTimeout(() => {
          setShapes((prev) => prev.filter((s) => !s.isSimulated));
          setLogs((prev) => ["Simulated items cleaned up.", ...prev.slice(0, 7)]);
          setScriptIndex(0);
        }, 3000);
        return;
      }

      // Execute script step
      if (action.type === "move") {
        setCollaborators((prev) =>
          prev.map((c) =>
            c.name === action.user
              ? { ...c, targetX: action.x as number, targetY: action.y as number }
              : c
          )
        );
      } else if (action.type === "chat") {
        setChats((prev) => [
          ...prev,
          { user: action.user as string, text: action.text as string, color: action.color as string }
        ]);
      } else if (action.type === "draw_start") {
        setCollaborators((prev) =>
          prev.map((c) =>
            c.name === action.user
              ? { ...c, isDrawing: true, targetX: action.x as number, targetY: action.y as number }
              : c
          )
        );
      } else if (action.type === "draw_move") {
        setCollaborators((prev) =>
          prev.map((c) =>
            c.name === action.user
              ? { ...c, targetX: action.x as number, targetY: action.y as number }
              : c
          )
        );
      } else if (action.type === "draw_end") {
        setCollaborators((prev) =>
          prev.map((c) => (c.name === action.user ? { ...c, isDrawing: false } : c))
        );
        if (action.shape) {
          setShapes((prev) => [...prev, action.shape as Shape]);
        }
      } else if (action.type === "log") {
        setLogs((prev) => [action.text as string, ...prev.slice(0, 7)]);
      }

      setScriptIndex((prev) => prev + 1);
    }, 1500);

    return () => clearInterval(interval);
  }, [isSimulating, scriptIndex]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Header / Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Pencil className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              ExcaliDraw Pro
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#demo" className="hover:text-white transition">Interactive Demo</a>
            <a href="https://github.com" className="hover:text-white transition">Source Code</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/signin">
              <span className="text-sm font-medium text-slate-400 hover:text-white transition cursor-pointer">
                Sign in
              </span>
            </Link>
            <Link href="/signup">
              <Button size="sm" variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-semibold shadow-md transition">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-radial-gradient from-blue-600/10 via-transparent to-transparent opacity-50 -z-10" />
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-blue-400 mb-8">
            <Sparkle className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
            Interactive Drawing Workspace Active
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-tight mb-8">
            Collaborative Drawing
            <span className="block text-blue-500 mt-2">Engineered for Teams</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">
            ExcaliDraw Pro connects developer and design teams through ultra-low latency canvas editing, powered by Next.js, WebSockets, and Neon PostgreSQL storage.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signin">
              <Button variant="primary" size="lg" className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 font-semibold shadow-lg shadow-blue-500/25 transition flex items-center gap-2">
                Open Collaborative Workspace
                <ArrowRight size={18} />
              </Button>
            </Link>
            <a href="#demo">
              <Button variant="outline" size="lg" className="h-12 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl px-8 font-semibold transition">
                Try Free Live Demo
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-20 pt-8 border-t border-slate-900 text-center">
            <div>
              <p className="text-3xl font-extrabold text-white">0ms</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Drawing Lag</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-white">99.9%</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Db Persistence</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-white">WSS</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Secure Protocol</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Interactive Demo Section */}
      <section id="demo" className="py-20 bg-slate-950 border-t border-slate-900">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
              Live Mock Dashboard Workspace
            </h2>
            <p className="text-slate-400 mt-4">
              Draw directly in the scratchpad below or select templates to test our state-of-the-art canvas rendering. Play the Multiplayer Simulation to watch team members draw in real-time.
            </p>
          </div>

          {/* Interactive Mock Dashboard Container */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md grid grid-cols-1 lg:grid-cols-4 h-[650px] relative">
            
            {/* Sidebar Left: Room templates & modes */}
            <div className="border-r border-slate-800/60 bg-slate-950/60 p-5 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Active Canvas
                  </h3>
                  <div className="space-y-2">
                    {[
                      { name: "Scratchpad", desc: "Start fresh with empty canvas" },
                      { name: "Retro Blueprint", desc: "Network services diagram" },
                      { name: "System Architecture", desc: "Framework relationships" },
                      { name: "Prisma Schema Flow", desc: "Client ORM models" }
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => loadPreset(preset.name)}
                        className={`w-full text-left p-3 rounded-xl border text-sm transition flex flex-col ${
                          activePreset === preset.name
                            ? "bg-blue-600/10 border-blue-500 text-blue-400"
                            : "border-slate-800 hover:border-slate-700 bg-slate-900/20 text-slate-300"
                        }`}
                      >
                        <span className="font-semibold text-sm">{preset.name}</span>
                        <span className="text-xs text-slate-500 mt-1">{preset.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Team Members (Demo)
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 border border-slate-800/30 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-400" />
                        <span className="font-medium text-slate-300">You (Client)</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Editor</span>
                    </div>
                    {collaborators.map((c) => (
                      <div
                        key={c.name}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 border border-slate-800/30 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full animate-pulse"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="font-medium text-slate-300">{c.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">Simulated</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Simulation Toggles */}
              <div className="pt-4 border-t border-slate-900 space-y-3">
                <button
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold border transition ${
                    isSimulating
                      ? "bg-emerald-600/10 border-emerald-500 text-emerald-400"
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  {isSimulating ? <Pause size={14} /> : <Play size={14} />}
                  {isSimulating ? "Multiplayer Sim: ON" : "Multiplayer Sim: OFF"}
                </button>
                <div className="flex items-center gap-2 justify-center text-[10px] text-slate-500">
                  <Database size={11} className="text-blue-500" />
                  <span>PostgreSQL Storage Sync Active</span>
                </div>
              </div>
            </div>

            {/* Drawing Canvas Area */}
            <div className="lg:col-span-2 flex flex-col bg-slate-950/20 relative h-full">
              {/* Floating Topbar */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 flex items-center gap-3 shadow-lg">
                <div className="flex items-center border-r border-slate-800 pr-3 gap-1">
                  {[
                    { tool: "pencil", icon: <Pencil size={15} />, tooltip: "Pencil (draw)" },
                    { tool: "rect", icon: <Square size={15} />, tooltip: "Rectangle" },
                    { tool: "circle", icon: <Circle size={15} />, tooltip: "Circle" },
                    { tool: "text", icon: <Type size={15} />, tooltip: "Text" }
                  ].map((item) => (
                    <button
                      key={item.tool}
                      onClick={() => {
                        setSelectedTool(item.tool as "pencil" | "rect" | "circle" | "text");
                        setTextInput(null);
                      }}
                      className={`p-2 rounded-lg transition ${
                        selectedTool === item.tool
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}
                      title={item.tooltip}
                    >
                      {item.icon}
                    </button>
                  ))}
                </div>

                {/* Color Selector */}
                <div className="flex items-center border-r border-slate-800 pr-3 gap-1.5">
                  {["#ffffff", "#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7"].map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`h-5 w-5 rounded-full border transition-transform ${
                        selectedColor === color ? "scale-125 border-white ring-2 ring-blue-500/30" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Thickness / Size */}
                <div className="flex items-center border-r border-slate-800 pr-3 gap-1">
                  {[2, 5, 10].map((width) => (
                    <button
                      key={width}
                      onClick={() => setStrokeWidth(width)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                        strokeWidth === width ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {width === 2 ? "Thin" : width === 5 ? "Med" : "Thick"}
                    </button>
                  ))}
                </div>

                {/* Undo / Clear operations */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleUndo}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
                    title="Undo shape"
                  >
                    <Undo2 size={15} />
                  </button>
                  <button
                    onClick={handleClear}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
                    title="Clear canvas"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Canvas Wrapper */}
              <div ref={containerRef} className="flex-1 w-full h-full min-h-[400px] relative overflow-hidden">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onClick={handleCanvasClick}
                  className="block w-full h-full cursor-crosshair"
                />

                {/* Simulated Cursors Overlay */}
                {collaborators.map((c) => (
                  <div
                    key={c.name}
                    className="absolute pointer-events-none transition-all duration-75 ease-out select-none flex flex-col items-start"
                    style={{
                      left: `${c.x}px`,
                      top: `${c.y}px`,
                      zIndex: 40
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <MousePointer2
                        className="h-4 w-4 transform -rotate-90 -mt-1 -ml-1 fill-current stroke-current"
                        style={{ color: c.color }}
                      />
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-md block border"
                        style={{
                          backgroundColor: c.color,
                          borderColor: c.color
                        }}
                      >
                        {c.name} {c.isDrawing && "✍️"}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Text Tool Modal Overlay Input */}
                {textInput && (
                  <input
                    type="text"
                    value={textInput.value}
                    onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (textInput.value.trim()) {
                          setShapes((prev) => [
                            ...prev,
                            {
                              type: "text",
                              x: textInput.canvasX,
                              y: textInput.canvasY,
                              text: textInput.value,
                              color: selectedColor,
                              width: strokeWidth
                            }
                          ]);
                          setLogs((prev) => [`You added text: '${textInput.value}'`, ...prev.slice(0, 7)]);
                        }
                        setTextInput(null);
                      } else if (e.key === "Escape") {
                        setTextInput(null);
                      }
                    }}
                    onBlur={() => {
                      if (textInput.value.trim()) {
                        setShapes((prev) => [
                          ...prev,
                          {
                            type: "text",
                            x: textInput.canvasX,
                            y: textInput.canvasY,
                            text: textInput.value,
                            color: selectedColor,
                            width: strokeWidth
                          }
                        ]);
                        setLogs((prev) => [`You added text: '${textInput.value}'`, ...prev.slice(0, 7)]);
                      }
                      setTextInput(null);
                    }}
                    autoFocus
                    style={{
                      position: "absolute",
                      left: `${textInput.x}px`,
                      top: `${textInput.y - 12}px`,
                      background: "#1e293b",
                      color: selectedColor,
                      border: "1px solid #3b82f6",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      outline: "none",
                      fontFamily: "sans-serif",
                      fontSize: strokeWidth === 2 ? "14px" : strokeWidth === 5 ? "18px" : "24px",
                      zIndex: 50,
                      width: "160px"
                    }}
                  />
                )}
              </div>
            </div>

            {/* Sidebar Right: Chat and Activity Feed */}
            <div className="border-l border-slate-800/60 bg-slate-950/60 p-5 flex flex-col h-full overflow-hidden">
              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-slate-400" />
                    Collaborator Chat
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800 text-xs">
                  {chats.map((chat, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-slate-900/50 border border-slate-800/20">
                      <div className="font-semibold" style={{ color: chat.color }}>
                        {chat.user}
                      </div>
                      <p className="text-slate-300 mt-0.5 leading-relaxed">{chat.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0 pt-5 border-t border-slate-900 mt-5">
                <div className="mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                    <Activity size={13} className="text-slate-400" />
                    Session Activity Logs
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-800 text-[11px] font-mono text-slate-400">
                  {logs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-blue-500 select-none">▶</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Showcase Grid Section */}
      <section id="features" className="py-24 bg-slate-950/40 border-t border-slate-900">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 bg-slate-900/30 border border-slate-800/80 rounded-2xl hover:border-blue-500/30 transition shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="bg-blue-600/10 p-3 rounded-xl inline-block text-blue-500">
                  <Users2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Multiplayer Editing</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Collaborate simultaneously with coworkers or clients. Watch cursors glide, draw shapes, and place text coordinates with sub-100ms latency sync.
                </p>
              </div>
            </Card>

            <Card className="p-8 bg-slate-900/30 border border-slate-800/80 rounded-2xl hover:border-emerald-500/30 transition shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="bg-emerald-600/10 p-3 rounded-xl inline-block text-emerald-500">
                  <Database className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Db Persistence</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Every brushstroke is persisted directly to Neon PostgreSQL. Reload rooms at any point to restore drawings and team chats instantly.
                </p>
              </div>
            </Card>

            <Card className="p-8 bg-slate-900/30 border border-slate-800/80 rounded-2xl hover:border-purple-500/30 transition shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="bg-purple-600/10 p-3 rounded-xl inline-block text-purple-500">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Vulnerability Audited</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Secured with strong JWT secret structures. Database queries utilize Prisma transactional safety checks to eliminate SQL injections.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 mt-auto">
        <div className="container mx-auto px-4 max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-xs text-slate-500">
            © 2026 ExcaliDraw Pro Clone. Built with Next.js 15, Tailwind v4 and React 19. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a href="https://github.com" className="text-slate-500 hover:text-white transition">
              <Github className="h-5 w-5" />
            </a>
            <a href="#" className="text-slate-500 hover:text-white transition">
              <Download className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
