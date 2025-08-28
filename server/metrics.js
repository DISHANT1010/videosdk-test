const client = require("prom-client");

// ---- Create Registry ----
const register = new client.Registry();

// Collect default Node.js metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics({ register });

// ---- Custom WebSocket Metrics ----

// 1️⃣ Connection Overview
const activeConnections = new client.Gauge({
  name: "websocket_active_connections",
  help: "Number of active WebSocket connections",
});

const totalConnections = new client.Counter({
  name: "websocket_total_connections",
  help: "Total number of WebSocket connections established",
});

const connectionRate = new client.Gauge({
  name: "websocket_connection_rate_per_sec",
  help: "WebSocket connection rate per second",
});

// 2️⃣ Message Throughput
const messagesReceived = new client.Counter({
  name: "websocket_messages_received_total",
  help: "Total number of messages received",
});

const messagesSent = new client.Counter({
  name: "websocket_messages_sent_total",
  help: "Total number of messages sent",
});

const messageLatency = new client.Histogram({
  name: "websocket_message_latency_seconds",
  help: "WebSocket message latency in seconds",
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1],
});

// 3️⃣ Scaling Events
const connectionDrops = new client.Counter({
  name: "websocket_connection_drops_total",
  help: "Number of WebSocket connections dropped",
});

// 4️⃣ System Health
const websocketErrors = new client.Counter({
  name: "websocket_errors_total",
  help: "Total number of WebSocket errors",
});

// ---- Register custom metrics ----
register.registerMetric(activeConnections);
register.registerMetric(totalConnections);
register.registerMetric(connectionRate);
register.registerMetric(messagesReceived);
register.registerMetric(messagesSent);
register.registerMetric(messageLatency);
register.registerMetric(connectionDrops);
register.registerMetric(websocketErrors);

module.exports = {
  register,
  activeConnections,
  totalConnections,
  connectionRate,
  messagesReceived,
  messagesSent,
  messageLatency,
  connectionDrops,
  websocketErrors,
};
