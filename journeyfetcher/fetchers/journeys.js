const fs = require('fs');
const papa = require('papaparse');
const jsonwriter = require('../helpers/jsonwriter');


let stopsPath = 'stops';
let journeysPath = 'journeys';


const dayNumberToString = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday'
};


const getJourneys = async (journeysDate, gtfsPath, agency) => {
    let config = {
        'date': journeysDate,
        'formattedDate': parseInt(formatDate(journeysDate)),
        'day': dayNumberToString[journeysDate.getDay()],
        'currentAgency': agency,
        'currentGtfsPath': gtfsPath + agency + '/'
    };

    let dayTypes = await getDayTypes(config);
    let dayTypesWithExceptions = await getDateExceptions(dayTypes, config);
    let trips = await getTrips(dayTypesWithExceptions, config);
    let json = await getArrivalTimesAndStops(trips, config);
    return json;
};


/**
 * Format the date to comply with GTFS dates
 * @returns {string} - Formatted date complying with GTFS
 */
const formatDate = (date) => {
    let year = date.getFullYear().toString();
    let month = date.getMonth() + 1;
    month = month < 10 ? '0' + month.toString() : month.toString();
    let day = date.getDate() < 10 ? '0' + date.getDate().toString() : date.getDate().toString();
    return year + month + day;

};

/**
 * Get all daytypes that are valid on the wanted date from calendar.txt
 */

const getDayTypes = (config) => {
    console.log('Fetching daytypes');
    let dayTypes = [];
    if (!fs.existsSync(config.currentGtfsPath + 'calendar.txt')) {
        console.log(">>>>> WARN: No calendar.txt");
        return dayTypes
    }

    const calendarFile = fs.createReadStream(config.currentGtfsPath + 'calendar.txt');

    return new Promise(((resolve, reject) => {
        papa.parse(calendarFile, {
            header: true,
            step: (results) => {
                let service = results.data[0];
                if (serviceIsValid(service, config)) {
                    dayTypes.push(service.service_id);
                }
            },
            complete: (results) => {

                console.log('Got Daytypes');
                resolve(dayTypes);

            },
            error: (err, file, inputElem, reason) => {
                console.log(err, reason);
                reject(reason)
            }
        });
    }));
};

const serviceIsValid = (service, config) => {
    return service[config.day] === '1' && parseInt(service.start_date) < config.formattedDate
        && parseInt(service.end_date) > config.formattedDate
};

/**
 * Get the route exceptions on this date from calendar_dates.txt
 * @param dayTypes - Array of daytypes valid on this date
 */
const getDateExceptions = (dayTypes, config) => {
    console.log('Fetching exceptions on date');
    if (!fs.existsSync(config.currentGtfsPath + 'calendar_dates.txt')) {
        console.log("No calendar_dates.txt");
        return dayTypes
    }

    const calendarDatesFile = fs.createReadStream(config.currentGtfsPath + 'calendar_dates.txt');
    return new Promise(((resolve, reject) => {
        papa.parse(calendarDatesFile, {
            header: true,
            step: (results) => {
                let calendarDate = results.data[0];
                if (calendarDate && calendarDate.date === config.formattedDate.toString()) {
                    let serviceId = calendarDate.service_id;
                    if (calendarDate.exception_type === '1') {

                        if (dayTypes.indexOf(serviceId) === -1) {
                            dayTypes.push(serviceId);
                        }
                    }
                    if (calendarDate.exception_type === '2') {

                        let index = dayTypes.indexOf(serviceId);
                        if (index !== -1) {
                            dayTypes.splice(index, 1);
                        }

                    }

                }
            },
            complete: (results) => {

                console.log('Got date exceptions');
                resolve(dayTypes);
            },
            error: (err, file, inputElem, reason) => {
                console.log("calendar dates error!", inputElem, err, reason);
                resolve(dayTypes)
            }
        });

    }))


};


