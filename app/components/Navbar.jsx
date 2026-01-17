import React from 'react'
import Link from 'next/link'
const Navbar = () => {
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
             <nav className="flex gap-6 text-sm text-zinc-300">
            <Link href="/" className="hover:text-white font-semibold">Home</Link>
            <Link href="/usercards" className="hover:text-white font-semibold">Cards</Link>
            <Link href="/login" className="hover:text-white font-semibold">Login</Link>
            <Link href="/register" className="hover:text-white font-semibold">Register</Link>
          </nav>
          
        </header>
       
   
  )
}

export default Navbar