import { WebSocketServer } from 'ws';
import { v4 as uuid } from 'uuid';
import { writeFile, readFileSync, existsSync } from 'fs';

const LOG_FILE = './backend/log';

const clients = {};

const log = existsSync(LOG_FILE) && readFileSync(LOG_FILE);

const messages = JSON.parse(log) || [];

const wss = new WebSocketServer({ port: 8000 });

wss.on('connection', (ws) => {
    const id = uuid();
    clients[id] = ws;

    console.log(`New client ${id}`);

    ws.send(JSON.stringify(messages));

    ws.on('message', (rawMessage) => {
        console.log(`Message: ${rawMessage}`);

        const { name, message } = JSON.parse(rawMessage);

        messages.push({ name, message });

        for (const id in clients) {
            clients[id].send(JSON.stringify([{ name, message }]));
        }
    });

    ws.on('close', () => {
        delete clients[id];

        console.log(`Client is closed ${id}`);
    });
});

process.on('SIGINT', () => {
    wss.close();

    writeFile(LOG_FILE, JSON.stringify(messages), (err) => {
        if (err) console.log(err);
        process.exit();
    });
});
