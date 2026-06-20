export type Tool = 'circle' | 'rect' | 'pencil' | 'text';

interface Shape {
  id?: number;
  type: 'rect' | 'circle' | 'pencil';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  centerX?: number;
  centerY?: number;
  radius?: number;
  points?: { x: number; y: number }[];
  color?: string;
  width_?: number;
}

interface TextItem {
  id?: number;
  type: 'text';
  x: number;
  y: number;
  text: string;
  color?: string;
  fontSize?: number;
}

type DrawItem = Shape | TextItem;

const STROKE_COLOR = '#ffffff';
const FILL_COLOR = 'rgba(0, 0, 0, 1)';
const TEXT_COLOR = '#ffffff';
const TEXT_SIZE = 16;

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private shapes: Shape[] = [];
  private texts: TextItem[] = [];
  private roomId: string;
  private socket: WebSocket;
  private selectedTool: Tool = 'circle';
  private isDrawing = false;
  private startX = 0;
  private startY = 0;
  private currentPath: { x: number; y: number }[] = [];

  // Bound handlers for cleanup
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundClick: (e: MouseEvent) => void;

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.roomId = roomId;
    this.socket = socket;

    // Bind handlers
    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundClick = this.handleCanvasClick.bind(this);

    this.init();
  }

  private async init() {
    this.attachEventListeners();
    this.attachWebSocketListeners();
    this.render();
  }

  private attachEventListeners() {
    this.canvas.addEventListener('mousedown', this.boundMouseDown);
    this.canvas.addEventListener('mouseup', this.boundMouseUp);
    this.canvas.addEventListener('mousemove', this.boundMouseMove);
    this.canvas.addEventListener('click', this.boundClick);
  }

  private attachWebSocketListeners() {
    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'init_pencil') {
          this.shapes = (msg.strokes || []).map((s: any) => ({
            ...s,
            points: typeof s.pathData === 'string' ? JSON.parse(s.pathData) : s.pathData
          }));
          this.render();
        }

        if (msg.type === 'init_text') {
          this.texts = msg.texts || [];
          this.render();
        }

        if (msg.type === 'pencil') {
          const stroke = msg.stroke;
          if (stroke) {
            this.shapes.push({
              type: 'pencil',
              points: stroke.path,
              color: stroke.color || STROKE_COLOR,
              width_: stroke.width || 2,
              id: stroke.id
            });
            this.render();
          }
        }

        if (msg.type === 'text') {
          const text = msg.text;
          if (text) {
            this.texts.push({
              type: 'text',
              x: text.x,
              y: text.y,
              text: text.value,
              color: text.color || TEXT_COLOR,
              fontSize: text.fontSize || TEXT_SIZE,
              id: text.id
            });
            this.render();
          }
        }

        if (msg.type === 'chat') {
          // Legacy chat messages - parse as shape for backward compatibility
          try {
            const parsedShape = JSON.parse(msg.message);
            if (parsedShape.shape) {
              this.shapes.push(parsedShape.shape);
              this.render();
            }
          } catch (e) {
            console.error('Failed to parse chat message', e);
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message', err);
      }
    };
  }

  private handleMouseDown(e: MouseEvent) {
    if (this.selectedTool === 'text') return;

    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;

    if (this.selectedTool === 'pencil') {
      this.currentPath = [{ x: this.startX, y: this.startY }];
    }
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isDrawing) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.selectedTool === 'pencil') {
      this.currentPath.push({ x, y });
      this.render();
    } else {
      // For rect/circle, render preview
      this.render();
      const width = x - this.startX;
      const height = y - this.startY;

      this.ctx.strokeStyle = STROKE_COLOR;
      this.ctx.lineWidth = 2;

      if (this.selectedTool === 'rect') {
        this.ctx.strokeRect(this.startX, this.startY, width, height);
      } else if (this.selectedTool === 'circle') {
        const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
        const centerX = this.startX + (width > 0 ? radius : -radius);
        const centerY = this.startY + (height > 0 ? radius : -radius);
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }
  }

  private handleMouseUp(e: MouseEvent) {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    const rect = this.canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const width = endX - this.startX;
    const height = endY - this.startY;

    let shape: Shape | null = null;

    if (this.selectedTool === 'pencil' && this.currentPath.length > 0) {
      shape = {
        type: 'pencil',
        points: this.currentPath,
        color: STROKE_COLOR,
        width_: 2
      };
      this.currentPath = [];
    } else if (this.selectedTool === 'rect') {
      shape = {
        type: 'rect',
        x: this.startX,
        y: this.startY,
        width,
        height
      };
    } else if (this.selectedTool === 'circle') {
      const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
      shape = {
        type: 'circle',
        centerX: this.startX + (width > 0 ? radius : -radius),
        centerY: this.startY + (height > 0 ? radius : -radius),
        radius: Math.abs(radius)
      };
    }

    if (shape) {
      this.shapes.push(shape);
      this.render();

      // Send via WebSocket
      if (this.selectedTool === 'pencil') {
        this.socket.send(JSON.stringify({
          type: 'pencil',
          roomId: Number(this.roomId),
          stroke: {
            path: shape.points,
            color: shape.color || STROKE_COLOR,
            width: shape.width_ || 2
          }
        }));
      } else {
        // Send legacy chat format for rect/circle
        this.socket.send(JSON.stringify({
          type: 'chat',
          message: JSON.stringify({ shape }),
          roomId: Number(this.roomId)
        }));
      }
    }
  }

  private handleCanvasClick(e: MouseEvent) {
    if (this.selectedTool !== 'text') return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Prompt for text input
    const text = window.prompt('Enter text:');
    if (!text) return;

    const textItem: TextItem = {
      type: 'text',
      x,
      y,
      text,
      color: TEXT_COLOR,
      fontSize: TEXT_SIZE
    };

    this.texts.push(textItem);
    this.render();

    // Send via WebSocket
    this.socket.send(JSON.stringify({
      type: 'text',
      roomId: Number(this.roomId),
      text: {
        x,
        y,
        value: text,
        color: TEXT_COLOR,
        fontSize: TEXT_SIZE
      }
    }));
  }

  private render() {
    // Clear canvas
    this.ctx.fillStyle = FILL_COLOR;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw all shapes
    this.shapes.forEach(shape => this.drawShape(shape));

    // Draw all text
    this.texts.forEach(text => this.drawText(text));

    // Draw current pencil path
    if (this.selectedTool === 'pencil' && this.currentPath.length > 0) {
      this.drawPencilPath(this.currentPath);
    }
  }

  private drawShape(shape: Shape) {
    this.ctx.strokeStyle = shape.color || STROKE_COLOR;
    this.ctx.lineWidth = 2;

    if (shape.type === 'rect' && shape.x !== undefined && shape.y !== undefined) {
      this.ctx.strokeRect(shape.x, shape.y, shape.width || 0, shape.height || 0);
    } else if (shape.type === 'circle' && shape.centerX !== undefined) {
      this.ctx.beginPath();
      this.ctx.arc(shape.centerX, shape.centerY!, Math.abs(shape.radius || 0), 0, Math.PI * 2);
      this.ctx.stroke();
    } else if (shape.type === 'pencil' && shape.points) {
      this.drawPencilPath(shape.points, shape.color);
    }
  }

  private drawPencilPath(points: { x: number; y: number }[], color?: string) {
    if (points.length === 0) return;

    this.ctx.strokeStyle = color || STROKE_COLOR;
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }

    this.ctx.stroke();
  }

  private drawText(textItem: TextItem) {
    this.ctx.fillStyle = textItem.color || TEXT_COLOR;
    this.ctx.font = `${textItem.fontSize || TEXT_SIZE}px Arial`;
    this.ctx.fillText(textItem.text, textItem.x, textItem.y);
  }

  public setTool(tool: Tool) {
    this.selectedTool = tool;
  }

  public destroy() {
    this.canvas.removeEventListener('mousedown', this.boundMouseDown);
    this.canvas.removeEventListener('mouseup', this.boundMouseUp);
    this.canvas.removeEventListener('mousemove', this.boundMouseMove);
    this.canvas.removeEventListener('click', this.boundClick);
  }
}