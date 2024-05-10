const chatEl = document.querySelector("#chat");
const formEl = document.querySelector("#message-form");

const ws = new WebSocket(`ws://localhost:8000`);

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

printMessage(1, "123");

ws.onmessage = ({ data }) => {
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

const signInForm = document.querySelector("#sign-in");

signInForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = signInForm.querySelector("#username").value;
    const password = signInForm.querySelector("#password").value;

    console.log(username, password);

    fetch("http://localhost:3001/signin", {
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
        .then(({ username }) => {
            const author = document.querySelector("#author");
            author.value = username;
        });
});

const signUpForm = document.querySelector("#sign-up");

signUpForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = signUpForm.querySelector("#username").value;
    const password = signUpForm.querySelector("#password").value;

    console.log(username, password);

    fetch("http://localhost:3000/signup", {
        method: "post",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
    });
});
