import React, { Component } from "react";
import ModuleView from "../ModuleView/ModuleView";
import ModuleSelector from "../ModuleSelector/ModuleSelector";

class Hub extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div className="ri-hub">
                <ModuleView {...this.props} />
                <ModuleSelector {...this.props} />
            </div>
        );
    }
}

export default Hub;
