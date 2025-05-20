"use client";
import { WS_URL } from "@/config.ts";
 import { useEffect,  useState } from "react";
 import { Canvas } from "./Canvas";
 
 export function RoomCanvas({roomId}: {roomId: string}) {
     const [socket, setSocket] = useState<WebSocket | null>(null);
 
     useEffect(() => {
         const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyMjc1ZDhhZC0zZTRhLTQ5ZGEtYjJhNy03ZTIyYTFjN2FlZTQiLCJpYXQiOjE3NDQ1NDI5Mjh9.Rz-qr7NscQ8FUnjReRL-WHcZQQq2EnIeBaEUHY8KZxA`)
 
         ws.onopen = () => {
             setSocket(ws);
             const data = JSON.stringify({
                 type: "join_room",
                 roomId
             });
             console.log(data);
             ws.send(data)
         }
         
     }, [])
    
     if (!socket) {
         return <div style={{
            display: "flex",
            justifyContent: "center", // horizontal center
            alignItems: "center",     // vertical center
            height: "100vh",
  
   
         }}>
             Connecting to server....
         </div>
     }
 
     return <div>
         <Canvas roomId={roomId} socket={socket} />
     </div>
 }