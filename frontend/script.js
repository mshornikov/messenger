const chatEl = document.querySelector("#chat");
const formEl = document.querySelector("#message-form");

const WS_HOST = "ws://localhost:3001";
const SERVER_HOST = "http://localhost:3001";

/**
 * @param {boolean} isOwn
 * @param {{ author: string, text: string, timeStamp: string }} messageInfo
 */
const printMessage = (isOwn, { author, text, timeStamp }) => {
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

    const timeStampEl = document.createElement("div");
    timeStampEl.innerText = new Date(timeStamp).toLocaleTimeString([], {
        timeStyle: "short",
    });

    messageEl.appendChild(textEl);
    messageEl.appendChild(timeStampEl);

    chatEl.appendChild(messageEl);
};

let ws;

const connect = () => {
    ws = new WebSocket(WS_HOST);

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
};

connect();

/**
 * @param {SubmitEvent} event
 */
const send = (event) => {
    event.preventDefault();
    const author = formEl.querySelector("#author").value;
    const textEl = formEl.querySelector("#text");
    const toEl = formEl.querySelector("#to");
    const timeStamp = new Date();

    if (!textEl.value) return;

    if (!to.value) to.value = "all";

    ws.send(
        JSON.stringify({ author, text: textEl.value, timeStamp, to: to.value })
    );
    printMessage(true, { author, text: textEl.value, timeStamp });

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
    })
        .then((res) => {
            if (res.ok) return res.json();
        })
        .then((res) => {
            chatEl.innerHTML = "";
            connect();
            const authorEl = document.querySelector("#author");
            authorEl.value = res.username;
            return res;
        });
});

const getDataButton = document.querySelector("#get-data");

const getInfo = () => {
    fetch(`${SERVER_HOST}/info`, {
        credentials: "include",
    })
        .then((res) => {
            if (res.ok) return res.json();
            return res;
        })
        .then((res) => {
            const authorEl = document.querySelector("#author");
            authorEl.value = res.username;
            authorEl.placeholder = res.username;
            return res;
        })
        .catch((error) => console.error(error));
};

getInfo();

getDataButton.addEventListener("click", getInfo);

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
