const chatEl = document.querySelector("#chat");
const formEl = document.querySelector("#message-form");

const ws = new WebSocket(`ws://localhost:8000`);

ws.onmessage = ({ data }) => {
    const messages = JSON.parse(data);

    console.log(messages);

    for (const message of messages) {
        const messageEl = document.createElement("li");
        messageEl.innerText = `${message.author}: ${message.text}`;
        chatEl.appendChild(messageEl);
    }
};

ws.onclose = () => {
    ws.close();
};

const send = (event) => {
    event.preventDefault();
    const author = document.querySelector("#author").value;
    const text = document.querySelector("#text").value;

    ws.send(JSON.stringify({ author, text }));
};

formEl.addEventListener("submit", send);
