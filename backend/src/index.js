const express = require("express");
const http = require("http");
const { join } = require("path");
const { Server } = require("socket.io");

// env
require("dotenv").config({
    path: join(__dirname, `.env.${process.env.NODE_ENV}`),
});
const {
    env: { PORT },
} = process;
// routes
const {
    roomRoutes,
    userRoutes,
    socketRoutes: { initializeRoomIO },
} = require("./routes");
// app configuations
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

const baseUrl = "/api/v1";
const baseSocketUrl = "/api/v1/socket";

// initialize io
initializeRoomIO(io, baseSocketUrl);

app.get(baseUrl, (req, res) => {
    res.status(200).json({ message: "server is up and running" });
});

app.use(`${baseUrl}/room`, roomRoutes);

/**
 * Reason you should maintain `.../auth/user/...` route name convention is in case
 * there is an admin configuration the routing could be `.../auth/admin/...`
 */
app.use(`${baseUrl}/auth/user`, userRoutes);

// invalid routes
app.use("*", (req, res) => {
    return res.status(400).json({
        data: {
            message: `Cannot ${req.method} ${req.originalUrl}`,
        },
        success: false,
    });
});

// error handler
app.use((err, req, res, next) => {
    return res.status(err.status || 400).json({
        success: false,
        error: {
            message: `${err.name}: ${err.message}`,
        },
    });
});

server.listen(PORT, () => console.log(`Server is listening on PORT ${PORT}`));
