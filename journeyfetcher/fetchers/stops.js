const fs = require('fs');
const papa = require('papaparse');
const fetch = require('node-fetch');
const jsonwriter = require('../helpers/jsonwriter');

const stopsPath = 'stops';

/**
 * Getting all the stops with latitude, longitude and vehicle type, then adding elevations from google API,
 * before writing it to JSON. If stops.json already exists, it updates only if there are new stops in stops.txt or if
 * the latitude or longitude has changed
 *
 */
const getStops = (gtfsPath, currentAgency) => {
    console.log('Fetching stops');
    const stopsFile = fs.createReadStream(gtfsPath + 'stops.txt');
    let stops = {};

    return new Promise((resolve, reject) => {
        papa.parse(stopsFile, {
            header: true,
            step: function (results) {
                let stop = results.data[0];
                let key = stop.stop_id;

                cleanStopRow(stop);
                stops[key] = stop;

            },
            complete: async (results) => {
                console.log('Number of stops: ' + Object.keys(stops).length);
                if (currentAgency === 'all') {

                    let json = await jsonwriter.writeJson(stops, stopsPath + currentAgency + '.json.gz');
                    return resolve(json);

                } else {
                    stops = await getElevations(stops);
                    let json = await jsonwriter.writeJson(stops, stopsPath + currentAgency + '.json.gz');

                    resolve(json);


                }


            }
        });
    });

};

/**
 * Removes unused columns in stops.txt
 */
const cleanStopRow = (stop) => {
    let columnsToDelete = ['stop_id', 'stop_code', 'stop_desc', 'zone_id', 'stop_url',
        'location_type', 'wheelchair_boarding', 'stop_timezone', 'platform_code'];
    columnsToDelete.forEach((e) => (delete stop[e]));
    ['stop_lat', 'stop_lon', 'vehicle_type'].forEach((e) => stop[e] = parseFloat(stop[e]));
    stop['lat'] = stop.stop_lat;
    stop['lon'] = stop.stop_lon;
    stop['name'] = stop.stop_name;
    ['stop_name', 'stop_lat', 'stop_lon'].forEach((e) => delete stop[e]);
    return stop;
};

/**
 * Creates a query string of the latitude and longitude and getting the elevations for 300 stops at the time
 * @returns {Promise<void>}
 */
const getElevations = async (stops) => {
    let queryString = "";
    let counter = 0;
    let elevations = [];
    let fetchedElevations;
    for (let key of Object.keys(stops)) {

        queryString += stops[key].lat + "," + stops[key].lon + "|";

        if (counter % 300 === 0) {
            fetchedElevations = await getElevation(queryString.slice(0, -1));
            queryString = "";
            elevations.push.apply(elevations, fetchedElevations);
        }
        counter++;
    }
    fetchedElevations = await getElevation(queryString.slice(0, -1));
    elevations.push.apply(elevations, fetchedElevations);
    stops = addElevations(elevations, stops);

    return stops;

};

/**
 * Adds the elevations to the stop json
 */
const addElevations = (elevations, stops) => {
    let counter = 0;
    for (let key of Object.keys(stops)) {
        stops[key].elevation = elevations[counter];
        counter++;
    }
    return stops;


};

/**
 * Calls the Google API with the querystring of latitudes and longitudes, and adds them to the elevations list
 * @param coordinates - query string with coordinates separated with '|'
 * @returns {Promise<void>}
 */
const getElevation = async (coordinates) => {
    let elevations = [];
    return new Promise(async (resolve, reject) => {
        const response = await fetch('https://maps.googleapis.com/maps/api/elevation/json?locations=' +
            coordinates + '&key=AIzaSyBwJ8bcHQ2HHKBioTlLlifxeu_XNw7TvB4');
        const json = await response.json();
        // const json = {results: []}

        for (let result of json.results) {
            elevations.push(Math.round(result.elevation));
        }

        resolve(elevations);
    })

};

module.exports = {getStops};