/**
 * Get the list of all trips going on this date from trips.txt
 * @param dayTypes - Array of daytypes valid on this date
 */
const getTrips = (dayTypes, config) => {
    console.log('Fetching trips');
    let trips = {};
    const tripsFile = fs.createReadStream(config.currentGtfsPath + 'trips.txt');
    return new Promise((resolve, reject) => {
        papa.parse(tripsFile, {
            header: true,
            step: (results) => {
                let trip = results.data[0];
                dayTypes.forEach((e) => {
                    if (trip.service_id === (e)) {
                        trips[trip.trip_id] = 1;
                    }
                })
            },
            complete: (results) => {

                console.log('Got trips');
                resolve(trips);
            }
        });
    });

};

/**
 * Get the stop_id's, start_time, end_time and vehicle_type for all trip_id's in trips array
 * @param trips - List of all trip_id's on this date
 */
const getArrivalTimesAndStops = async (trips, config) => {
    let jsonStops = await jsonwriter.readGZipJson(stopsPath + config.currentAgency + '.json.gz');
    let counter = 0;
    let jsonTrips = {};

    const stopTimesFile = fs.createReadStream(config.currentGtfsPath + 'stop_times.txt');

    let currentStartTime;
    let currentJourney;

    console.log('Start of processing stop times');
    return new Promise((resolve, reject) => {
        papa.parse(stopTimesFile, {
            header: true,
            error: function (err, file, inputElem, reason) {
                // executed if an error occurs while loading the file,
                // or if before callback aborted for some reason
                console.log(err, reason, inputElem)
            },
            step: (results) => {
                const row = results.data[0];
                counter++;
                if (counter % 500000 === 0) {
                    process.stdout.write(Math.round((results.meta.cursor / 3400000)) + "% ")
                }
                if (trips.hasOwnProperty(row.trip_id)) {
                    let tripObject = {};
                    if (row.stop_sequence === '1') {
                        currentStartTime = formatTimestamp(row.arrival_time.substr(0, 5), config);
                        currentJourney = row.trip_id;
                        if (!jsonTrips.hasOwnProperty(currentStartTime)) {
                            jsonTrips[currentStartTime] = {};
                        }
                        jsonTrips[currentStartTime][currentJourney] = {startTime: currentStartTime, stops: []};
                        tripObject = jsonTrips[currentStartTime][currentJourney];
                        tripObject.vehicleType = jsonStops[row.stop_id].vehicle_type;
                        tripObject.currentSequence = row.stop_sequence;
                    } else {
                        tripObject = jsonTrips[currentStartTime][currentJourney];
                    }

                    if (row.stop_sequence >= tripObject.currentSequence) {
                        tripObject.endTime = formatTimestamp(row.arrival_time.substr(0, 5), config);
                    }

                    tripObject.currentSequence = row.stop_sequence;
                    tripObject.stops.push(row.stop_id);

                    jsonTrips[currentStartTime][currentJourney] = tripObject;

                }
            },
            complete: async () => {
                console.log('Done processing stop times');
                jsonTrips = removeCurrentSequence(jsonTrips);

                let json = await jsonwriter.writeJson(jsonTrips, journeysPath + config.currentAgency + '.json.gz');
                resolve(json);

            }

        })
    });
};

const removeCurrentSequence = (journeys) => {
    for (let startTime of Object.keys(journeys)) {
        for (let journey of Object.keys(journeys[startTime])) {
            delete journeys[startTime][journey].currentSequence;
        }
    }
    return journeys
};


const formatTimestamp = (time, config) => {
    let hour = parseInt(time.substr(0, 2));
    let minute = parseInt(time.substr(3, 2));
    let date = config.date;
    if (hour >= 24) {
        let nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        let timestamp = new Date(nextDay.getFullYear(), nextDay.getMonth(),
            nextDay.getDate(), hour % 24, minute).getTime();
        return timestamp;

    } else {
        let timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute).getTime();
        return timestamp;
    }

};

module.exports = {getJourneys};
