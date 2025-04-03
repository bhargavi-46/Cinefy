export default function PaymentSuccess() {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1 style={{ color: "#28a745" }}>🎉 Payment Successful!</h1>
        <p>Thank you for your payment. Your transaction was successful.</p>
        <button
          onClick={() => (window.location.href = "/")}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Go to Homepage
        </button>
      </div>
    );
  }