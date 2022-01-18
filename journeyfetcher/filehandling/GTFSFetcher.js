const fetch = require('node-fetch');
const fs = require('fs');
const unzip = require('unzip2');
/**
 * Checks if GTFS files are present and updated this date
 */
const checkGtfs = (path) => {

    if (fs.existsSync(path + 'stops.txt')) {
        let updatedToday = checkIfUpdatedToday(path + 'stops.txt');

        if (updatedToday) {
            console.log('GTFS files are present and up to date');
            return true;

        } else {
            console.log('GTFS files are present, but not updated today');
            return false;
        }
    } else {
        console.log('GTFS files are not present');
        return false;
    }
};

const checkIfUpdatedToday = (path) => {
    let stats = fs.statSync(path);
    let mtime = stats.mtime;

    return mtime.toDateString() === new Date().toDateString()
};

/**
 * Downloads GTFS files and unzips the files into output/.
 * @returns {Promise<void>}
 */
const fetchGtfs = async (url, savePath, agency) => {
    console.log('Fetching GTFS files');
    let res = await fetch(url);
    return new Promise((resolve, reject) => {
        res.body.pipe(fs.createWriteStream('gtfs-files_' + agency + '.zip'))
            .on('finish', () => {
                fs.createReadStream('gtfs-files_' + agency + '.zip')
                    .pipe(unzip.Extract({path: savePath}))
                    .on('close', () => {
                        console.log('GTFS files saved in output/');
                        resolve();
                    })
                    .on('error', (error => {
                        console.log(error.message);
                        reject();
                    }));
            })
            .on('error', (error => {
                console.log(error.message);
                reject();
            }));
    })

};

module.exports = {checkGtfs, fetchGtfs};
