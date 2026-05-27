import express from "express";
import path from "path";
import dns from "dns";

// Ensure IPv4 binds correctly on localhost / container
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from project root
app.use(express.static(process.cwd()));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Direct wildcard routes back to the single standalone index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Spaceship HUD Backend active on http://0.0.0.0:${PORT}`);
});

