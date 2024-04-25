import { WebSocketServer } from "ws";
import mongoose from "mongoose";
import { randomUUID } from 'node:crypto';
import express from "express";

const app = express();
app.use(express.json());

const clients = {};

const PORT = 8000;
const DB_PORT = 27017;

const uri = `mongodb://localhost:${DB_PORT}`;
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
    password: {
        type: String,
        required: true,
    },
});

const User = mongoose.model("User", UserSchema);

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,OPTIONS,DELETE,PUT"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "origin, x-requested-with, content-type"
    );
    next();
});

app.post("/signup", async (req, res) => {
    const signUpData = req.body;

    console.log(signUpData);

    try {
        await User.create(signUpData);
    } catch (error) {
        console.log(JSON.stringify(error));
        if (error.code === 11000) {
            return res.status(400).send({
                status: "error",
                error: "username already exists",
            });
        }
        throw error;
    }
});

app.post("/signin", async (req, res) => {
    const signInData = req.body;
    console.log(signInData);
    try {
        const user = await User.findOne(signInData);

        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }

        res.send({ username: signInData.username });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Server error" });
    }
});

const server = app.listen(3000);

process.on("SIGINT", async () => {
    wss.close();
    for (const ws of wss.clients) {
        ws.terminate();
    }
    await mongoose.disconnect();

    server.close();
});
