/**
 * Primary file for api
 *
 */

// Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');

// Instantiate HTTP server
var httpServer = http.createServer(function (req, res) {
    unifiedServer(req, res);
});

// Start HTTP server
httpServer.listen(config.httpPort, function () {
    console.log('The server is listening on port %s now in %s', config.httpPort, config.envName);
});

// Instantiate HTTP server
var httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};
var httpsServer = https.createServer(httpsServerOptions, function (req, res) {
    unifiedServer(req, res);
});
// Start HTTPS server
httpsServer.listen(config.httpsPort, function () {
    console.log('The server is listening on port %s now in %s', config.httpsPort, config.envName);
});




// All the server logic for both the http and https servers

var unifiedServer = function (req, res) {
    // Get url and parse it
    var parsedUrl = url.parse(req.url, true);

    // Get the path from url
    var path = parsedUrl.pathname;
    var trimedPath = path.replace(/^\/+|\/+$/g, '');

    // Get query string as an object
    var queryStringObject = parsedUrl.query;

    // Get http method
    var method = req.method.toLowerCase();

    // Get the headers as an object
    var headers = req.headers;

    // Get the payload, if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function (data) {
        buffer += decoder.write(data);
    });

    req.on('end', function () {
        buffer += decoder.end();

        // Choose the handler this request should go to. If one not found, use the notFound handler
        var chosenHandler = typeof(router[trimedPath]) !== 'undefined' ? router[trimedPath] : handlers.notFound;

        // Construct the data object to send to the handler
        var data = {
            'trimedPath': trimedPath,
            'quetyStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': buffer
        };
        // Route the request to the handler specified in the router
        chosenHandler(data, function (statusCode, payload) {
            // Use the status code called back by the handler, or default
            statusCode = typeof(statusCode) === 'number' ? statusCode : 200;
            // Use the payload called back by the handler, or default to status
            payload = typeof(payload) === 'object' ? payload : {};

            // Convert to string
            var payloadString = JSON.stringify(payload);


            // Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
            // Log the requests
            console.log('Status code: %s.\nPayload: %s.', statusCode, payloadString);
        });


    });
}

// Define handlers
var handlers = {};


handlers.hello = function(data, callback) {
    callback(200, {hello: 'Node.js'});
}

// Not found handler
handlers.notFound = function(data, callback) {
    callback(404);
};

// Define a request router
var router = {
    'hello': handlers.hello
};