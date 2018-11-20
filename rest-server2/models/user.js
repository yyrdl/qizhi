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
const crypto = require("crypto");
const config = require("../config");

const dbUtility = require("../util/dbUtil");
const etcdConfig = require("../config/etcd");
const logger = require("../config/logger");

// module dependencies
const co = require("zco");
const crypto = require("crypto");
const config = require("../config");
const etcd2 = require("../service/db").etcd2;
const logger = require("../service/logger");
const virtualCluster = require("./vc");

function encrypt(username, password) {
  return co.brief(function*(resume) {
    let iterations = 10000;
    let keylen = 64;
    let salt = crypto
      .createHash("md5")
      .update(username)
      .digest("hex");

    let [err, derivedKey] = yield crypto.pbkdf2(
      password,
      salt,
      iterations,
      keylen,
      "sha512",
      resume
    );

    if (err) {
      throw err; //修饰一下？
    }

    return derivedKey.toString("hex");
  });
}

const update = function(username, password, admin, modify) {
  return co.brief(function*(resume) {
    if (undefined == modify) {
      return false;
    }
    let [errMsg, res] = yield etcd2.has(etcdConfig.userPath(username),null,resume );

    if (errMsg) {
      throw errMsg;
    }

    if (res !== modify) {
      return false;
    }

    let [err, derivedKey] = yield encrypt(username, password);

    if (err) {
      throw err;
    }

    if (modify) {

      [errMsg, res] = yield etcd2.set(etcdConfig.userPasswdPath(username),derivedKey,{ prevExist: true },resume);

      if (errMsg) {
        logger.warn(
          "modify %s password failed. error message:%s",
          etcdConfig.userPasswdPath(username),
          errMsg
        );
        throw errMsg;
      }

      if (undefined != admin) {
        return yield setUserAdmin(admin, username);
      }

      return true;
    }

    [errMsg, res] = yield etcd2.set(etcdConfig.userPath(username),null,{ dir: true },resume);

    if (errMsg) {
      logger.warn("create %s user directory failed. error message:%s",etcdConfig.userPath(username),errMsg);
      throw errMsg;
    }
    // TODO : 原代码在上一步create dir 失败时 也会执行这一步，这里的逻辑是create dir失败 就不往下执行了
    // 这个逻辑需要check 一下

    [errMsg, res] = yield etcd2.set(etcdConfig.userPasswdPath(username), derivedKey,null,resume);

    if (errMsg) {
      logger.warn("set %s password failed. error message:%s", etcdConfig.userPasswdPath(username), errMsg);
      throw errMsg;
    }

    return yield setUserAdmin(admin,username);
  });
};

const setUserAdmin = function(admin,username){
    return co.brief(function*(resume){

        let isAdmin = 'undefined' === typeof admin ? false:"admin";

        let [errMsg] = yield etcd2.set(etcdConfig.userAdminPath(username),isAdmin,null,resume);

        if(errMsg){
            logger.warn(
                "set %s admin failed. error message:%s",
                etcdConfig.userAdminPath(username),
                errMsg
            );
            throw errMsg;
        }
        return true;
    })
}

 
const remove = function (username){
    return co.brief(function*(resume){
        if("undefined" === typeof username){
            throw new Error("user does not exist");
        }

        let [errMsg,res] = yield etcd2.has(etcdConfig.userPath(username),null,resume);
        if(errMsg){
            throw errMsg;
        }
        if(!res){
            throw new Error("user does not exist");
        }

        [errMsg,res] = yield etcd2.get(etcdConfig.userAdminPath(username),null,resume);

        if(errMsg){
            throw errMsg;
        }

        if("true" === res.get(etcdConfig.userAdminPath(username))){
            throw new Error("can not delete admin user");
        }

        [errMsg] = yield etcd2.delete(etcdConfig.userPath(username),{ recursive: true },resume);
        if(errMsg){
            throw new Error("delete user failed");
        }
        return true;
    })
}
 

