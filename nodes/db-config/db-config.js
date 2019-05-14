module.exports = function(RED) {
    var request = require("request");
    var userDetails;
    
    function DbConfigNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.on('input', function(msg) {
            var dbConfigArr = [];
            //console.log("here console data");
            var client_id = msg.payload.client_id;
            var consul_url = config.consul_url;
            var vault_token = config.vault_token;
            dbConfigArr['client_id'] = msg.payload.client_id; 
            dbConfigArr['task_id'] = msg.payload.task_id;
            dbConfigArr['time'] = msg.payload.time;
            dbConfigArr['project_id'] = msg.payload.project_id;
            dbConfigArr['user_id'] = msg.payload.user_id;

            //console.log(console_url+'console_url');
            promiseHost = new Promise((resolve, reject) => {
                setTimeout(() => {
                    var url = consul_url+":8500/v1/kv/wproject/domains/wsuite.com/clients/"+client_id+"/conf/db/host";
                    // Setting URL and headers for request
                    var options = {
                        url: url                                              
                    };
                    // Do async job
                    request.get(options, function(err, resp, body) {
                        if (err) {
                            reject(err);
                        } else {
                            var body = JSON.parse(body);
                            dbConfigArr['host'] =  Buffer.from(body[0].Value, 'base64').toString('ascii');                              
                            resolve(dbConfigArr);
                        }
                    })
                }, 2000)
            })

            promiseDbname = new Promise((resolve, reject) => {
                setTimeout(() => {
                    var url = consul_url+":8500/v1/kv/wproject/domains/wsuite.com/clients/"+client_id+"/conf/db/name";
                    // Setting URL and headers for request
                    var options = {
                        url: url                       
                    };
                    // Do async job
                    request.get(options, function(err, resp, body) {
                        if (err) {
                            reject(err);
                        } else {
                            var body = JSON.parse(body); 
                            dbConfigArr['dbname'] =  Buffer.from(body[0].Value, 'base64').toString('ascii');                                 
                            resolve(dbConfigArr);
                        }
                    })
                }, 2000)
            })

            promiseUsername = new Promise((resolve, reject) => {
                setTimeout(() => {
                    var url = consul_url+":8500/v1/kv/wproject/domains/wsuite.com/clients/"+client_id+"/conf/db/username";
                    // Setting URL and headers for request
                    var options = {
                        url: url                       
                    };
                    // Do async job
                    request.get(options, function(err, resp, body) {
                        if (err) {
                            reject(err);
                        } else {
                            var body = JSON.parse(body); 
                            dbConfigArr['username'] =  Buffer.from(body[0].Value, 'base64').toString('ascii');                            
                            resolve(dbConfigArr);
                        }
                    })
                }, 2000)
            })

            promisePassword = new Promise((resolve, reject) => {
                setTimeout(() => {
                    var url = consul_url+":8200/v1/secret/services/wproject/domains/wsuite.com/clients/"+client_id+"/conf/db/password";
                    // Setting URL and headers for request
                    var options = {
                        url: url,
                        headers: {
                            'X-Vault-Token': vault_token
                        }                        
                    };
                    // Do async job
                    request.get(options, function(err, resp, body) {
                        if (err) {
                            reject(err);
                        } else {
                            var body = JSON.parse(body);
                            dbConfigArr['password'] =  body.data.value;                            
                            resolve(dbConfigArr);
                        }
                    })
                }, 2000)
            })

            var printResult = (results) => {
                msg.payload = dbConfigArr;
                //console.log(msg.payload);               
                node.send(msg);
            }

            function main() {
                // See the order of promises. Final result will be according to it
                Promise.all([promiseHost, promiseDbname, promiseUsername, promisePassword]).then(printResult);
            }

            main();
        });
    }
    
    RED.nodes.registerType("db-config",DbConfigNode);
}