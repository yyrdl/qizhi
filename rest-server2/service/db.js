
const db = {};
const config = require("../config");

const ETCD2 = require("../utils/etcd2");


db.etcd2 = new ETCD2({
    hosts:config.etcd2.etcdHosts
});




module.exports = db;


