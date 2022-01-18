import React from 'react';
import { NavLink, withRouter } from "react-router-dom";
import fire from "resources/fire";

import modules from "config/modules";
import "./_moduleselector.scss"

class ModuleSelector extends React.Component {
    constructor(props) {
        super(props);
        this.activeModuleRef = null;
    }
    componentDidMount (){
        this.activeModuleRef = fire.database().ref("activeModule");
        this.activeModuleRef.on("value", snapshot => this.changeToModule(snapshot.val()))
    }

    componentWillUnmount () {
        this.activeModuleRef.off();
    }

    requestChangeToModule = (moduleKey) => {
        this.activeModuleRef.set(moduleKey);
        console.log(moduleKey)
    }

    changeToModule = (moduleKey) => {
        const module = modules[moduleKey]

        if (module) {
            const route = this.relToAbsUrl(module.route)
            const currentRoute = this.props.history.location.pathname

            if (route !== currentRoute) {
                // navigate to new route
                this.props.history.push(route)
                console.log("Server-navigation occured:", route, ". Old route:", currentRoute)
            } else {
                console.log("Already on route")
            }
        }
    }

    relToAbsUrl = (url) => {
        return this.props.match.url + "/" + url
    }

    render() {
        return (
            <ul className="ri-module-selector">
                {Object.entries(modules).map(([key, module]) =>
                    <li className="ri-module-selector__item" key={key}>
                        <NavLink to={this.props.match.url + "/" + module.route}
                                 onClick={() => this.requestChangeToModule(key)}
                                 className="ri-module-selector__link">
                            {module.name}
                        </NavLink>
                    </li>
                )}
            </ul>
        )
    }
}

export default ModuleSelector;
