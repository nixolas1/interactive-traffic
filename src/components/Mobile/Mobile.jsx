import React, { Component } from "react";

import "./_mobile.scss"
import ModuleView from "../ModuleView/ModuleView";
import ModuleSelector from "../ModuleSelector/ModuleSelector";

class Mobile extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <main className="ri-mobile">
                <ModuleView {...this.props} />
                <ModuleSelector {...this.props} />
            </main>
        );
    }
}

export default Mobile;
