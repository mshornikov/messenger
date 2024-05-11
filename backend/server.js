import { randomUUID, createHash } from "node:crypto";
import http from "node:http";
import url from "node:url";

import { WebSocketServer } from "ws";
import mongoose from "mongoose";

const clients = {};

const SERVER_PORT = 3001;
const WS_PORT = 8000;
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

const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws) => {
    const id = randomUUID();
    clients[id] = ws;

    console.log(`New client ${id}`);

    Message.find().then((data) => {
        const messages = data.map(({ author, text }) => {
            return { author, text };
        });

        ws.send(JSON.stringify(messages));
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

const SessionSchema = new mongoose.Schema({
    _id: String,
    username: String,
    userId: String,
});

const Session = mongoose.model("Session", SessionSchema);

/**
 * @param {http.IncomingMessage} res
 * @param {string} data
 */
const login = async (res, data) => {
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

            await Session.create({
                _id: sessionId,
                username: user.username,
                userId: user.userId,
            });

            res.writeHead(200, {
                "Set-Cookie": `sessionId=${sessionId}`,
            });
            res.write(JSON.stringify({ username: user.username }));
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

/**
 * @param {http.ServerResponse} req
 * @param {http.ServerResponse<http.IncomingMessage>} res
 */
const getInfo = async (req, res) => {
    /** @type {string} */
    const cookieHeader = req.headers?.cookie;
    console.log(cookieHeader);
    if (cookieHeader) {
        const sessionId = cookieHeader.match(/sessionId=(.*)/)[1];
        try {
            const userData = await Session.findById(sessionId);
            if (!userData) {
                res.statusCode = 401;
                return;
            }
            res.statusCode = 200;
            res.write(JSON.stringify({ username: userData.username }));
        } catch (error) {
            res.statusCode = 400;
        } finally {
            res.end();
        }
    } else {
        res.writeHead(401, {
            "Content-Type": "text/plain",
        });
        res.write("No cookie");
    }
};

/**
 * @param {http.ServerResponse} req
 * @param {http.ServerResponse<http.IncomingMessage>} res
 */
const logout = async (req, res) => {
    /** @type {string} */
    const cookieHeader = req.headers?.cookie;
    console.log(cookieHeader);
    if (cookieHeader) {
        const sessionId = cookieHeader.match(/sessionId=(.*)/)[1];
        try {
            const userData = await Session.findById(sessionId);
            if (!userData) {
                res.statusCode = 401;
                return;
            }
            try {
                await Session.deleteOne({ _id: sessionId });
                res.writeHead(200, {
                    "set-cookie":
                        "sessionId=none; expires=Thu, 01 Jan 1970 00:00:00 GMT",
                });
            } catch (error) {
                res.statusCode = 500;
            }
        } catch (error) {
            res.statusCode = 500;
        } finally {
            res.end();
        }
    } else {
        res.writeHead(401, {
            "Content-Type": "text/plain",
        });
        res.write("No cookie");
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

    const reqUrl = url.parse(req.url).pathname;

    switch (req.method) {
        case "OPTIONS":
            res.end();
            break;
        case "GET":
            if (reqUrl === "/info") getInfo(req, res);
            break;
        case "POST":
            let data = "";

            req.on("data", (chunk) => {
                data += chunk;
            });

            if (reqUrl === "/signup") req.on("end", () => signUp(res, data));
            if (reqUrl === "/login") req.on("end", () => login(res, data));
            if (reqUrl === "/logout") logout(req, res);
            break;
        default:
            res.end();
    }
});

server.listen(SERVER_PORT);

server.on("upgrade", async (request, socket, head) => {
    const cookieHeader = request.headers?.cookie;
    console.log("cookie", cookieHeader);

    if (cookieHeader) {
        const sessionId = cookieHeader.match(/sessionId=(.*)/)[1];
        const userData = await Session.findById(sessionId);
        if (!userData) {
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            return;
        }
    } else {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        return;
    }

    // if (!authed) {
    //     // \r\n\r\n: These are control characters used in HTTP to
    //     // denote the end of the HTTP headers section.
    //     socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    //     socket.destroy();
    //     return;
    // }

    wss.handleUpgrade(request, socket, head, (connection) => {
        // Manually emit the 'connection' event on a WebSocket
        // server (we subscribe to this event below).
        wss.emit("connection", connection, request);
    });
});

process.on("SIGINT", async () => {
    wss.close();
    for (const ws of wss.clients) {
        ws.terminate();
    }
    await mongoose.disconnect();

    server.close();
});
