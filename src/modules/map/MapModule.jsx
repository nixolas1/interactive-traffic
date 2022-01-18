import React, {Component} from "react";
import {addGui} from './helpers/DatGui'
import {
    initLastHourOfTraffic,
    updateAtomsActiveState,
    updateColorsByTime,
    updateParticles,
    updateTime
} from './Updaters'
import global from './helpers/Global'
import initOptions from './helpers/Options'


import "./helpers/style.scss";
import "../../resources/styles/_splash.scss";
import {getData, initGeometries, initThree} from "./Initializers";

class MapModule extends Component {
    componentDidMount() {
        initOptions();
        let renderer = initThree(this.mount)
        initGeometries()
        getData(() => this.start())
        addGui(this.animate) // debug menu

        console.log("Init", global)
        this.mount.appendChild(renderer.domElement)
        window.addEventListener( 'resize', this.onWindowResize, false );
    }

    componentWillUnmount() {
        this.stop()
        this.mount.removeChild(global.renderer.domElement)
    }

    onWindowResize = () => {
        global.camera.aspect = window.innerWidth / window.innerHeight;
        global.camera.updateProjectionMatrix();
        global.renderer.setSize( window.innerWidth, window.innerHeight );
        if(global.composer) global.composer.setSize( window.innerWidth, window.innerHeight );
    }

    isNewMinute = (date) => {
        if(date.getMinutes() === this.prevMinute) {
            return false;
        } else {
            this.prevMinute = date.getMinutes();
            return true;
        }
    }

    start = () => {
        if (!this.frameId) {
            initLastHourOfTraffic(global.options.time.stamp)
            this.frameId = requestAnimationFrame(this.animate)
        }
    }

    stop = () => {
        cancelAnimationFrame(this.frameId)
    }

    animate = () => {
        // updates animation time
        const [time, date] = updateTime();

        // check for new active journeys and update background color
        if(this.isNewMinute(date)) {
            // todo: make different updateTimes for animation and data processing, so updateAtomsActiveState works even on high animation speeds
            updateAtomsActiveState(time);
            updateColorsByTime(time);
        }

        // update particles position for current anim time
        updateParticles(time);

        // update camera controls
        global.controls.update();

        // three.js rendering
        if(!global.options.debug.pause) {
            this.renderScene()
            this.frameId = window.requestAnimationFrame(this.animate)
        }
    }


    renderScene = () => {
        if(!global.composer) {
            global.renderer.render(global.scene, global.camera)
        } else {
            global.composer.render();
        }
    }

    render(){
        return(
            <div style={{height: "100%"}} ref={(mount) => { this.mount = mount }} />
        )
    }
}

export default MapModule;
