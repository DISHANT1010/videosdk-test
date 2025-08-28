// const WebSocket = require("ws");
// const express = require("express");
// const client = require("prom-client");

// const app = express();
// const port = process.env.PORT || 8080;

// const server = app.listen(port, () => {
//   console.log(`🚀 WebSocket server running on port ${port}`);
// });

// const wss = new WebSocket.Server({ server });

// // ---- Prometheus metrics ----
// const register = new client.Registry();
// client.collectDefaultMetrics({ register });

// const activeConnections = new client.Gauge({
//   name: "websocket_active_connections",
//   help: "Number of active WebSocket connections",
// });
// const messagesReceived = new client.Counter({
//   name: "websocket_messages_received_total",
//   help: "Total number of messages received",
// });
// const messagesSent = new client.Counter({
//   name: "websocket_messages_sent_total",
//   help: "Total number of messages sent",
// });

// register.registerMetric(activeConnections);
// register.registerMetric(messagesReceived);
// register.registerMetric(messagesSent);

// // Expose /metrics endpoint
// app.get("/metrics", async (req, res) => {
//   res.set("Content-Type", register.contentType);
//   res.end(await register.metrics());
// });

// // ---- WebSocket handling ----
// let clients = new Set();

// wss.on("connection", (ws) => {
//   console.log("New client connected");
//   clients.add(ws);
//   activeConnections.set(clients.size);

//   ws.on("message", (msg) => {
//     console.log("Received:", msg.toString());
//     messagesReceived.inc();

//     // broadcast to all
//     clients.forEach((client) => {
//       if (client.readyState === WebSocket.OPEN) {
//         client.send(msg.toString());
//         messagesSent.inc();
//       }
//     });
//   });

//   ws.on("close", () => {
//     console.log("Client disconnected");
//     clients.delete(ws);
//     activeConnections.set(clients.size);
//   });
// });

const WebSocket = require("ws");
const express = require("express");
const metrics = require("./metrics");

const app = express();
const port = process.env.PORT || 8080;

const server = app.listen(port, () => {
  console.log(`🚀 WebSocket server running on port ${port}`);
});

const wss = new WebSocket.Server({ server });

// ---- Metrics endpoint ----
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", metrics.register.contentType);
  res.end(await metrics.register.metrics());
});

// ---- WebSocket handling ----
let clients = new Set();
let lastConnectionCount = 0;
let lastTimestamp = Date.now();

wss.on("connection", (ws) => {
  console.log("New client connected");
  clients.add(ws);

  // Update metrics
  metrics.activeConnections.set(clients.size);
  metrics.totalConnections.inc();

  // Calculate connection rate per second
  const now = Date.now();
  const deltaTime = (now - lastTimestamp) / 1000;
  const deltaConnections = clients.size - lastConnectionCount;
  metrics.connectionRate.set(deltaConnections / deltaTime);
  lastConnectionCount = clients.size;
  lastTimestamp = now;

  ws.on("message", (msg) => {
    const start = process.hrtime();
    metrics.messagesReceived.inc();

    // broadcast to all
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg.toString(), () => {
          metrics.messagesSent.inc();

          // Measure latency
          const diff = process.hrtime(start);
          const seconds = diff[0] + diff[1] / 1e9;
          metrics.messageLatency.observe(seconds);
        });
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
    metrics.activeConnections.set(clients.size);
    metrics.connectionDrops.inc();
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
    metrics.websocketErrors.inc();
  });
});
