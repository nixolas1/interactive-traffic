// import {
//     BrowserRouter as Router,
//     Route,
//     Link,
//     Switch,
// } from "react-router-dom";
import React from "react";
import ReactDOM from "react-dom";
// import Loadable from "react-loadable";

// import Loading from "./components/Loading/Loading";
import registerServiceWorker from "./config/registerServiceWorker";
import "./resources/styles/_index.scss"
import MapModule from "./modules/map/MapModule";

// const Mobile = Loadable({loading: Loading, loader: () => import("./components/Mobile/Mobile")});
// const Hub = Loadable({loading: Loading, loader: () => import("./components/Hub/Hub")});

ReactDOM.render(
    <MapModule/>
    , document.getElementById("root"));
registerServiceWorker();


/*<Router>
        <Switch>
            <Route path="/mobile" extact component={Mobile}/>
            <Route path="/" exact component={Hub}/>
            <Route path="/" exact render={() =>
                <main>
                    <h2><Link to="/mobile">Mobil</Link></h2>
                    <h2><Link to="/hub">Hub</Link></h2>
                </main>
            }/>
        </Switch>
    </Router>*/
