'use strict';

require('dotenv').config();
var AWS = require('aws-sdk');
var https = require('https');
var rp = require('request-promise-native');
var base64 = require('base-64');
var utf8 = require('utf8');

const S3 = new AWS.S3({
    signatureVersion: 'v4'
});
const Sharp = require('sharp');


if (process.env.ALLOWED_DIMENSIONS) {
    const dimensions = process.env.ALLOWED_DIMENSIONS.split(/\s*,\s*/);
    dimensions.forEach(function (dimension) {
        ALLOWED_DIMENSIONS.add(dimension)
    });
}

function doResize(body, width, height) {
    var buffer = Buffer.from(body);
    console.log(buffer, width, height);
    return Sharp(buffer)
        .resize(width, height)
        .png({
            compressionLevel: 9,
        })
        .toBuffer();
}

exports.handler = function (event, context, callback) {

    const BUCKET = process.env.BUCKET;
    const URL = process.env.URL;
    const ALLOWED_DIMENSIONS = new Set();

    //console.log(event, context, callback);
    var path = event.queryStringParameters.key;
    console.log("PATH", path);
    if (path.charAt(0) == '/') {
        path = path.substr(1);
    }
    const pathBits = path.split(/\/+/).filter(function (bit) {
        return bit.length > 0;
    });
    console.log(pathBits);
    const match = pathBits[0].match(/((\d+)?x(\d+)?)/);
    if (!match) {
        callback(null, {
            statusCode: '403',
            headers: {},
            body: ''
        });
        return;
    }
    const dimensions = match[1];
    const width = match[2] ? parseInt(match[2], 10) : null;
    const height = match[3] ? parseInt(match[3], 10) : null;

    if (pathBits.length <= 1) {
        callback(null, {
            statusCode: '403',
            headers: {},
            body: ''
        });
        return;
    }

    let lastUrlBit = pathBits[pathBits.length - 1];
    console.log('lastUrlBit', lastUrlBit);

    // check the last bit to see if it's a valid URL by itself
    var replaceUrl = null;
    if (pathBits.length > 2) {
        try {

            replaceUrl = base64.decode(decodeURIComponent(lastUrlBit));
        } catch (e) {
            // might mean we need to use all path bits to create the URL
        }
    }

    console.log(replaceUrl);

    function callback404(message) {
        console.log('callback404', replaceUrl, message);
        return callback(null, replaceUrl ? {
            statusCode: '302',
            headers: {location: replaceUrl},
            body: ''
        } : {
            statusCode: '404',
            body: message
        });
    }

    // if there's a '/' in the base64 encoded data, this needs to grab and concatenate all the bits
    const encodedURL = pathBits.slice(1, replaceUrl ? pathBits.length - 1 : pathBits.length).join('/');

    if (ALLOWED_DIMENSIONS.size > 0 && !ALLOWED_DIMENSIONS.has(dimensions)) {
        callback(null, {
            statusCode: '403',
            headers: {},
            body: ''
        });
        return;
    }


    var imageURL = null;
    try {
        console.log(decodeURIComponent(encodedURL));
        imageURL = base64.decode(decodeURIComponent(encodedURL));
    } catch (e) {

        return callback404('error decoding image URL');

    }

    console.log("Getting URL", imageURL);

    // keep images for a month
    var maxAge = 60 * 60 * 24 * 30;


    rp.get({
        uri: imageURL,
        resolveWithFullResponse: true,
        encoding: null,
        headers: {'User-Agent': 'Podchaser/ImageResizeCache'},
        timeout: 8000
    })
        .then(function (response) {
            //console.log(response);
            return doResize(response.body, width, height)
                .then(function (buffer) {
                        return S3.putObject({
                            Body: buffer,
                            Bucket: BUCKET,
                            ContentType: 'image/png',
                            Key: path,
                            CacheControl: `max-age=${maxAge}`
                        }).promise();
                    }
                )
                .catch(function (e) {
                    console.log("failed image", e.message);
                    return callback404(e.message);

                });
        })
        .then(function () {
            callback(null, {
                statusCode: '301',
                headers: {'location': URL + '/' + path},
                body: ''
            })
        })
        .catch(function (e) {
            if (e.response) {
                console.log("failed", e.request && e.request.headers, e.response.statusCode, replaceUrl);
            } else {
                console.log("failed", e.message, replaceUrl);
            }
            return callback(null, replaceUrl ? {
                statusCode: '302',
                headers: {location: replaceUrl},
                body: ''
            } : {
                statusCode: '404'
            })
        });

};
