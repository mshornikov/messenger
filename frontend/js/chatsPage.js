import { SERVER_HOST } from "./hosts";

const chatsPage = () => {
    const list = document.querySelector("#chats-list");

    Notification.requestPermission().then((result) => {
        console.log(result);
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
