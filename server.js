import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const nextHandler = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const httpServer = createServer((req, res) => {
    return nextHandler(req, res);
  });

  // Initialize Socket.IO server
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Allow all origins for testing
      methods: ["GET", "POST"],
    },
  });

  // Track active rooms and their video data
  const activeRooms = new Map();

  // Socket.IO connection handler
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle room creation
    socket.on("createRoom", ({ roomId, videoData }) => {
      try {
        if (!roomId || !videoData) {
          throw new Error("Room ID and videoData are required");
        }

        // Join the room
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);

        // Store video data for the room
        activeRooms.set(roomId, { videoData, participants: [socket.id] });
        console.log(`Video data for room ${roomId}:`, videoData);

        // Broadcast videoData to all users in the room
        io.to(roomId).emit("videoData", videoData);

        console.log(`Room created: ${roomId}`);
      } catch (error) {
        console.error("Error creating room:", error.message);
        socket.emit("error", { message: error.message });
      }
    });

    // Handle room joining
    socket.on("joinRoom", ({ roomId }) => {
      try {
        if (!roomId) {
          throw new Error("Room ID is required");
        }

        // Join the room
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);

        // Retrieve video data for the room
        const roomData = activeRooms.get(roomId);

        if (roomData) {
          // Add the user to the room's participants
          roomData.participants.push(socket.id);
          activeRooms.set(roomId, roomData);

          // Send videoData to the joining user
          socket.emit("videoData", roomData.videoData);
          console.log(`Video data sent to user ${socket.id}:`, roomData.videoData);
        } else {
          throw new Error("Room not found or no video data available");
        }
      } catch (error) {
        console.error("Error joining room:", error.message);
        socket.emit("error", { message: error.message });
      }
    });

    // Handle play event
    socket.on("play", ({ roomId, currentTime }) => {
      try {
        if (!roomId) {
          throw new Error("Room ID is required");
        }

        // Broadcast play event to all users in the room
        socket.to(roomId).emit("play", { currentTime });
        console.log(`Play event broadcasted in room: ${roomId}`);
      } catch (error) {
        console.error("Error handling play event:", error.message);
        socket.emit("error", { message: error.message });
      }
    });

    // Handle pause event
    socket.on("pause", ({ roomId, currentTime }) => {
      try {
        if (!roomId) {
          throw new Error("Room ID is required");
        }

        // Broadcast pause event to all users in the room
        socket.to(roomId).emit("pause", { currentTime });
        console.log(`Pause event broadcasted in room: ${roomId}`);
      } catch (error) {
        console.error("Error handling pause event:", error.message);
        socket.emit("error", { message: error.message });
      }
    });

    // Handle seek event
    socket.on("seek", ({ roomId, currentTime }) => {
      try {
        if (!roomId) {
          throw new Error("Room ID is required");
        }

        // Broadcast seek event to all users in the room
        socket.to(roomId).emit("seek", { currentTime });
        console.log(`Seek event broadcasted in room: ${roomId}`);
      } catch (error) {
        console.error("Error handling seek event:", error.message);
        socket.emit("error", { message: error.message });
      }
    });

    // Handle episode change event
    socket.on("changeEpisode", ({ roomId, season, episode }) => {
      try {
        if (!roomId || !season || !episode) {
          throw new Error("Room ID, season, and episode are required");
        }

        // Broadcast episode change event to all users in the room
        socket.to(roomId).emit("changeEpisode", { season, episode });
        console.log(`Episode change broadcasted in room: ${roomId}`);
      } catch (error) {
        console.error("Error handling episode change:", error.message);
        socket.emit("error", { message: error.message });
      }
    });

    // Handle season change event
    socket.on("changeSeason", ({ roomId, season }) => {
      try {
        if (!roomId || !season) {
          throw new Error("Room ID and season are required");
        }

        // Broadcast season change event to all users in the room
        socket.to(roomId).emit("changeSeason", { season });
        console.log(`Season change broadcasted in room: ${roomId}`);
      } catch (error) {
        console.error("Error handling season change:", error.message);
        socket.emit("error", { message: error.message });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);

      // Clean up rooms if necessary
      activeRooms.forEach((roomData, roomId) => {
        // Remove the disconnected user from the room's participants
        roomData.participants = roomData.participants.filter(
          (participant) => participant !== socket.id
        );

        // If the room is empty, delete it
        if (roomData.participants.length === 0) {
          activeRooms.delete(roomId);
          console.log(`Room deleted: ${roomId}`);
        } else {
          // Update the room's participants
          activeRooms.set(roomId, roomData);
        }
      });
    });
  });

  // Start the server
  httpServer.listen(port,"0.0.0.0", () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}).catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});