/**
 * log client for this project
 * 
 * log lib : winston (https://github.com/winstonjs/winston)
*/
const winston = require("winston");
const config  = require("../config");

const defaultTransport = new winston.transports.Console({
    format:winston.format.json()
});

let transports = config.log.transports;

if(!Array.isArray(transports)){
    transports = [];
}


transports = transports.length > 0 ? transports : [defaultTransport];

const logger = winston.createLogger({
    level:config.log.level,
    transports:transports
});


module.exports  = logger;

