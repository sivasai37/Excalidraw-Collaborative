"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Copy, LogOut, AlertCircle, CheckCircle } from "lucide-react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

const Dashboard = () => {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [roomIdToJoin, setRoomIdToJoin] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const showMessage = (type: 'error' | 'success', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const createRoom = async () => {
    if (!roomName.trim()) {
      showMessage('error', 'Please enter a room name.');
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      showMessage('error', 'You are not authenticated.');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch(`${BACKEND}/room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: roomName }),
      });

      const data = await res.json();

      if (res.ok && data.roomId) {
        showMessage('success', `Room created! ID: ${data.roomId}`);
        setTimeout(() => router.push(`/canvas/${data.roomId}`), 1500);
      } else {
        showMessage('error', data.message || "Failed to create room.");
      }
    } catch {
      showMessage('error', "Connection error. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = () => {
    if (!roomIdToJoin.trim()) {
      showMessage('error', 'Please enter a valid room ID.');
      return;
    }

    router.push(`/canvas/${roomIdToJoin}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/signin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-12 max-w-4xl mx-auto">
        <div>
          <h1 className="text-4xl font-bold mb-2">🎨 Collaborative Drawing</h1>
          <p className="text-slate-400">Create or join a room to start drawing together</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 max-w-4xl mx-auto ${
          message.type === 'error' ? 'bg-red-900/30 border border-red-700' : 'bg-green-900/30 border border-green-700'
        }`}>
          {message.type === 'error' ? (
            <AlertCircle className="text-red-400" size={20} />
          ) : (
            <CheckCircle className="text-green-400" size={20} />
          )}
          <p className={message.type === 'error' ? 'text-red-200' : 'text-green-200'}>{message.text}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Create Room */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 hover:border-slate-600 transition">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600/20 p-3 rounded-lg">
              <Plus className="text-blue-400" size={24} />
            </div>
            <h2 className="text-2xl font-bold">Create Room</h2>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter room name (e.g., Design Project)"
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createRoom()}
              disabled={isCreating}
            />
            <button
              onClick={createRoom}
              disabled={isCreating || !roomName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={20} /> Create Room
                </>
              )}
            </button>
          </div>
        </div>

        {/* Join Room */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 hover:border-slate-600 transition">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-600/20 p-3 rounded-lg">
              <Copy className="text-green-400" size={24} />
            </div>
            <h2 className="text-2xl font-bold">Join Room</h2>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter room ID (numbers only)"
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-green-500 transition"
              value={roomIdToJoin}
              onChange={(e) => setRoomIdToJoin(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
            />
            <button
              onClick={joinRoom}
              disabled={!roomIdToJoin.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              <Copy size={20} /> Join Room
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center text-slate-400 max-w-4xl mx-auto">
        <p>💡 Tip: Share your room ID with others to collaborate in real-time!</p>
      </div>
    </div>
  );
};

export default Dashboard;
