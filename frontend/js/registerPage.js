import { SERVER_HOST } from "./hosts";
import { routerPush } from "./router";

const registerPage = () => {
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
        })
            .then((res) => res.json())
            .then((res) => {
                if (res.ok) routerPush("/login");
                return res;
            });
    });
};

export default registerPage;
