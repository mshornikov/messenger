import { SERVER_HOST } from "./hosts";
import { routerPush } from "./router";

const askForNotifications = () => {
    if ("Notification" in window) {
        if (!("Notification" in window)) {
            console.log("This browser does not support notifications.");
            return;
        }

        try {
            Notification?.requestPermission().then((result) => {
                console.log(result);
            });
        } catch (error) {
            console.log(error);
        }
    }
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
            routerPush("/login");
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
            if (res.status === 401) routerPush("/login");
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
                link.innerHTML += `
                <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="gray" style="display: block">
                <path
                    d="M504-480 348-636q-11-11-11-28t11-28q11-11 28-11t28 11l184 184q6 6 8.5 13t2.5 15q0 8-2.5 15t-8.5 13L404-268q-11 11-28 11t-28-11q-11-11-11-28t11-28l156-156Z" />
                </svg>`;
                item.appendChild(link);
                list.appendChild(item);
                console.log(item);
            });

            return res;
        })
        .catch((error) => console.error(error));
};

export default chatsPage;
