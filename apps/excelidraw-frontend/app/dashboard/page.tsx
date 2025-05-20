"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const Dashboard = () => {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [roomIdToJoin, setRoomIdToJoin] = useState("");

  const createRoom = async () => {
    if (!roomName.trim()) {
      alert("Please enter a room name to create.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not authenticated.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3002/room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: roomName }),
      });

      const data = await res.json();

      if (res.ok && data.roomId) {
        router.push(`/canvas/${data.roomId}`);
      } else {
        alert(data.message || "Failed to create room.");
      }
    } catch (err) {
      alert("Something went wrong while creating the room.");
    }
  };

  const joinRoom = () => {
    if (!roomIdToJoin.trim()) {
      alert("Please enter a valid room ID to join.");
      return;
    }

    router.push(`/canvas/${roomIdToJoin}`);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center gap-6">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Welcome! 🎨</h1>

        {/* Create Room */}
        <input
          type="text"
          placeholder="Enter room name to create"
          className="w-full p-2 border rounded"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          onClick={createRoom}
        >
          Create Room
        </button>

        {/* Join Room */}
        <input
          type="text"
          placeholder="Enter room ID to join"
          className="w-full p-2 border rounded"
          value={roomIdToJoin}
          onChange={(e) => setRoomIdToJoin(e.target.value)}
        />
        <button
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          onClick={joinRoom}
        >
          Join Room
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
