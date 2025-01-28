const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const pcap = require("pcap");

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve the static HTML file
app.use(express.static(__dirname + "/public"));

// Get the default network interface
const pcapSession = pcap.createSession(pcap.findDevice(), "ip");

// Store network requests
let networkData = [];

// Listen for packets
pcapSession.on("packet", (rawPacket) => {
  const packet = pcap.decode.packet(rawPacket);
  const ipLayer = packet.payload.payload;
  if (ipLayer.saddr && ipLayer.daddr) {
    const data = {
      sourceIP: ipLayer.saddr.toString(),
      destIP: ipLayer.daddr.toString(),
      protocol: ipLayer.protocolName,
      timestamp: new Date().toISOString(),
    };
    networkData.push(data);
    io.emit("network-data", data); // Send data to the UI
  }
});

// WebSocket connection
io.on("connection", (socket) => {
  console.log("Client connected");
  // Send existing network data to the client
  socket.emit("initial-data", networkData);
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
