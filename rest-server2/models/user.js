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

const co = require("zco");
const crypto = require("crypto");
const etcdConfig = require("../config").etcd;
const etcd2 = require("../service/db").etcd2;
const logger = require("../service/logger");
const VirtualCluster = require("./vc");

/*** 
 * @param {String} username
 * @param {String} password
 * @return {String}
 * @api public
*/
function encrypt(username, password) {
  return co.brief(function*(resume) {

    let iterations = 10000;

    let keylen = 64;

    let salt = crypto.createHash("md5").update(username).digest("hex");

    let [err, derivedKey] = yield crypto.pbkdf2(password,salt,iterations,keylen,"sha512",resume);

    if (err) {
      throw err; //修饰一下？
    }

    return derivedKey.toString("hex");
  });
}
/*** 
 * @param {String} username
 * @param {String} password
 * @param {Boolean} admin
 * @param {Boolean} modify
 * @return {Boolean}
 * @api public
*/
const update = function(username, password, admin, modify) {
  return co.brief(function*(resume) {

    if (undefined == modify) {
      return false;
    }

    let [errMsg, res] = yield etcd2.has(etcdConfig.userPath(username),null,resume);

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
        logger.warn("modify %s password failed. error message:%s",etcdConfig.userPasswdPath(username),errMsg);
        throw errMsg;
      }

      if (undefined != admin) {
        return yield _setUserAdmin(admin, username);
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

    return yield _setUserAdmin(admin,username);
  });
};
/*** 
 * @param {Boolean} admin
 * @param {String} username
 * @return {Boolean}
 * @api private
*/
const _setUserAdmin = function(admin,username){
    return co.brief(function*(resume){

        let isAdmin = 'undefined' === typeof admin ? false:admin;

        let [errMsg] = yield etcd2.set(etcdConfig.userAdminPath(username),isAdmin,null,resume);

        if(errMsg){
            logger.warn("set %s admin failed. error message:%s",etcdConfig.userAdminPath(username),errMsg);
            throw errMsg;
        }

        return true;
    });
}

/*** 
 * @param {String} username
 * @return {Boolean}
 * @api public
*/
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
    });
}

/** 
 * @param {String} username
 * @param {String} virtualClusters
 * @return {Boolean}
 * @api public
*/
const updateUserVc = function(username,virtualClusters){
    return co.brief(function*(resume){
        if(!username){
            throw new Error("user does not exist")
        }
        let [errMsg,res] = yield etcd2.get(etcdConfig.userPath(username),null,resume);

        if(errMsg){
            logger.warn("user %s not exists", etcdConfig.userPath(username));
            throw errMsg;
        }

        let vcList = yield VirtualCluster.getVcList();

        if(!vcList){
            return logger.warn("list virtual clusters error, no virtual cluster found");
        }

        let updateVcList = null;

        if("true" == res.get(etcdConfig.userAdminPath(username))){
            updateVcList = Object.keys(vcList);
        }else{
            updateVcList = virtualClusters.trim().split(",").filter(updateVc=> updateVc !=="");
        }

        let addUserWithInvalidVc = false;

        let virtual_cluster_path = etcdConfig.userVirtualClusterPath(username);

        for(let item of updateVcList){
            if(!vcList.hasOwnProperty(item)){
               if(!res.has(virtual_cluster_path)){
                   updateVcList = [];
                   addUserWithInvalidVc = true;
                   break;
               }else{
                   throw new Error("InvalidVirtualCluster");
               }
            }
        }

        if(!updateVcList.includes("default")){
            updateVcList.push("default");
        }

        updateVcList.sort();

        [errMsg] = yield etcd2.set(etcdConfig.userVirtualClusterPath(username),updateVcList.toString(),null,resume);

        if(errMsg){
            logger.warn("update %s virtual cluster: %s failed, error message:%s",etcdConfig.userVirtualClusterPath(username),errMsg );

            throw errMsg;
        }

        if(addUserWithInvalidVc){
            throw new Error("InvalidVirtualCluster");
        }

        return true;

    });
}

/**
 * @param {String} username
 * @param {String} virtualCluster
 * @return {Boolean}
 * @api public
 */
const checkUserVc = function (username,virtualCluster){
    return co.brief(function*(resume){

        if(!username){
            throw new  Error("user does not exist");
        }

        virtualCluster = !virtualCluster ? "default" : virtualCluster;

        if("default" === virtualCluster){
            return true;
        }

        let vcList = yield VirtualCluster.getVcList();

        if(!vcList){
            return  logger.warn("list virtual clusters error, no virtual cluster found");
        }
        if (!vcList.hasOwnProperty(virtualCluster)) {
            throw new Error("VirtualClusterNotFound");
        }

        let [errMsg,res] = yield etcd2.get(etcdConfig.userVirtualClusterPath(username),null,resume);
        /*** 
         *TODO:这里错误的 信息不够详细
        */
        if(errMsg || !res){
           throw errMsg;
        }
        let userVirtualClusters = res.get(etcdConfig.userVirtualClusterPath(username)).trim().split(",");

        let found = false;

        for (let item of userVirtualClusters) {
            if (item === virtualCluster) {
               found = true;
               break;
            }
        }

        if(found){
            return true;
        }

        throw new Error("NoRightAccessVirtualCluster");

    });

}

/** 
 * @return {Null}
 * @api private
*/
const _setDefaultAdmin = function(){
    return co.brief(function*(resume){

       let status =  yield update(etcdConfig.adminName,etcdConfig.adminPass,true,false);

       if(!status){
           throw new Error("unable to set default admin");
       }

       let [errMsg,res] = yield updateUserVc(etcdConfig.adminName,"",resume);

       if(!errMsg || !res){
           throw new Error("unable to set default admin virtual cluster");
       }
    });
}

 

const prepareStoragePath = () => {
  etcd2.set(etcdConfig.storagePath(), null, { dir: true }, (errMsg, res) => {
    if (errMsg) {
      throw new Error("build storage path failed");
    } else {
      _setDefaultAdmin()();
    }
  });
};

if (config.env !== "test") {
  etcd2.has(etcdConfig.storagePath(), null, (errMsg, res) => {
    if (!res) {
      prepareStoragePath();
    } else {
      logger.info("base storage path exists");
    }
  });
}

// module exports
module.exports = { encrypt, update, remove, updateUserVc, checkUserVc };
