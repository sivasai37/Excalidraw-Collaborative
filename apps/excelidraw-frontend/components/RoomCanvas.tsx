"use client";
import { WS_URL } from "@/config.ts";
import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";
 
export function RoomCanvas({ roomId }: { roomId: string }) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
            setError('Not authenticated. Please sign in.');
            return;
        }

        try {
            const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);

            ws.onopen = () => {
                setSocket(ws);
                ws.send(JSON.stringify({
                    type: 'join_room',
                    roomId: Number(roomId)
                }));
            };

            ws.onerror = (err) => {
                console.error('WebSocket error', err);
                setError('Failed to connect to room server');
            };

            ws.onclose = () => {
                setSocket(null);
            };

            return () => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'leave_room',
                        roomId: Number(roomId)
                    }));
                }
                ws.close();
            };
        } catch (err) {
            console.error('Failed to create WebSocket', err);
            setError('Failed to connect to room server');
        }
    }, [roomId])
    
    if (error) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#1a1a1a'
            }}>
                <div style={{ color: '#ff4444', fontSize: '16px' }}>
                    {error}
                </div>
            </div>
        );
    }

    if (!socket) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#1a1a1a',
                color: '#fff'
            }}>
                Connecting to room...
            </div>
        );
    }

    return <Canvas roomId={roomId} socket={socket} />;
}