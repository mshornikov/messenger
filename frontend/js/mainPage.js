import { SERVER_HOST, WS_HOST } from "./hosts";
import { routerPush } from "./router";

const getUsername = () => {
    const cookieString = document.cookie;
    console.log(cookieString);
    const cookie = cookieString.match(/username=(.*)/);
    if (cookie) return cookie[1];
    return;
};

const mainPage = () => {
    const chatEl = document.querySelector("#chat");
    const formEl = document.querySelector("#message-form");

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
                const author = getUsername();
                if (author) {
                    console.log("username", author);
                    const isOwn = author === message.author;

                    printMessage(isOwn, message);
                } else {
                    console.error("Cannot find username");
                }
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
        const author = getUsername();
        const textEl = formEl.querySelector("#text");
        const toEl = formEl.querySelector("#to");
        const timeStamp = new Date();

        if (!textEl.value) return;

        if (!to.value) to.value = "all";

        if (!author) return;

        ws.send(
            JSON.stringify({
                author,
                text: textEl.value,
                timeStamp,
                to: to.value,
            })
        );
        printMessage(true, { author, text: textEl.value, timeStamp });

        textEl.value = "";
    };

    formEl.addEventListener("submit", send);

    const logoutButton = document.querySelector("#logout");

    logoutButton.addEventListener("click", () => {
        fetch(`${SERVER_HOST}/logout`, {
            method: "post",
            credentials: "include",
        }).then((res) => {
            if (res.ok) {
                routerPush("/");
            }
            return res;
        });
    });
};

export default mainPage;
