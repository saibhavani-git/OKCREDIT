"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setText("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setText(data.message || "Login Successful");
        setTimeout(() => {
          if (data.userRole === "user") {
            router.push("/users/userCards");
          } else if (data.userRole === "admin") {
            router.push("/admin/dashboard");
          }
          router.refresh();
        }, 1000);
      } else {
        setError(data.message || "Login failed");
      }
    } catch {
      setError("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-gray-950/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-800/50 shadow-2xl">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 
              className="text-5xl font-extrabold tracking-tight mb-2"
              style={{
                background: "linear-gradient(90deg, #888, #fff, #888)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Welcome Back
            </h1>
            <p className="text-gray-500 text-sm">Sign in to your account</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl p-3 text-center text-sm bg-red-950/50 border border-red-900/50 text-red-400">
              {error}
            </div>
          )}

          {/* Success */}
          {text && (
            <div className="mb-4 rounded-xl p-3 text-center text-sm bg-green-950/50 border border-green-900/50 text-green-400">
              {text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-400">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3.5 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gray-500/50 focus:ring-1 focus:ring-gray-500/20 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-400">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3.5 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gray-500/50 focus:ring-1 focus:ring-gray-500/20 transition-all"
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none disabled:cursor-not-allowed"
              style={{
                background: loading 
                  ? "linear-gradient(90deg, #2c2c2c, #2c2c2c, #2c2c2c)"
                  : "linear-gradient(90deg, #5f676a, #f0f0f0, #5f676a)",
                color: loading ? "#888" : "#000",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <a
              href="/register"
              className="text-gray-300 hover:text-white font-medium transition-colors"
            >
              Create account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
