const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());

const io = socketIo(server);

io.on("connection", (socket) => {
  console.log("A client connected");

  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });

  socket.on("adminMessage", (message) => {
    console.log("Received admin message:", message);
    io.emit("adminMessage", message);
  });
});

const PORT = process.env.PORT || 8080;
const HOST = "0.0.0.0"; // Bind to all interfaces

server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
