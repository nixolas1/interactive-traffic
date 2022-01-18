import React from 'react';
import {Route, Switch} from "react-router-dom";

import "./_moduleview.scss"
import modules from "config/modules";

class ModuleView extends React.Component {
    render() {
        return (
            <div className="ri-module-view">
                <Switch>
                    {Object.entries(modules).map(([key, module]) =>
                        <Route path={this.props.match.path + "/" + module.route} exact component={module.mobile} key={key} />
                    )}
                </Switch>
            </div>
        )
    }
}

export default ModuleView;
