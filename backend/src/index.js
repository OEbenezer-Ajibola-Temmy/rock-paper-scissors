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
const { userRoutes } = require("./routes");
// app configuations
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

const baseUrl = "/api/v1";
app.get(baseUrl, (req, res) => {
    res.status(200).json({ message: "server is up and running" });
});

app.use(`${baseUrl}/auth/user`, userRoutes);

server.listen(PORT, () => console.log(`Server is listening on PORT ${PORT}`));
