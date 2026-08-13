"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = require("http");
const socket_1 = require("./socket");
const auth_1 = __importDefault(require("./routes/auth"));
const workspaces_1 = __importDefault(require("./routes/workspaces"));
const boards_1 = __importDefault(require("./routes/boards"));
const lists_1 = __importDefault(require("./routes/lists"));
const cards_1 = __importDefault(require("./routes/cards"));
const comments_1 = __importDefault(require("./routes/comments"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
(0, socket_1.initSocket)(httpServer);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});
app.use("/api/auth", auth_1.default);
app.use("/api/workspaces", workspaces_1.default);
app.use("/api/boards", boards_1.default);
app.use("/api/lists", lists_1.default);
app.use("/api/cards", cards_1.default);
app.use("/api/comments", comments_1.default);
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
mongoose_1.default
    .connect(MONGODB_URI)
    .then(() => {
    console.log("MongoDB connected");
    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
    .catch((err) => {
    console.error("MongoDB connection error:", err);
});
