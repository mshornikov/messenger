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

    if (location.length == 0) location = "/";

    const cookieString = document.cookie;
    const sessionId = cookieString.match(/sessionId=(.*)/);
    console.log(sessionId);

    if (!sessionId && location !== "/" && location !== "/register") {
        routerPush("/");
        return;
    }

    // get the route object from the urlRoutes object
    const route = routes[location] || routes["404"];
    // get the html from the template
    const html = await fetch(route.template).then((response) =>
        response.text()
    );

    document.getElementById("content").innerHTML = html;
    document.title = route.title;
    if (location === "/") loginPage();
    if (location === "/chat") mainPage();
    if (location === "/register") registerPage();
};

// add an event listener to the window that watches for url changes
window.onpopstate = urlLocationHandler;
// call the urlLocationHandler function to handle the initial url
window.route = routerPush;
// call the urlLocationHandler function to handle the initial url
urlLocationHandler();
