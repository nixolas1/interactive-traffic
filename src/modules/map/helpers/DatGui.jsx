import Dat from 'dat.gui';

import global from './Global'
import {updateCamera, updateControls, initializeJourneyData, updateScene, cleanUp, updateSizes} from '../Updaters'

const gui = new Dat.GUI({hideable: true, closeOnTop: false});

window.toggleGui = () => {
    Dat.GUI.toggleHide()
}

window.toggleGui();

// debug tool for changing variables live
export const addGui = (animateFunc) => {
    let options = global.options;

    const cam = gui.addFolder('Camera');
    // cam.add(options.camera, "x", -1, 1).onChange(() => updateControls())
    // cam.add(options.camera, "y", -1, 1).onChange(() => updateControls())
    // cam.add(options.camera, "z", -6, 6).onChange(() => updateControls())
    // cam.add(options.camera, "autoRotate", -100, 100).onChange(() => updateControls())
    cam.add(options.camera, "fov", 1, 250).onChange((val) => updateCamera("fov", val))
    cam.add(options.camera, "near", 0, 100).onChange((val) => updateCamera("near", val))
    cam.add(options.camera, "far", 1, 5000).onChange((val) => updateCamera("far", val))

    const points = gui.addFolder('Points');
    points.add(options.points, "zDivider", 0, 2000).onFinishChange(() => initializeJourneyData())
    points.add(options.points, "size", 0, 10000).onChange((val) => updateSizes(val))
    points.add(options.points, "maxToX", 0, 55).onFinishChange(() => initializeJourneyData())
    points.add(options.points, "maxToY", 0, 55).onFinishChange(() => initializeJourneyData())
    points.add(options.points, "minLat", 59.2, 59.6).onFinishChange(() => initializeJourneyData())
    points.add(options.points, "minLon", 10,10.5).onFinishChange(() => initializeJourneyData())

    const line = gui.addFolder('Lines');
    line.add(options.line, "enabled").onChange(() => cleanUp(false))
    line.add(options.line, "detail", 0.001, 10).onFinishChange(() => initializeJourneyData())
    line.add(options.line, "opacity", 0, 1).onFinishChange(() => initializeJourneyData())
    line.add(options.line, "regionalColored").onChange(() => initializeJourneyData())
    line.add(options.line, "random").onChange(() => initializeJourneyData())
    line.add(options.line, "custom").onChange(() => initializeJourneyData())
    line.addColor(options.line, "customColor").onFinishChange(() => initializeJourneyData())
    line.add(options.line, "cleanupLines")

    const data = gui.addFolder('Data');
    data.add(options.dataTypes, "700").onChange(() => initializeJourneyData()).name("Bus")
    data.add(options.dataTypes, "100").onChange(() => initializeJourneyData()).name("Train")
    data.add(options.dataTypes, "401").onChange(() => initializeJourneyData()).name("Metro")
    data.add(options.dataTypes, "900").onChange(() => initializeJourneyData()).name("Tram")
    data.add(options.dataTypes, "1000").onChange(() => initializeJourneyData()).name("Boat")
    data.add(options.dataTypes, "1100").onChange(() => initializeJourneyData()).name("Air")
    data.add(options.dataTypes, "all").onChange(() => {
        Object.keys(options.dataTypes).forEach(k => options.dataTypes[k] = true)
        data.__controllers.forEach(cont => cont.updateDisplay())
        initializeJourneyData();
    })
    data.add(options.dataTypes, "none").onChange(() => {
        Object.keys(options.dataTypes).forEach(k => options.dataTypes[k] = false)
        data.__controllers.forEach(cont => cont.updateDisplay())
    })

    const anim = gui.addFolder('Animation');
    anim.add(options.anim, "speedMulti", 0, 100)
    anim.add(options.time, "extraTime", 0, 1000000)

    const time = gui.addFolder('Time');
    time.add(options.time, "stamp",
        options.time.startTime,
        options.time.endTime - 10000,
    ).onFinishChange(() => cleanUp(false))

    const scene = gui.addFolder('Scene');
    scene.add(options.scene, "map").onChange((val) => updateScene("map", val))
    scene.add(options.scene, "fog", 0, 1).onChange((val) => updateScene("fog", val))
    scene.addColor(options.scene, "bg").onChange((val) => updateScene("bg", val))


    const debug = gui.addFolder('Debug');
    debug.add(global.debug, "active", 0, 4000).listen()
    debug.add(options.time, "date", 1, 31).listen()
    debug.add(options.debug, "debug").name("Debug lines")
    debug.add(options.debug, "pause").onChange(()=>animateFunc())
}
