import * as THREE from "three";
import global from './helpers/Global'
import {addJourneyToAtoms} from './helpers/Atom'

// update state of all particles (position, color, size)
export const updateParticles = (time) => {
    let positions = global.geometry.getAttribute("position");

    for (let i = 0; i < global.activeAtoms.length; i++){
        const atom = global.activeAtoms[i];
        const ai = atom.index * 3;
        const pos = newPosition(atom, time);

        positions.array[ai] = pos[0];
        positions.array[ai + 1] = pos[1];
        positions.array[ai + 2] = pos[2];
        //color
        //size
    }

    positions.needsUpdate = true;
}

// takes raw journey data from journeyFetcher output, converts all to particle objects, and adds them to the atom list
export const initializeJourneyData = (journeyData=global.journeyData, clear=true, async=true) => {
    if(clear) {
        cleanUp()
    }

    for (const time in journeyData) {
        const timeSlot = journeyData[time];
        for (const id in timeSlot) {
            const journey = timeSlot[id];
            if(async)
                setTimeout(()=> addJourneyToAtoms(journey, id, time), 0)
            else
                addJourneyToAtoms(journey, id, time)

        }
    }
    //todo: clean up old atoms
}


export const initLastHourOfTraffic = (endStamp) => {
    let start = new Date(endStamp).getTime() - 60 * 60 * 1000;

    while(start < endStamp) {
        updateAtomsActiveState(start);
        start += 60000
    }
}

// clean up particle arrays and reset geometries
export const cleanUp = (atoms = true, activeAtoms = true, lines = true) => {
    if(lines) {
        for(let atom of global.activeAtoms) {
            global.scene.remove(atom.line)
            global.pVisibility[atom.index] = 0;
        }
    }

    if(atoms)
        global.atoms = {};

    if(activeAtoms)
        global.activeAtoms = [];
}

// runs each whole minute, cleans up old particles and adds new particles
export const updateAtomsActiveState = (rawTime) => {
    const roundTime = Math.floor(rawTime / 10000) * 10000;

    // remove old atoms and disable its particle
    if(global.options.line.cleanupLines) {
        removeOldAtoms(rawTime);
    }

    let count = 0;
    // add new active
    if(global.atoms.hasOwnProperty(roundTime)) {
        count = activateAtoms(roundTime);
    }

    global.geometry.getAttribute("visible").needsUpdate = true;
    return count;
}

// remove atoms from active when the journey is over
const removeOldAtoms = (rawTime) => {
    let i = global.activeAtoms.length;
    const extraTime = global.options.time.extraTime;

    while(i--) {
        let atom = global.activeAtoms[i];
        if(atom.stop + extraTime < rawTime ) {
            global.pVisibility[atom.index] = 0;
            global.activeAtoms.splice(i, 1);

            if(global.options.line.enabled) {
                global.scene.remove(atom.line)
            }
        }
    }
}

// check atoms in the current timeslot and activate them, setting correct color and visibility
const activateAtoms = (time) => {
    const currentAtoms = global.atoms[time]
    let count = 0;
    for (const atomId in currentAtoms) {
        let atom = currentAtoms[atomId];
        count++;
        atom.index = newAtomIndex();
        global.activeAtoms.push(atom);

        // particle updates
        global.pVisibility[atom.index] = 1;

        const colorIndex = atom.index * 3;
        global.pColors[colorIndex] = atom.color[0];
        global.pColors[colorIndex + 1] = atom.color[1];
        global.pColors[colorIndex + 2] = atom.color[2];

        // line update
        if(global.options.line.enabled) {
            global.scene.add(atom.line);
        }
    }

    global.geometry.getAttribute("color").needsUpdate = true;
    return count;
}

// get the updated position of a atom, based on the current time.
const newPosition = (atom, time) => {
    const fraction = getTripFraction(atom.start, atom.stop, time);
    const point = atom.line.spline.getPointAt(fraction)
    return [point.x, point.y, point.z];
}

