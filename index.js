// index.js - Railway entry point
// This loads and runs your real TypeScript application

// Load environment variables
require("dotenv").config();

// Register TypeScript support
require("tsx/dist/node").register();

// Start your real application
require("./src/index.ts");
