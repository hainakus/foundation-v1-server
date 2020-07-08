/*
 *
 * PoolServer (Updated)
 *
 */

// Import Network Modules
var apicache = require('apicache');
var bodyParser = require('body-parser');
var compress = require('compression');
var cors = require('cors')
var express = require('express');

// Import Pool Functionality
var PoolAPI = require('./api.js');

// Pool Server Main Function
/* eslint no-unused-vars: ["error", { "args": "none" }] */
var PoolServer = function (logger) {

    // Load Useful Data from Process
    var portalConfig = JSON.parse(process.env.portalConfig);
    var poolConfigs = JSON.parse(process.env.pools);

    // Establish Server Variables
    var portalApi = new PoolAPI(logger, portalConfig, poolConfigs);
    var portalStats = portalApi.stats;
    var logSystem = 'Server';

    // Establish Initial Global Statistics
    portalStats.getGlobalStats(function() {
        logger.debug(logSystem, 'History', 'Updated global statistics for API endpoints');
    });

    // Establish Global Statistics Interval
    var globalInterval = setInterval(function() {
        portalStats.getGlobalStats(function() {
            if (portalConfig.debug) {
                logger.debug(logSystem, 'History', 'Updated global statistics for API endpoints');
            }
        });
    }, portalConfig.stats.updateInterval * 1000);

    // Build Main Server
    var app = express();
    var cache = apicache.middleware;
    app.use(bodyParser.json());
    app.use(cache('5 minutes'));
    app.use(compress());
    app.use(cors());
    app.get('/api/v1/:method', function(req, res, next) {
        portalApi.handleApiRequest(req, res, next);
    });
    app.use(function(err, req, res, next) {
        console.error(err.stack);
        res.send(500, 'Something broke!');
    });

    try {
        // Main Server is Running
        app.listen(portalConfig.server.port, portalConfig.server.host, function () {
            logger.debug(logSystem, 'Server', `Website started on ${
            portalConfig.server.host  }:${  portalConfig.server.port}`);
        });
    }
    catch(e) {
        // Error Starting Main Server
        clearInterval(globalInterval);
        logger.error(logSystem, 'Server', `Could not start website on ${
        portalConfig.server.host  }:${  portalConfig.server.port
        } - its either in use or you do not have permission`);
    }
}

// Export Pool Server
module.exports = PoolServer;