// get number between 0 and 1 for a journey's progress, based on the time
// elapsed time / trip duration = how far along vehicle is. Max value is 1
const getTripFraction = (start, stop, time) => {
    const fraction = (time - start) / (stop - start);
    // fraction -= Math.sin((((time - start) / (stop - start)) / (stop - start)) * Math.PI) * speed

    // limit value between 1 and 0
    return fraction > 1 ? 1 : fraction < 0 ? 0 : fraction
}

// keeps count of new atom's index in the particle array, so the index goes to 0 when the max limit is reached
const newAtomIndex = () => {
    const index = global.index;
    global.index += 1;

    if(global.index > global.options.points.maxCount) {
        global.index = 0;
    }

    return index;
}

// changes background / map color based on time
export const updateColorsByTime = (nowStamp) => {
    const t = (nowStamp - global.options.time.startTime) / 86400000; // fraction of day passed (divider is ms in a day)
    const hue = 0.5; //1 - t * 0.4; // exp
    const sat = 0.6;
    const light = Math.max(0, t - (t * t) +0.3);
    const mapColor = new THREE.Color().setHSL(hue, sat, light);
    global.mapImg.color.set(mapColor);

    // global.renderer.setClearColor(mapColor)
}

// helper function for dat.gui value changes
export const updateCamera = (key, value, subKey) => {
    if(subKey) {
        global.camera[key][subKey] = value;
    } else {
        global.camera[key] = value;
    }

    global.camera.updateProjectionMatrix();
}

// helper function for dat.gui value changes
export const updateScene = (key, val) => {
    switch(key) {
        case "fog":
            global.scene.fog = new THREE.FogExp2(0x000000, val);
            break;
        case "bg":
            global.renderer.setClearColor(val)
            break;
        case "map":
            if(val) global.scene.add(global.plane)
            else global.scene.remove(global.plane)
            break;
        case "pointSize":
        case "pointAlpha":
            global.material = new THREE.PointsMaterial( {map: global.sprite, alphaTest: options.scene.pointAlpha, transparent: true } );
            global.particles = new THREE.Points( global.geometry, global.material );
            break;
        // default:
    }
}

// helper function for dat.gui value changes
export const updateControls = () => {
    global.controls.target = new THREE.Vector3(global.options.camera.x, global.options.camera.y, global.options.camera.z);
    global.controls.autoRotateSpeed = global.options.camera.autoRotate;
}

// updates debug data, like time, active buses, and the clock
let oldSecond = -1;
export const updateDebugData = (date) => {
    const seconds = date.getSeconds();
    global.debug.active = global.activeAtoms.length;
    global.options.time.date = date.getDate()
    global.options.time.hour = date.getHours()
    global.options.time.minute = date.getMinutes()
    global.options.time.second = seconds

    if(seconds !== oldSecond && global.options.time) {
        oldSecond = seconds;
        global.timeElement.innerText = date.toTimeString().substr(0, 5);
    }
}

// add the animationspeed time to the live timestamp
let prevTime = new Date();
export const updateTime = () => {
    let t = global.options.time;
    const now = new Date();
    t.stamp += (now - prevTime) * global.options.anim.speedMulti;
    prevTime = now;
    const time = t.stamp;
    const date = new Date(time);

    if(time > t.endTime) {
        t.stamp = t.startTime;
        cleanUp(false);
        return updateTime();
    }

    updateDebugData(date);

    return [time, date]
}

// helper function for dat.gui, to set all sizes of particles to same size
export const updateSizes = (size) => {
    for (let i = 0; i < global.pSizes.length; i++) {
        global.pSizes[i] = size;
    }
    global.geometry.getAttribute("size").needsUpdate = true;
}

// test for finding line which is hovered over
let intersected = null;
export const updateIntersection = (clear) => {
    if(!global.options.debug.debug) return

    if(clear) {
        intersected = null;
        global.debugElement.innerText = "";
        return
    }

    global.raycaster.setFromCamera( global.mouse, global.camera );
    let intersects = global.raycaster.intersectObjects( global.scene.children );
    if ( intersects.length > 0 ) {
        if (intersected !== intersects[0].object) {
            intersected = intersects[0].object;

            if(intersected.atomId) {
                global.debugElement.innerText = intersected.atomId;
            } else {
                intersected = null;
                global.debugElement.innerText = "";
            }
        }
    }
}
