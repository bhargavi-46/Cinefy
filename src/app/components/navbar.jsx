"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import "boxicons/css/boxicons.min.css";
import { signOut, useSession } from "next-auth/react";
import "../navbar.css";

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeLink, setActiveLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const leftLinks = [
    { icon: "bx-home-alt-2", color: "text-[#6366F1]", route: "/home" },
    { icon: "bx-heart", color: "text-[#6366F1]", route: "/favourites" },
    { icon: "bx-video", color: "text-[#6366F1]", route: "/stream" },
  ];

  const rightLinks = [
    { icon: "bx-user", color: "text-[#6366F1]", route: "/profile" },
    { icon: "bx-log-out", color: "text-[#6366F1]", isLogout: true },
  ];

  if (session?.user?.email === "cinefyweb@gmail.com") {
    leftLinks.push({ icon: "bx-cog", color: "text-[#6366F1]", route: "/admin" });
  }

  useEffect(() => {
    setActiveLink(pathname);
    setLoading(false); // Stop loader when pathname changes
  }, [pathname]);

  const handleClick = async (link) => {
    if (link.isLogout) {
      setLoading(true);
      await signOut();
      router.push("/");
    } else {
      setLoading(true);
      setActiveLink(link.route);
      router.push(link.route);
    }
  };

  if (loading) {
    return (
      <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-[90vw] mx-auto">
      <nav className="bg-black w-[100vw] h-[6em] px-[1em] relative overflow-hidden shadow-lg rounded-md my-[1em]">
        <ul className="flex justify-between items-center h-full">
          {/* Left side links */}
          <div className="flex items-center gap-20">
            <li className="nav__link">
              <Link href="/">
                <img src="/logo.png" alt="Logo" className="h-24 w-24 opacity-100 filter brightness-200" />
              </Link>
            </li>
            {leftLinks.map((link, index) => (
              <li key={index} className={`nav__link ${activeLink === link.route ? "active" : ""}`}>
                <button onClick={() => handleClick(link)}>
                  <i
                    className={`bx ${link.icon} text-${link.color} text-[2.5rem] opacity-100 hover:opacity-50 ${
                      activeLink === link.route ? link.color : ""
                    }`}
                  ></i>
                </button>
              </li>
            ))}
          </div>

          {/* Right side links */}
          <div className="flex items-center gap-8">
            {rightLinks.map((link, index) => (
              <li key={index + leftLinks.length} className={`nav__link ${activeLink === link.route ? "active" : ""}`}>
                <button onClick={() => handleClick(link)}>
                  <i
                    className={`bx ${link.icon} text-${link.color} text-[2.5rem] opacity-100 hover:opacity-50 ${
                      activeLink === link.route ? link.color : ""
                    }`}
                  ></i>
                </button>
              </li>
            ))}
          </div>
        </ul>
      </nav>
    </div>
  );
};

export default Navbar;
