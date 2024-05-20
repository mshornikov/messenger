import { SERVER_HOST } from "./hosts";
import { routerPush } from "./router";

const askForNotifications = () => {
    if (!("Notification" in window)) {
        console.log("This browser does not support notifications.");
        return;
    }

    Notification?.requestPermission().then((result) => {
        console.log(result);
    });
};

const chatsPage = () => {
    const list = document.querySelector(".chats-list");

    askForNotifications();

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

    fetch(`${SERVER_HOST}/users`, {
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    })
        .then((res) => {
            return res.json();
        })
        .then((res) => {
            console.log(res);
            res.forEach((i) => {
                const item = document.createElement("li");
                const link = document.createElement("a");
                link.classList.add("chats-list__item");
                link.href = `/chat/${i.username}`;
                link.innerText = i.username;
                item.appendChild(link);
                list.appendChild(item);
                console.log(item);
            });

            return res;
        });
};

export default chatsPage;
