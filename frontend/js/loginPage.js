import { SERVER_HOST } from "./hosts";
import { routerPush } from "./router";

const loginPage = () => {
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
                if (res.ok) routerPush("/");
                return res.json();
            })
            .then((res) => {
                console.log(res);
                return res;
            });
    });
};

export default loginPage;
