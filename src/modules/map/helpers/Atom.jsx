import global from './Global'
import {convertJourneyToAtom} from "../DataProcessing";


// class for particle for a trip
export class Atom {
    constructor(line, startTime, stopTime, type, index, color, numStops) {
        this.line = line;               // array of coordinates, x, y, z, x, y, z
        this.start = startTime;         // timestamp of start of trip
        this.stop = stopTime;           // --=-- final stop
        this.type = type;               // vehicle type, as defined in extended gtfs
        this.index = index;             // related particle's index in the particle array
        this.color = color;             // [r, g, b] color
        this.numStops = numStops;           // number of stops
    }
}

// add a journey to the correct position in the processed Atom list
export const addJourneyToAtoms = (rawJourney, id, time) => {
    if (!global.atoms.hasOwnProperty(time)) {
        global.atoms[time] = {};
    }

    if(!global.options.dataTypes[rawJourney.vehicleType]) return;

    global.atoms[time][id] = convertJourneyToAtom(rawJourney, id);
}
