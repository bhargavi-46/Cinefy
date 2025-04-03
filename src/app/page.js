"use client";

import React from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { SiGoogle } from "react-icons/si";

const Login = () => {
  return (
    <div className="relative w-full h-screen flex items-center justify-center">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          className="object-cover brightness-125 contrast-125"
          src="/login/login.png"
          layout="fill"
          alt="Login Background"
        />
      </div>

      {/* Login Card */}
      <div className="relative w-[450px] h-[300px] flex flex-col items-center justify-center rounded-[50px] border-2 border-white/40 bg-gradient-to-b from-white/40 to-transparent shadow-lg backdrop-blur-[20px] p-8">

        {/* Logo */}
        <Image src="/logo.png" alt="Logo" width={100} height={100} className="mb-4 brightness-150" />

        {/* Login Title */}
        <h2 className="text-center text-white text-[40px] font-[400] font-[BagelFatOne-Regular]">
          LOGIN
        </h2>

        {/* Google Login Button */}
        <button
          onClick={() => signIn("google")}
          className="mt-6 w-[320px] h-[55px] rounded-full bg-white text-black text-[16px] font-[Risque-Regular] shadow-lg flex items-center justify-center gap-3 hover:scale-105 transition-all duration-300"
        >
          <SiGoogle size={22} />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
