import { WebSocketServer } from "ws";
import { v4 as uuid } from "uuid";
import mongoose from "mongoose";

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
    const id = uuid();
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

        for (const id in clients) {
            clients[id].send(JSON.stringify([messageObject]));
        }
    });

    ws.on("close", () => {
        delete clients[id];

        console.log(`Client is closed ${id}`);
    });
});

process.on("SIGINT", async () => {
    wss.close();
    for (const ws of wss.clients) {
        ws.terminate();
    }
    await mongoose.disconnect();
});
