import { randomUUID, createHash } from "node:crypto";
import http from "node:http";
import url from "node:url";

import { WebSocketServer } from "ws";
import mongoose from "mongoose";

const clients = {};

const PORT = 8000;
const DB_PORT = 27017;

const uri = `mongodb://localhost:${DB_PORT}/messenger`;
mongoose.connect(uri);

const { connection } = mongoose;

connection.once("open", () => {
    console.log("MongoDB database connection established successfully");
});

const MessagesSchema = new mongoose.Schema({
    author: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
});

const Message = mongoose.model("Message", MessagesSchema);

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
    const id = randomUUID();
    clients[id] = ws;

    console.log(`New client ${id}`);

    Message.find().then((value) => {
        ws.send(JSON.stringify(value));
    });

    ws.on("message", (rawMessage) => {
        console.log(`Message: ${rawMessage}`);

        const messageObject = JSON.parse(rawMessage);

        const newMessage = new Message(messageObject);

        newMessage.save();
        console.log(rawMessage);

        for (const client in clients) {
            if (client !== id) {
                clients[client].send(JSON.stringify([messageObject]));
            }
        }
    });

    ws.on("close", () => {
        delete clients[id];

        console.log(`Client is closed ${id}`);
    });
});

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    salt: {
        type: String,
        required: true,
        unique: false,
    },
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
});

const User = mongoose.model("User", UserSchema);

/**
 * @param {http.IncomingMessage} res
 * @param {string} data
 */
const signIn = async (res, data) => {
    const { username, password } = JSON.parse(data);

    console.log("singIn", { username, password });

    try {
        const user = await User.findOne({ username: username });

        if (!user) {
            res.statusCode = 400;
            res.write("User not found");
            return;
        }

        const salted = `${password}${user.salt}`;
        const hash = createHash("sha256");
        const hashed = hash.update(salted).digest("hex");
        console.log("hashed", hashed);

        if (hashed === user.password) {
            const sessionId = randomUUID();
            res.writeHead(200, {
                "Set-Cookie": `sessionId=${sessionId}`,
                "Content-Type": "text/plain",
            });
        }
    } catch (error) {
        res.statusCode = 500;
        res.write("Server error");
    } finally {
        res.end();
    }
};

/**
 * @param {http.IncomingMessage} res
 * @param {string} data
 */
const signUp = async (res, data) => {
    const { username, password } = JSON.parse(data);
    const salt = randomUUID();
    console.log("salt", salt);
    const salted = `${password}${salt}`;
    console.log("salted", salted);

    const hash = createHash("sha256");
    const hashed = hash.update(salted).digest("hex");
    console.log("hashed", hashed);

    const userId = randomUUID();
    console.log("userId:", userId);

    console.log("singUp", { username, salt, userId, hashed });

    try {
        await User.create({ username, salt, userId, password: hashed });
        res.statusCode = 201;
        res.write("User created");
    } catch (error) {
        console.log(JSON.stringify(error));
        if (error.code === 11000) {
            res.statusCode = 400;
            res.write("Username already exists");
        }
    } finally {
        res.end();
    }
};

const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,OPTIONS,DELETE,PUT"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "origin, x-requested-with, content-type, credentials"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");

    switch (req.method) {
        case "OPTIONS":
            res.end();
            break;
        case "POST":
            let data = "";

            req.on("data", (chunk) => {
                data += chunk;
            });

            const reqUrl = url.parse(req.url).pathname;

            if (reqUrl === "/signup") req.on("end", () => signUp(res, data));
            if (reqUrl === "/signin") req.on("end", () => signIn(res, data));
            break;
        default:
            res.end();
    }
});

server.listen(3001, "127.0.0.1", () => {
    console.log("Server running");
});

process.on("SIGINT", async () => {
    wss.close();
    for (const ws of wss.clients) {
        ws.terminate();
    }
    await mongoose.disconnect();

    server.close();
});
