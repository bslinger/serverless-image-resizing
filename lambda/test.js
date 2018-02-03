'use strict';

require('dotenv').config();
var base64 = require('base-64');

var index = require('./');

var validPath = base64.encode('https://www.google.com.au/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png');
//var validPath = 'aHR0cHM6Ly9jb20tcG9kaWFudC5hbXMzLmRpZ2l0YWxvY2VhbnNwYWNlcy5jb20vbWVkaWEvc3Bva2UvYml0c3Rvcm0vYXJ0d29yay8zNTVjYTZhNGRiZjNkMC5qcGc=';
var invalidPath = 'aHR0cHM6Ly9jb20tcG9kaWFudC5hbXMzLmRpZ2l0YWxvY2VhbnNwYWNlcy5jb20vbWVkaWEvc3Bva2UvYml0c3Rvcm0vYXJ0d29yay8zNTVjYTZhNGRiZjNkLmpwZw==';
var fallback = 'aHR0cHM6Ly93d3cucG9kY2hhc2VyLmNvbS9pbWFnZXMvbWlzc2luZy1pbWFnZS5wbmc=';

index.handler({queryStringParameters: { key: '/30x30' + '/' + validPath} }, 'context',function (args) { console.log(args)});
//handler({path: `30x30/${invalidPath}/${fallback}` }, 'context', (a, b) => console.log(b));