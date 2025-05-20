"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthPage from "@/components/AuthPage";

const SignUp = () => {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", name: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:3002/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || data.message) {
        setError(data.message || "Signup failed");
        return;
      }

      router.push("/signin");
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
          type="text"
          name="name"
          placeholder="Full Name"
          className="w-full p-2 border rounded"
          value={form.name}
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
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Sign Up
        </button>
        <p className="text-sm text-center mt-2">
          Already have an account? <a href="/signin" className="text-blue-600 underline">Sign in</a>
        </p>
      </form>
    </AuthPage>
  );
};

export default SignUp;
