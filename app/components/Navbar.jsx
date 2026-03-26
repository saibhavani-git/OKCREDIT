"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Navbar = ({ userRole, userName, userEmail }) => {
  const router = useRouter();
  const [showEmail, setShowEmail] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowEmail(false);
      }
    };
    if (showEmail) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showEmail]);

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
        <nav className="flex items-center gap-6 text-sm text-zinc-300">
          {(userName || userEmail) && (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setShowEmail((v) => !v)}
                className="text-zinc-400 font-semibold hover:text-white transition-colors"
                title={showEmail ? "Hide email" : "Show email"}
              >
                👨🏻‍💻{userName || "Profile"}
              </button>
              {showEmail && userEmail && (
                <div className="absolute top-full left-0 mt-1.5 py-2 px-3 rounded-lg bg-gray-900 border border-gray-700 text-zinc-300 text-xs shadow-lg z-50 min-w-[180px]">
                  <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">Email</p>
                  <p className="text-white font-medium break-all">{userEmail}</p>
                </div>
              )}
            </div>
          )}
          <Link href="/" className="hover:text-white font-semibold">Home</Link>
          <Link href="/users/userCards" className="hover:text-white font-semibold">Cards</Link>
          
          <Link href="/users/transactions" className="hover:text-white font-semibold">Transactions</Link>
          <Link href="/users/tips" className="hover:text-white font-semibold">Tips</Link>
          <button onClick={handleLogout} className="hover:text-white font-semibold">
            Logout
          </button>
        </nav>
      ) : userRole === "admin" ? (
        <nav className="flex items-center gap-6 text-sm text-zinc-300">
          {(userName || userEmail) && (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setShowEmail((v) => !v)}
                className="text-zinc-400 font-medium hover:text-white transition-colors"
                title={showEmail ? "Hide email" : "Show email"}
              >
                {userName || "Profile"}
              </button>
              {showEmail && userEmail && (
                <div className="absolute top-full left-0 mt-1.5 py-2 px-3 rounded-lg bg-gray-900 border border-gray-700 text-zinc-300 text-xs shadow-lg z-50 min-w-[180px]">
                  <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">Email</p>
                  <p className="text-white font-medium break-all">{userEmail}</p>
                </div>
              )}
            </div>
          )}
          <Link href="/" className="hover:text-white font-semibold">Home</Link>
          <Link href="/admin/cards" className="hover:text-white font-semibold">Cards</Link>
          <Link href="/admin/users" className="hover:text-white font-semibold">Users</Link>
          <Link href="/admin/offers" className="hover:text-white font-semibold">Offers</Link>
          <Link href="/users/tips" className="hover:text-white font-semibold">Tips</Link>
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
