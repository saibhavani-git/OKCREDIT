"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Navbar = ({ userRole }) => {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh(); // 🔥 forces layout to re-check cookies
  };

  return (
    <header className="flex items-center justify-between px-10 py-6">
      <h1
        className="text-xl font-semibold tracking-widest"
        style={{
          background: "linear-gradient(90deg, #888, #fff, #888)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        OKCREDIT
      </h1>

      {userRole === "user" ? (
        <nav className="flex gap-6 text-sm text-zinc-300">
          <Link href="/" className="hover:text-white font-semibold">Home</Link>
          <Link href="/users/userCards" className="hover:text-white font-semibold">Cards</Link>
          <button onClick={handleLogout} className="hover:text-white font-semibold">
            Logout
          </button>
        </nav>
      ) : userRole === "admin" ? (
        <nav className="flex gap-6 text-sm text-zinc-300">
          <Link href="/" className="hover:text-white font-semibold">Home</Link>
          <Link href="/admin/cards" className="hover:text-white font-semibold">Cards</Link>
          <Link href="/admin/users" className="hover:text-white font-semibold">Users</Link>
          <Link href="/admin/offers" className="hover:text-white font-semibold">Offers</Link>
          <button onClick={handleLogout} className="hover:text-white font-semibold">
            Logout
          </button>
        </nav>
      ) : (
        <nav className="flex gap-6 text-sm text-zinc-300">
          <Link href="/" className="hover:text-white font-semibold">Home</Link>
          <Link href="/login" className="hover:text-white font-semibold">Login</Link>
          <Link href="/register" className="hover:text-white font-semibold">Register</Link>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
