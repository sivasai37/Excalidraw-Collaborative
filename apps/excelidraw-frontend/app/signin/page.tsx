"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthPage from "@/components/AuthPage";
// No icons needed for simple form fields

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

const SignIn = () => {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!form.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (!form.password) {
      setError('Password is required');
      return false;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND}/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || data.message || !data.token) {
        setError(data.message || "Sign in failed");
        return;
      }

      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPage>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="email"
          placeholder="Email"
          className="w-full p-2 border rounded"
          value={form.email}
          onChange={handleChange}
          required
          suppressHydrationWarning
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full p-2 border rounded"
          value={form.password}
          onChange={handleChange}
          required
          suppressHydrationWarning
        />
        {error && <h1 className="text-red-600 text-lg">{error}</h1>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-slate-600 transition"
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </button>
        <p className="text-sm text-center mt-2">
          Don’t have an account? <a href="/signup" className="text-blue-600 underline">Sign up</a>
        </p>
      </form>
    </AuthPage>
  );
};

export default SignIn;
