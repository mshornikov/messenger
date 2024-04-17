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

    if (!text) return;

    ws.send(JSON.stringify({ author, text }));
};

formEl.addEventListener("submit", send);

const signInForm = document.querySelector("#sign-in");

signInForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = signInForm.querySelector("#username").value;
    const password = signInForm.querySelector("#password").value;

    console.log(username, password);

    fetch("http://localhost:3000/signin", {
        method: "post",
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