const updateUserVc = (username, virtualClusters, callback) => {
  if (typeof username === "undefined") {
    callback(new Error("user does not exist"), false);
  } else {
    db.get(etcdConfig.userPath(username), null, (errMsg, res) => {
      if (errMsg) {
        logger.warn("user %s not exists", etcdConfig.userPath(username));
        callback(errMsg, false);
      } else {
        VirtualCluster.prototype.getVcList((vcList, err) => {
          if (err) {
            logger.warn("get virtual cluster list error\n%s", err.stack);
          } else if (!vcList) {
            logger.warn(
              "list virtual clusters error, no virtual cluster found"
            );
          } else {
            let updateVcList =
              res.get(etcdConfig.userAdminPath(username)) === "true"
                ? Object.keys(vcList)
                : virtualClusters
                    .trim()
                    .split(",")
                    .filter(updateVc => updateVc !== "");
            let addUserWithInvalidVc = false;
            for (let item of updateVcList) {
              if (!vcList.hasOwnProperty(item)) {
                if (!res.has(etcdConfig.userVirtualClusterPath(username))) {
                  updateVcList.length = 0;
                  addUserWithInvalidVc = true;
                  break;
                } else {
                  return callback(new Error("InvalidVirtualCluster"), false);
                }
              }
            }
            if (!updateVcList.includes("default")) {
              // always has 'default' queue
              updateVcList.push("default");
            }
            updateVcList.sort();
            db.set(
              etcdConfig.userVirtualClusterPath(username),
              updateVcList.toString(),
              null,
              (errMsg, res) => {
                if (errMsg) {
                  logger.warn(
                    "update %s virtual cluster: %s failed, error message:%s",
                    etcdConfig.userVirtualClusterPath(username),
                    errMsg
                  );
                  callback(errMsg, false);
                } else {
                  if (addUserWithInvalidVc) {
                    callback(new Error("InvalidVirtualCluster"), false);
                  } else {
                    callback(null, true);
                  }
                }
              }
            );
          }
        });
      }
    });
  }
};

const checkUserVc = (username, virtualCluster, callback) => {
  if (typeof username === "undefined") {
    callback(new Error("user does not exist"), false);
  } else {
    virtualCluster = !virtualCluster ? "default" : virtualCluster;
    if (virtualCluster === "default") {
      callback(null, true); // all users have right access to 'default'
    } else {
      VirtualCluster.prototype.getVcList((vcList, err) => {
        if (err) {
          logger.warn("get virtual cluster list error\n%s", err.stack);
        } else if (!vcList) {
          logger.warn("list virtual clusters error, no virtual cluster found");
        } else {
          if (!vcList.hasOwnProperty(virtualCluster)) {
            return callback(new Error("VirtualClusterNotFound"), false);
          }
          db.get(
            etcdConfig.userVirtualClusterPath(username),
            null,
            (errMsg, res) => {
              if (errMsg || !res) {
                callback(errMsg, false);
              } else {
                let userVirtualClusters = res
                  .get(etcdConfig.userVirtualClusterPath(username))
                  .trim()
                  .split(",");
                for (let item of userVirtualClusters) {
                  if (item === virtualCluster) {
                    return callback(null, true);
                  }
                }
                callback(new Error("NoRightAccessVirtualCluster"), false);
              }
            }
          );
        }
      });
    }
  }
};

const setDefaultAdmin = callback => {
  update(
    etcdConfig.adminName,
    etcdConfig.adminPass,
    true,
    false,
    (res, status) => {
      if (!status) {
        throw new Error("unable to set default admin");
      } else {
        updateUserVc(etcdConfig.adminName, "", (errMsg, res) => {
          if (errMsg || !res) {
            throw new Error("unable to set default admin virtual cluster");
          }
        });
      }
    }
  );
};

const prepareStoragePath = () => {
  db.set(etcdConfig.storagePath(), null, { dir: true }, (errMsg, res) => {
    if (errMsg) {
      throw new Error("build storage path failed");
    } else {
      setDefaultAdmin();
    }
  });
};

if (config.env !== "test") {
  db.has(etcdConfig.storagePath(), null, (errMsg, res) => {
    if (!res) {
      prepareStoragePath();
    } else {
      logger.info("base storage path exists");
    }
  });
}

// module exports
module.exports = { encrypt, db, update, remove, updateUserVc, checkUserVc };
