const chatEl = document.querySelector("#chat");
const formEl = document.querySelector("#message-form");

const WS_HOST = "ws://localhost:8000";
const SERVER_HOST = "http://localhost:3001";

const ws = new WebSocket(WS_HOST);

/**
 * @param {boolean} isOwn
 * @param {{ author: string, text: string }} messageInfo
 */
const printMessage = (isOwn, { author, text }) => {
    const messageEl = document.createElement("li");
    messageEl.classList.add("message");
    messageEl.classList.add("chat__message");

    const messageClassModifier = isOwn
        ? "chat__message--right"
        : "chat__message--left";

    messageEl.classList.add(messageClassModifier);

    if (!isOwn) {
        const authorEl = document.createElement("div");
        authorEl.classList.add("message__author");
        authorEl.innerText = author;
        messageEl.appendChild(authorEl);
    }

    const textEl = document.createElement("span");
    textEl.innerText = text;

    messageEl.appendChild(textEl);

    chatEl.appendChild(messageEl);
};

ws.onmessage = ({ data }) => {
    /** @type {Array} */
    const messages = JSON.parse(data);

    console.log(messages);

    for (const message of messages) {
        const author = document.querySelector("#author").value;
        const isOwn = author === message.author;
        printMessage(isOwn, message);
    }
};

ws.onclose = () => {
    ws.close();
};

/**
 * @param {SubmitEvent} event
 */
const send = (event) => {
    event.preventDefault();
    const author = document.querySelector("#author").value;
    const textEl = document.querySelector("#text");

    if (!textEl.value) return;

    ws.send(JSON.stringify({ author, text: textEl.value }));
    printMessage(true, { author, text: textEl.value });

    textEl.value = "";
};

formEl.addEventListener("submit", send);

const loginForm = document.querySelector("#login");

loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = loginForm.querySelector("#login-username").value;
    const password = loginForm.querySelector("#login-password").value;

    console.log(username, password);

    fetch(`${SERVER_HOST}/login`, {
        method: "post",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
    });
});

const getDataButton = document.querySelector("#get-data");

getDataButton.addEventListener("click", () => {
    fetch(`${SERVER_HOST}/info`, {
        credentials: "include",
    })
        .then((res) => {
            if (res.ok) return res.json();
        })
        .then((res) => console.log(res));
});

const logoutButton = document.querySelector("#logout");

logoutButton.addEventListener("click", () => {
    fetch(`${SERVER_HOST}/logout`, {
        method: "post",
        credentials: "include",
    });
});

const signUpForm = document.querySelector("#sign-up");

signUpForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = signUpForm.querySelector("#username").value;
    const password = signUpForm.querySelector("#password").value;

    console.log(username, password);

    fetch(`${SERVER_HOST}/signup`, {
        method: "post",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
    });
});
