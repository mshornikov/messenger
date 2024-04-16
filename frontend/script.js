const chatEl = document.querySelector('#chat');
const formEl = document.querySelector('#message-form');

const ws = new WebSocket(`ws://localhost:8000`);

ws.onmessage = (message) => {
    const messages = JSON.parse(message.data);

    console.log(messages);

    for (const message of messages) {
        const messageEl = document.createElement('li');
        messageEl.innerText = `${message.name}: ${message.message}`;
        chatEl.appendChild(messageEl);
    }
};

const send = (event) => {
    event.preventDefault();
    const name = document.querySelector('#name').value;
    const message = document.querySelector('#message').value;

    ws.send(JSON.stringify({ name, message }));
};

formEl.addEventListener('submit', send);
