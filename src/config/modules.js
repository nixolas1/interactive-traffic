import Loadable from "react-loadable";
import Loading from "../components/Loading/Loading";

const lazyModule = (path, name) => Loadable({loading: Loading, loader: () => import("../modules/" + path + "/" + name)})

// Define module components outside modules object, or they won't work
const MapMobile = lazyModule("plusone", "MapMobile")
const MapHub = lazyModule("plusone", "MapModule")

// Add new modules here
const modules = {
    plusone: {
        mobile: MapMobile,
        hub: MapHub,
        name: "Kart",
        icon: "plus",
        route: "map",
    },
};

export default modules;
