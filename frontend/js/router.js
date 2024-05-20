import chatsPage from "./chatsPage";
import loginPage from "./loginPage";
import mainPage from "./mainPage";
import registerPage from "./registerPage";
import routes from "./routes";

document.addEventListener("click", (e) => {
    const { target } = e;
    if (!target.matches("a")) {
        return;
    }
    e.preventDefault();
    routerPush(e.target.href);
});

export const routerPush = (href) => {
    window.history.pushState({}, "", href);
    urlLocationHandler();
};

const urlLocationHandler = async () => {
    let location = window.location.pathname;

    if (location.length == 0) location = "/login";

    const cookieString = document.cookie;
    const sessionId = cookieString.match(/sessionId=(.*)/);
    if (sessionId) console.log(sessionId[1]);

    if (!sessionId && location !== "/login" && location !== "/register") {
        routerPush("/login");
        return;
    }

    if (sessionId && (location === "/login" || location === "/register")) {
        routerPush("/");
        return;
    }

    let route = routes[location] || routes["404"];

    if (location.startsWith("/chat")) {
        route = routes["/chat"];
    }

    const html = await fetch(route.template).then((response) =>
        response.text()
    );

    document.querySelector(".content").innerHTML = html;
    document.title = route.title;
    if (location === "/") chatsPage();
    if (location === "/register") registerPage();
    if (location === "/login") loginPage();
    if (location.startsWith("/chat")) mainPage();
};

window.onpopstate = urlLocationHandler;
window.route = routerPush;
urlLocationHandler();
