import global from "./Global";
import {Color} from "three";

const initOptions = () => {

    let dividingHour = 7,
        dividingMinute = 0,
        defaultSpeed = 20;

    if(window.location.hash.substr(1) === "now") {
        dividingHour = new Date().getHours();
        dividingMinute = new Date().getMinutes();
        defaultSpeed = 1;
    }
    // today at 03:00
    const startStamp = new Date(new Date().setHours(dividingHour, dividingMinute, 0, 0)).getTime();
    //tomorrow at 03:00 (sorry, but js Date is not smart)
    const endStamp = new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(dividingHour, 0, 0, 0)).getTime();

    global.options = {
        source: {
            baseUrl: window.location.hostname !== "localhost" ? "/" : "http://localhost:3000/",
            journeyUrl: "journeys",
            stopUrl: "stops",
        },
        scene: {
            bg: '#000000',
            pointColor: [255, 0, 0],
            fog: 0.001,
            map: true,
            pointSize: 7,
            pointAlpha: 0.2,
            bgImg: '/sprites/map_blue2.png'
        },
        camera: {
            speed: 0.005,
            range: 1,
            x: 0,
            y: 0,
            z: 10,
            rotX: 0,
            rotY: 0,
            rotZ: 0,
            autoRotate: 0,
            fov: 60,      // less = more sick, but nicer plane
            near: 0.001,
            far: 1000,
        },
        points: {
            sprite: '/sprites/particle3.png',
            maxCount: 4000,
            lightness: 0.8,
            maxToX: 17.8373,
            maxToY: 36,
            minLat: 59.40913320,
            minLon: 10.25,
            size: 200,
            zDivider: 1200
        },
        line: {
            enabled: true,
            random: false,
            custom: false,
            customColor: "#000000",
            opacity: 0.5,
            detail: 4,
            regionalColored: true,
            cleanupLines: true,
        },
        anim: {
            speedMulti: defaultSpeed,
        },
        time: {
            stamp: startStamp,
            startTime: startStamp,
            endTime: endStamp,
            date: 1, hour: 0, minute: 0, second: 0,
            extraTime: 0                             //time to keep points at end stop in ms
        },
        typeColors: {
            "0":   new Color(0xe30413),  // replacement bus
            "100": new Color(0xffffff),  // trains
            "401": new Color(0xef7d00),  // metro
            "700": new Color(0xe30413),  // city bus
            "701": new Color(0x76b82a),  // regional bus
            "900": new Color(0x009cdc),  // tram
            "1000": new Color(0x82358b), // ferry
            "1100": new Color(0x555555)  // air
        },
        dataTypes: {
            "0": true, //  "other",
            "100": true, // "train",
            "401": true, // "metro",
            "700": true, // "bus",
            "701": true, // "bus",
            "900": true, // "tram",
            "1000": true, // "boat",
            "1100": true, // "air",
            all: false,
            none: false,
            null: false
        },
        debug: {
            debug: false,
            pause: false,
        }
    }

    return global.options;
}

export default initOptions;
