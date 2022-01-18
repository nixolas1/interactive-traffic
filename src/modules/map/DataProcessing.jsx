import {BufferGeometry, CatmullRomCurve3, Color, Line, LineBasicMaterial, Vector3} from "three";
import global from './helpers/Global'
import {Atom} from "./helpers/Atom";


// converts list of stop ids to a Three.js line based on the stop's coordinates
export const lineFromStops = (stops, color, id) => {
    let vectors = [];
    for (const stop of stops) {
        const point = pointFromStop(stop);
        vectors.push( new Vector3(point[0],point[1],point[2]) );
    }

    const spline = new CatmullRomCurve3(vectors)
    const points = spline.getPoints(stops.length * global.options.line.detail)
    let geometry = new BufferGeometry().setFromPoints( points );
    let line = null;

    if(global.options.line.random) {
        line = new Line(geometry);
    } else {
        const lineColor = global.options.line.custom ? new Color(global.options.line.customColor) : new Color(color[0], color[1],color[2])
        let material =  new LineBasicMaterial({color: lineColor, alphaTest: 0.1, opacity: global.options.line.opacity, transparent: true })
        line = new Line(geometry, material);
    }

    line["spline"] = spline;
    line["atomId"] = id;
    // line["length"] = spline.getLength()

    return line
}

// convert a stop id to a position on the map, using simple math. Proper calculation would be trigonometry based lat/lon calcs.
const pointFromStop = (stopId) => {
    const stop = global.stops[stopId],
        calc = global.options.points,
        doubleToX = calc.maxToX * 2,
        doubleToY = calc.maxToY * 2,

        y = (stop.lat - calc.minLat) * doubleToY - calc.maxToY,
        x = (stop.lon - calc.minLon) * doubleToX - calc.maxToX,
        z = stop.elevation ? stop.elevation / calc.zDivider : 0.1;

    return [x, y, z];
}

// take a journey from datasource and convert it to a particle object / Atom
export const convertJourneyToAtom = (journey, id) => {
    const color = vehicleTypeToRGBColor(journey.vehicleType, id);

    return new Atom(
        lineFromStops(journey.stops, color, id),
        journey.startTime,
        journey.endTime,
        journey.vehicleType,
        -1,
        color,
        journey.stops.length,
    );
}

// helper for rgb color of vehicle type
const vehicleTypeToRGBColor = (type, id) => {
    const color = vehicleTypeToColor(type, id)
    return [color.r, color.g, color.b]
}

// get the color of a transport type. defined in options.typeColors
const vehicleTypeToColor = (type, id) => {
    if(!type)
        type = 0;

    if(global.options.line.regionalColored && type === 700) {
        //RUT:ServiceJourney:12-115751-13010804 get out 12
        try {
            const routeNumber = id.split(":")[2].split("-")[0];
            if(routeNumber >= 100 && routeNumber <= 1000) {
                type = 701;
            }
        } catch (e) {
            console.error("Journey id malformed:", id);
        }
    }

    if(!global.options.typeColors.hasOwnProperty(type.toString())) {
        console.warn("<<<<<<<<<<<<<<<<<< unknown vehicle type" + type.toString())
        return new Color(0x000000)
    }
    return global.options.typeColors[type.toString()];
}

