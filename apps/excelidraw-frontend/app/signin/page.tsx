"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthPage from "@/components/AuthPage";

const SignIn = () => {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:3002/signin", {
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
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <AuthPage>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="username"
          placeholder="Email"
          className="w-full p-2 border rounded"
          value={form.username}
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
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
          Sign In
        </button>
        <p className="text-sm text-center mt-2">
          Don’t have an account? <a href="/signup" className="text-blue-600 underline">Sign up</a>
        </p>
      </form>
    </AuthPage>
  );
};

export default SignIn;
