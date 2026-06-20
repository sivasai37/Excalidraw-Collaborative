import { RoomCanvas } from "@/components/RoomCanvas";

interface CanvasPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function CanvasPage({ params }: CanvasPageProps) {
  const { roomId } = await params;

  return <RoomCanvas roomId={roomId} />;
}