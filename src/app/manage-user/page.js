"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();

        if (data.success) {
          setUsers(data.users);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchUsers();
    }
  }, [status]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === "loading" || loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        backgroundColor: "#121212",
        color: "#ffffff"
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#121212",
      color: "#ffffff",
      padding: "2rem"
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          flexDirection: { xs: "column", sm: "row" },
          gap: "1rem"
        }}>
          <h1 style={{
            fontSize: "1.8rem",
            color: "#ffffff",
            margin: 0
          }}>User Management</h1>
          
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "1px solid #333",
              width: "100%",
              maxWidth: "400px",
              fontSize: "1rem",
              backgroundColor: "#1e1e1e",
              color: "#ffffff",
              outline: "none"
            }}
          />
        </div>

        <div style={{
          backgroundColor: "#1e1e1e",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          overflow: "hidden"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            padding: "1rem 1.5rem",
            backgroundColor: "#252525",
            fontWeight: "600",
            color: "#a0a0a0",
            borderBottom: "1px solid #333"
          }}>
            <div>Name</div>
            <div>Email</div>
            <div>Status</div>
          </div>

          {filteredUsers.length === 0 ? (
            <div style={{
              padding: "2rem",
              textAlign: "center",
              color: "#a0a0a0"
            }}>
              {searchTerm ? "No users match your search" : "No users found"}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user._id} style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                padding: "1rem 1.5rem",
                borderBottom: "1px solid #333",
                alignItems: "center",
                transition: "background-color 0.2s",
                ":hover": {
                  backgroundColor: "#252525"
                }
              }}>
                <div style={{ 
                  fontWeight: "500",
                  color: "#ffffff"
                }}>
                  {user.name}
                </div>
                <div style={{ color: "#cccccc" }}>
                  {user.email}
                </div>
                <div>
                  <span style={{
                    display: "inline-block",
                    padding: "0.35rem 0.85rem",
                    borderRadius: "9999px",
                    backgroundColor: user.premium ? "#1a472a" : "#333333",
                    color: user.premium ? "#55ff99" : "#aaaaaa",
                    fontSize: "0.875rem",
                    fontWeight: "500"
                  }}>
                    {user.premium ? "Premium" : "Standard"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}