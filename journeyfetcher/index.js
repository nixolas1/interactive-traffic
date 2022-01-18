const gtfsFetcher = require('./filehandling/GTFSFetcher');
const stopFetcher = require('./fetchers/stops');
const journeyFetcher = require('./fetchers/journeys');
const datehelper = require('./helpers/datehelper');
const fs = require('fs');
const express = require('express');


const stopsPath = 'stops';
const journeysPath = 'journeys';
const gtfsPath = 'output/';
const agencies = ['ruter', 'nsb', 'all'];
const gtfsURLs = {
    'ruter': 'https://storage.googleapis.com/marduk-production/outbound/gtfs/rb_rut-aggregated-gtfs.zip',
    'nsb': 'https://storage.googleapis.com/marduk-production/outbound/gtfs/rb_nsb-aggregated-gtfs.zip',
    'all': 'https://storage.googleapis.com/marduk-production/outbound/gtfs/rb_norway-aggregated-gtfs.zip'
};

let previousJourneyFetch = {
    'ruter': new Date(0),
    'nsb': new Date(0),
    'all': new Date(0),

};

let previousStopFetch = {
    'ruter': new Date(0),
    'nsb': new Date(0),
    'all': new Date(0),

};

const app = express();
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Content-Encoding");
    next();
});


/**
 * Endpoint for fetching journeys. Date parameter is optional.
 * If no date parameter, the journeys on the current date is fetched.
 */
app.get('/journeys', async (req, res) => {
    res.header('Content-Type', 'application/json');
    res.header('Content-Encoding', 'gzip');


    let date;
    let currentAgency;

    if (typeof req.query.agency === 'undefined') {
        currentAgency = 'ruter';
    } else {
        currentAgency = req.query.agency;
    }

    console.log("Fetching journeys from " + currentAgency);

    let currentGtfsPath = gtfsPath + currentAgency + '/';

    let currentJourneysPath = journeysPath + currentAgency + '.json.gz';
    let updatedToday = await gtfsFetcher.checkGtfs(currentGtfsPath);
    if (!updatedToday) {
        await gtfsFetcher.fetchGtfs(gtfsURLs[currentAgency], currentGtfsPath, currentAgency);

    }

    if (typeof req.query.date === 'undefined') {
        console.log('Date is not defined. Setting today\'s date');
        date = new Date();

    } else {
        let day = parseInt(req.query.date.substr(0, 2));
        let month = parseInt(req.query.date.substr(3, 2));
        let year = parseInt(req.query.date.substr(6, 4));

        if (datehelper.isValidDate(day, month, year)) {
            date = new Date(year, month - 1, day);


        } else {
            res.send('The date is not valid. The format is dd-mm-yyyy');

        }
    }
    console.log('Getting journeys from date: ' + date.toDateString());
    await getJourneysOnDate(date, res, currentAgency, currentJourneysPath);
});

const getJourneysOnDate = async (date, response, currentAgency, currentJourneysPath) => {

    if (previousJourneyFetch[currentAgency].toDateString() === date.toDateString()) {
        console.log('This date was the previous fetched journeys. Returning cached journeys');
        try {
            let journeys = fs.readFileSync(currentJourneysPath);
            response.send(journeys);
        } catch (e) {
            response.send("Something went wrong");
            console.log(e);
        }

    } else {
        try {

            let json = await journeyFetcher.getJourneys(date, gtfsPath, currentAgency);
            response.send(json);
            previousJourneyFetch[currentAgency] = date;
        } catch (e) {
            response.send("Something went wrong");
            console.log(e);
        }
    }
};


app.get('/stops', async (req, res) => {
    res.header('Content-Type', 'application/json');
    res.header('Content-Encoding', 'gzip');

    let currentAgency;

    if (typeof req.query.agency === 'undefined') {
        currentAgency = 'ruter';
    } else {
        currentAgency = req.query.agency;
    }
    console.log("Fetching stops from " + currentAgency);

    let currentGtfsPath = gtfsPath + currentAgency + '/';

    let currentStopsPath = stopsPath + currentAgency + '.json.gz';

    let updatedToday = await gtfsFetcher.checkGtfs(currentGtfsPath);
    if (!updatedToday) {
        await gtfsFetcher.fetchGtfs(gtfsURLs[currentAgency], currentGtfsPath, currentAgency);

    }
    if (previousStopFetch[currentAgency].toDateString() === new Date().toDateString()) {
        console.log('Stops already fetched today. Returning cached stops');
        try {
            let stops = fs.readFileSync(currentStopsPath);
            res.send(stops);
        } catch (e) {
            res.send("Something went wrong");
            console.log(e);
        }

    } else {

        try {
            let json = await stopFetcher.getStops(currentGtfsPath, currentAgency);
            res.send(json);
        } catch (e) {
            res.send("Something went wrong");
            console.log(e);
        }
        previousStopFetch[currentAgency] = new Date();
    }


});

app.get('/cacheall', async (req, res) => {
    res.send("Caching all data");
    await cacheAllStops();
    cacheAllJourneys();


});


const cacheAllStops = async () => {
    return new Promise(async (resolve, reject) => {
        for (let currentAgency of agencies) {

            console.log("Fetching stops from " + currentAgency);

            let currentGtfsPath = gtfsPath + currentAgency + '/';

            await gtfsFetcher.fetchGtfs(gtfsURLs[currentAgency], currentGtfsPath, currentAgency);

            try {
                stopFetcher.getStops(currentGtfsPath, currentAgency);

            } catch (e) {
                res.send("Something went wrong");
                console.log(e);
            }
            previousStopFetch[currentAgency] = new Date();
        }
        resolve();
    })
};

const cacheAllJourneys = async () => {
    for (let currentAgency of agencies){
        console.log("Fetching journeys from " + currentAgency);
        let currentGtfsPath = gtfsPath + currentAgency + '/';

        await gtfsFetcher.fetchGtfs(gtfsURLs[currentAgency], currentGtfsPath, currentAgency);
        
        let date = new Date();

        console.log('Getting journeys from date: ' + date.toDateString());
        journeyFetcher.getJourneys(date, gtfsPath, currentAgency);
        previousJourneyFetch[currentAgency] = date;
    }
};
app.listen(3000, () => console.log('Server running on port 3000'));
