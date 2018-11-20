// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
//
// Copyright (c) Peking University 2018
//
// The software is released under the Open-Intelligence Open Source License V1.0.
// The copyright owner promises to follow "Open-Intelligence Open Source Platform
// Management Regulation V1.0", which is provided by The New Generation of
// Artificial Intelligence Technology Innovation Strategic Alliance (the AITISA).

// module dependencies

const Joi = require("joi");

// get config from environment variables
let config = {
  serverPort: process.env.SERVER_PORT,
  jwtSecret: process.env.JWT_SECRET
};

const serverConfigSchema = Joi.object()
  .keys({
    serverPort: Joi.number()
      .integer()
      .min(8000)
      .max(65535)
      .default(9186),
    jwtSecret: Joi.string()
      .required()
      .description("JWT Secret required to sign")
  })
  .required();

const { error, value } = Joi.validate(config, serverConfigSchema);

if (error) {
  throw new Error(`express server config error\n${error}`);
}

config = value;

module.exports = config;
