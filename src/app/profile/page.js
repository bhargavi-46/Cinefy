"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/navbar";
import { FaUserCircle } from "react-icons/fa";
import { useSession } from "next-auth/react";

const Profile = () => {
  const [showMembership, setShowMembership] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const { data: session } = useSession();
  const [user, setUser] = useState({
    name: "",
    email: "",
    isPremium: false,
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!session?.user?.email) return;
      try {
        const res = await fetch(`/api/login?email=${session.user.email}`);
        if (!res.ok) throw new Error("Something went wrong");

        const data = await res.json();
        setUser(data.user);
        setIsPremium(data.user.premium);
      } catch (error) {
        console.error("Error fetching user details:", error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    if (session) fetchUserDetails();
  }, [session?.user?.email, session]);

  useEffect(() => {
    if (isPremium) {
      setStartDate(user.premiumStartDate);
      setEndDate(user.premiumEndDate);
    }
  }, [isPremium]);

  const handlePremiumStatus = (duration) => {
    setIsPremium(true);
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + duration);
    setStartDate(start.toDateString());
    setEndDate(end.toDateString());
  };

  const handlePayment = async (amount, duration) => {
    if (!amount || isNaN(amount) || parseInt(amount, 10) <= 0) {
      return alert("Please enter a valid amount.");
    }

    setLoading(true);
    sessionStorage.setItem("amount", amount);

    try {
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseInt(amount, 10), currency: "INR" }),
      });

      const order = await response.json();
      if (!response.ok) throw new Error(order.message || "Order creation failed");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Cinefy",
        description: "Video Streaming Payment",
        order_id: order.id,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: "9999999999",
        },
        theme: { color: "#F37254" },
        handler: async function (response) {
          const verifyResponse = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              email: user.email,
              duration: duration,
            }),
          });

          let verifyData;
          try {
            verifyData = await verifyResponse.json();
          } catch (error) {
            alert("Error verifying payment. Please try again.");
            return;
          }

          if (verifyData.status === "ok") {
            alert("Payment successful!");
            handlePremiumStatus(duration);
          } else {
            alert("Payment verification failed. Please try again.");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Error processing payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-10 bg-gray-900 shadow-2xl rounded-2xl p-8 w-96 flex flex-col items-center border border-gray-700"
      >
        <motion.div whileHover={{ scale: 1.1 }} className="text-gray-400">
          <FaUserCircle className="w-24 h-24 text-gray-400" />
        </motion.div>
        <h2 className="mt-4 text-2xl font-bold">{user?.name || "Loading..."}</h2>
        <p className="text-gray-400 text-sm">{user?.email || "Loading..."}</p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-6 px-5 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition"
          onClick={() => setShowMembership(!showMembership)}
        >
          Check Membership Status
        </motion.button>

        {showMembership && (
          <div className="mt-6 text-center text-sm">
            {isPremium ? (
              <p className="text-yellow-500 font-semibold">
                You are a Premium Member!
                <br />
                Start Date: {startDate}
                <br />
                End Date: {endDate}
              </p>
            ) : (
              <div className="text-gray-300">
                <p className="mb-2">Do you want to upgrade to Premium?</p>
                <div className="flex flex-col gap-2">
                  <button
                    className="px-4 py-2 bg-yellow-500 text-black rounded-lg shadow-md hover:bg-yellow-600 transition"
                    onClick={() => handlePayment(999, 1)}
                  >
                    1 Month - ₹999
                  </button>
                  <button
                    className="px-4 py-2 bg-yellow-500 text-black rounded-lg shadow-md hover:bg-yellow-600 transition"
                    onClick={() => handlePayment(4999, 6)}
                  >
                    6 Months - ₹4999
                  </button>
                  <button
                    className="px-4 py-2 bg-yellow-500 text-black rounded-lg shadow-md hover:bg-yellow-600 transition"
                    onClick={() => handlePayment(8999, 12)}
                  >
                    1 Year - ₹8999
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Profile;
