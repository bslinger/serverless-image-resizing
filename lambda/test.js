'use strict';

require('dotenv').config();

import {encode} from 'base-64';

import {handler} from './';

let validPath = encode('https://www.google.com.au/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png');
//let validPath = 'aHR0cHM6Ly9jb20tcG9kaWFudC5hbXMzLmRpZ2l0YWxvY2VhbnNwYWNlcy5jb20vbWVkaWEvc3Bva2UvYml0c3Rvcm0vYXJ0d29yay8zNTVjYTZhNGRiZjNkMC5qcGc=';
let invalidPath = 'aHR0cHM6Ly9jb20tcG9kaWFudC5hbXMzLmRpZ2l0YWxvY2VhbnNwYWNlcy5jb20vbWVkaWEvc3Bva2UvYml0c3Rvcm0vYXJ0d29yay8zNTVjYTZhNGRiZjNkLmpwZw==';
let fallback = 'aHR0cHM6Ly93d3cucG9kY2hhc2VyLmNvbS9pbWFnZXMvbWlzc2luZy1pbWFnZS5wbmc=';

handler({path: `30x30/${validPath}` }, 'context', (args) => console.log(args));
//handler({path: `30x30/${invalidPath}/${fallback}` }, 'context', (a, b) => console.log(b));