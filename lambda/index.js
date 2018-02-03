'use strict';

const AWS = require('aws-sdk');
var https = require('https');
var request = require('request').defaults({ encoding: null });
var base64 = require('base-64');

const S3 = new AWS.S3({
  signatureVersion: 'v4',
});
const Sharp = require('sharp');

const BUCKET = process.env.BUCKET;
const URL = process.env.URL;
const ALLOWED_DIMENSIONS = new Set();

if (process.env.ALLOWED_DIMENSIONS) {
  const dimensions = process.env.ALLOWED_DIMENSIONS.split(/\s*,\s*/);
  dimensions.forEach((dimension) => ALLOWED_DIMENSIONS.add(dimension)
)
  ;
}

const getFallbackImage(url) = (image) => {
  request.get(url, function (error, response, body))
  {

  }
};

exports.handler = function (event, context, callback) {

  console.log(event, context, callback);
  const path = event.path;
  const pathBits = path.split(/\/+/);
  console.log(pathBits);
  const match = pathBits[0].match(/((\d+)x(\d+))/);
  if (!match) {
    callback(null, {
      statusCode: '403',
      headers: {},
      body: ''
    });
    return;
  }
  const dimensions = match[1];
  const width = parseInt(match[2], 10);
  const height = parseInt(match[3], 10);

  if (pathBits.length <= 1)
  {
    callback(null, {
      statusCode: '403',
      headers: {},
      body: ''
    });
    return;
  }

  const encodedURL = pathBits[1];

  if (ALLOWED_DIMENSIONS.size > 0 && !ALLOWED_DIMENSIONS.has(dimensions)) {
    callback(null, {
      statusCode: '403',
      headers: {},
      body: ''
    });
    return;
  }

  let replaceUrl = null;
  if (pathBits.length > 1)
  {
    replaceUrl = base64.decode(pathBits[2]);
  }

  const imageURL = base64.decode(encodedURL);

  console.log("Getting URL", imageURL);

  request.get(imageURL, function (error, response, body) {
      if (response.statusCode !== 200)
      {

      }
      Sharp(Buffer.from(body))
        .resize(width, height)
        .toFormat('png')
        .toBuffer()
        .then(buffer => S3.putObject({
        Body: buffer,
        Bucket: BUCKET,
        ContentType: 'image/png',
        Key: path,
      }).promise())
    .then(() => callback(null, {
        statusCode: '301',
        headers: { 'location': `${URL}/${path}` },
        body: '',
      }))
    .catch(err => callback(err));

    });
}
