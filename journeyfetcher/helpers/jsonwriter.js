const fs = require('fs');
const zlib = require('zlib');
const Buffer = require('buffer').Buffer;

const writeJson = (jsonObject, path) => {
    let json = JSON.stringify(jsonObject, null, 2);
    let buffer = new Buffer.from(json);

    return new Promise((resolve, reject) => {

        zlib.gzip(buffer, (err, zippedData) => {
            if (err) {
                console.log("Error:" + err);
                reject();
            } else {
                fs.writeFile(path, zippedData, 'utf8', () => {
                    console.log('Wrote file: ' + path);
                    resolve(zippedData);

                });
            }
        });
    });
};

const readGZipJson = (path) => {
    let zippedFile = fs.readFileSync(path);

    return new Promise((resolve, reject) => {

        zlib.gunzip(zippedFile, (err, unzippedData) => {
                if (err) {
                    console.log("Error:" + err);
                    reject();
                } else {
                    let jsonParsed = JSON.parse(unzippedData.toString());
                    resolve(jsonParsed);

                }
            }
        );
    });

};

module.exports = {writeJson, readGZipJson};
