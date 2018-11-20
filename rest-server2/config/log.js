/***
 * log config
 * log lib: winston (https://github.com/winstonjs/winston)
 */

const Joi = require("joi");
const winston = require("winston");

/***
 *
 * log level
 * */
exports.level = process.env.LOG_LEVEL || "info";



/**
 * see:
 *
 * https://github.com/winstonjs/winston#transports
 *
 * &
 *
 * https://github.com/winstonjs/winston/blob/master/docs/transports.md
 *
 * Transport is essentially a storage device for your logs.
 */

const defaultTranport = new winston.transports.Console({
  format: winston.format.json()
});

exports.transports = [defaultTranport];
