"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function Home() {
  const lightRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!lightRef.current) return;

      const x = e.clientX;
      const y = e.clientY;

      // BIG WHITE SPOTLIGHT
      lightRef.current.style.background = `
        radial-gradient(
          500px circle at ${x}px ${y}px,
          rgb(240, 232, 232),
          transparent 70%
        )
      `;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">

      {/* BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1537724326059-2ea20251b9c8?q=80&w=1176&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        }}
      />

      {/* BIG WHITE MOUSE LIGHT */}
      <div
        ref={lightRef}
        className="pointer-events-none absolute inset-0 z-10 transition-all duration-300"
      />

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/70 z-20" />

      {/* CONTENT */}
      <div className="relative z-30 flex min-h-screen flex-col">
        
        {/* Hero */}
        <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="mb-4 text-xs tracking-widest text-zinc-400">
            SMART CREDIT INTELLIGENCE
          </span>

          <h2 className="mb-6 max-w-4xl text-5xl font-bold leading-tight">
            Smarter Credit Cards. <br />
            <span className="text-zinc-400">Chosen for how you spend.</span>
          </h2>

          <p className="max-w-2xl text-lg text-zinc-400">
            OKCREDIT analyzes your spending intent and recommends the
            most rewarding credit cards — cashback, rewards, and savings,
            tailored to your needs.
          </p>

          
        </main>

        <footer className="pb-6 text-center text-xs text-zinc-500">
          © 2026 OKCREDIT
        </footer>
      </div>
    </div>
  );
}
