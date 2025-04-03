"use client";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

export default function PaymentSystem() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    // Dynamically load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const payNow = async () => {
    if (!amount || isNaN(amount) || parseInt(amount, 10) <= 0) {
      return alert("Please enter a valid amount.");
    }

    setLoading(true);

    try {
      // ✅ Create order
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseInt(amount, 10), currency: "INR" }), 
      });

      const order = await response.json();
      if (!response.ok) throw new Error(order.message || "Order creation failed");

      // ✅ Setup Razorpay payment options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // 🔹 Use NEXT_PUBLIC_ prefix for frontend
        amount: order.amount,
        currency: order.currency,
        name: "Cinefy",
        description: "Video Streaming Payment",
        order_id: order.id,
        prefill: {
          name: "Test User",
          email: "test@example.com",
          contact: "9999999999",
        },
        theme: { color: "#F37254" },
        handler: async function (response) {
          console.log("Payment Response:", response);

          // ✅ Verify payment
          const verifyResponse = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.status === "ok") {
            alert("Payment successful!");
            window.location.href = "/payment-success";
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

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Razorpay Payment Integration</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          payNow();
        }}
        style={{ display: "inline-block", textAlign: "left" }}
      >
        <label>Enter Amount (INR):</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          min="1"
          style={{ display: "block", margin: "10px 0", padding: "8px" }}
        />
        <button type="submit" disabled={loading} style={{ padding: "10px 20px", cursor: "pointer" }}>
          {loading ? "Processing..." : "Pay Now"}
        </button>
      </form>
    </div>
  );
}