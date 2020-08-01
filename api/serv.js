const config = require('./keys.json');
const Eos = require('eosjs');
var pg = require("pg");
const http = require('http');
const fs = require('fs');
var Accounts = require('web3-eth-accounts');
// Passing in the eth or web3 package is necessary to allow retrieving chainId, gasPrice and nonce automatically
// for accounts.signTransaction().
var accounts = new Accounts('ws://localhost:8546');
//const hostname = '54.217.187.58';
const hostname = '0.0.0.0';
//const hostname = 'reddit.dappsolutions.app';
const port = 4300;
const { JsonRpc } = require('eosjs');
const fetch = require('node-fetch'); 

var nodeapi = 'https://api.kylin.alohaeos.com';
const acctname = config.eospubkey;
const acctpk = config.eosprivkey;
const kylinid = '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191';
//pvvkey = jcvkey;
var monthbatch = 0;

var comms = [
    { id: 0,
        subname : '/r/test1',
        cost : 5,
        symbol : "TONE",
        pubkey: "0xBb611636C6596B9E2E63AaE50B9c1E2991026a84",
        privkey: "0xcb61a598be835243a6372670feea4b3807bbcb2b53e5711018ff33cc0268fd46"},
    { id: 1,
        subname : '/r/test2',
        cost : 15,
        symbol : "TTWO",
        pubkey: "0x677D7Dfe5dc42856bC98FA34EE16Dcc0aA6eA1ad",
        privkey: "0x43b897bd12f1d833a9793fe84a53ff621cd900c861c86c4e8666b9eb90be66a0" },
    { id: 2,
        subname : '/r/test3',
        cost : 10,
        symbol : "TTHREE",
        pubkey: "0xC877EEAE7313C5E90148cdDa7c9500c6cC1bAa7d",
        privkey: "0x6bc4d24bc37aad89454370ee7aba3c9850d694800708f83a9383c7759b80b27e" },
    { id: 3,
        subname : '/r/test4',
        cost : 1,
        symbol : "TFOUR",
        pubkey: "0x4e520a4B67E1BE4cb222Be6334cFdC309bfdcEBA",
        privkey: "0xb5409b31eb52ee580c6991e1e366536a64dfdd5ff09902f8a3cb4226c4b987c6" },
    { id: 4,
        subname : '/r/test5',
        cost : 5,
        symbol : "TFIVE",
        pubkey: "0x8ED5f0bE4B5E6850db4110E5e5591a3c2f63ba69",
        privkey:  "0xb8b7ca202f18b60c1f917a8e8e6d65a82c71e812f64ae419f765c8d7623981b5"},
    { id: 5,
        subname : '/r/test6',
        cost : 5,
        symbol : "TSIX",
        pubkey: "0xBb611636C6596B9E2E63AaE50B9c1E2991026a84",
        privkey: "0xcb61a598be835243a6372670feea4b3807bbcb2b53e5711018ff33cc0268fd46" },
    { id: 6,
        subname : '/r/test7',
        cost : 5,
        symbol : "TSEV",
        pubkey: "0x677D7Dfe5dc42856bC98FA34EE16Dcc0aA6eA1ad",
        privkey: "0x43b897bd12f1d833a9793fe84a53ff621cd900c861c86c4e8666b9eb90be66a0" },
    { id: 7,
        subname : '/r/test8',
        cost : 5,
        symbol : "TEIGH",
        pubkey: "0xC877EEAE7313C5E90148cdDa7c9500c6cC1bAa7d",
        privkey: "0x6bc4d24bc37aad89454370ee7aba3c9850d694800708f83a9383c7759b80b27e" },
    { id: 8,
        subname : '/r/test9',
        cost : 5,
        symbol : "TNINE",
        pubkey: "0x4e520a4B67E1BE4cb222Be6334cFdC309bfdcEBA",
        privkey: "0xb5409b31eb52ee580c6991e1e366536a64dfdd5ff09902f8a3cb4226c4b987c6" },
    { id: 9,
        subname : '/r/test10',
        cost : 5,
        symbol : "TTEN",
        pubkey: "0x8ED5f0bE4B5E6850db4110E5e5591a3c2f63ba69",
        privkey: "0xb8b7ca202f18b60c1f917a8e8e6d65a82c71e812f64ae419f765c8d7623981b5" }
    ];
    
var userlistmem = [];
const server = http.createServer((req, res) => {
    //console.log(req);
    res.statusCode = 200;
    get_eth_list(99999).then(function(ee){
        userlistmem = ee;
    }).catch(function(ee){
        console.log(JSON.stringify(ee));
    });
    var urlheaders = [];
    if (req.url.indexOf("/") > -1) {
        urlheaders = req.url.split('/');
    
        
        if(urlheaders[1] == "test"){
            console.log("Set content type to html");
            res.setHeader("Content-Type", "text/html");  
        }else if(urlheaders[1] == "test_js"){
            console.log("Set content type to javascript");
            res.setHeader("Content-Type", "text/javascript");  
        }else if(urlheaders[1] == "test_css"){
            console.log("Set content type to javascript");
            res.setHeader("Content-Type", "text/css");  
        }else{
            //console.log("Set content type to json");
            res.setHeader('Content-Type', 'application/json');
        }
    }
   
    console.log(urlheaders);
    if (urlheaders.length > 1) {
        if (urlheaders[1] != "") {
        if(urlheaders[1] == "test"){
            fs.readFile('test.html', function (err, html) {
                if (err) {
                   res.end("Error!");
                }       
                res.end(html);  
            });
        }else if(urlheaders[1] == "test_js"){
            fs.readFile('./test.js', function (err, html) {
                if (err) {
                   res.end("Error!");
                }       
                res.end(html);  
            });
        }else if(urlheaders[1] == "test_css"){
            fs.readFile('./test.css', function (err, html) {
                if (err) {
                   res.end("Error!");
                }       
                res.end(html);  
            });
        }else if(urlheaders[1] == "eth_create"){
            var acct = createETHaddress();
            console.log("Should post number");
            console.log(0xBcc7B0B81a52685183aD4073FF15E1344f4f46DD);
            var result = {pubkey : acct.address, privatekey : acct.privateKey};
            res.end(JSON.stringify(result));
        }else if(urlheaders[1] == "eth_create_insert"){
            var body = "";
            req.on('data', function(data) {
                body += data.toString(); // convert data to string and append it to request body
            });
            
            req.on('end', function() {
                //var r = JSON.parse(body); // request is finished receiving data, parse it
                var r = {};
                console.log(body);
                console.log(r);
                var amt = 5;
                if(r.amount){
                    amt = r.amount;
                }
                for(var i = 0;i<amt;i++){
                    setTimeout(function(){
                        var acct = createETHaddress();
                        var sql = 'insert into accounts (pubkey, privkey, dateadded) values ($1, $2, now()) returning id, pubkey, privkey'
                        var v = {};
                        v.query = sql;
                        v.vars = [acct.address, acct.privateKey]
                        callSQL(v).then(function(e){
                            console.log(e);
                            //res.end(JSON.stringify(e));
                        }).catch(function(e){
                            console.log(e);
                            //res.end(JSON.stringify(e));
                        });
                       
                    }, i * 100);
                }
                res.end(JSON.stringify({result : "completed!"}));
            });
        }else if(urlheaders[1] == "eth_decrypt"){
                var result = {publickey : decryptETHaddress(urlheaders[2])};
                console.log("**Decrypt Result");
                console.log(result);

                res.end(JSON.stringify(result));
        }else if(urlheaders[1] == "full_eth_list"){
            get_eth_list(99999).then(function(ee){
                res.end(JSON.stringify(ee));
            }).catch(function(ee){
                res.end(JSON.stringify(ee));
            });
        }else if(urlheaders[1] == "get_by_pubkey"){
                var sql = 'select * from accounts where pubkey = $1'
                var v = {};
                v.query = sql;
                v.vars = [urlheaders[2]];
                callSQL(v).then(function(e){
                    res.end(JSON.stringify(e));
                }).catch(function(e){
                    res.end(JSON.stringify(e));
                });
        }else if(urlheaders[1] == "sim_subscriptions"){
                var body = "";
                req.on('data', function(data) {
                    body += data.toString(); // convert data to string and append it to request body
                });
                
                req.on('end', function() {
                    var r = JSON.parse(body); // request is finished receiving data, parse it
                    console.log(body);
                    console.log(r);
                    simulate_subscriptions(r.amount, r.rate);
                    console.log("Simulated " + r.cost + "subscriptions!")
                    res.end("Transfer completed from "+ r.from + " to " + r.to + "!");
                });
                
        }else if(urlheaders[1] == "sim_community_creation"){
                var body = "";
                req.on('data', function(data) {
                    body += data.toString(); // convert data to string and append it to request body
                });
                
                req.on('end', function() {
                    var r = JSON.parse(body); // request is finished receiving data, parse it
                    console.log(body);
                    console.log(r);
                    simulate_subscriptions(r.amount, r.cost, r.sub);
                    console.log("Simulated " + r.cost + "subscriptions!")
                    res.end("Transfer completed from "+ r.from + " to " + r.to + "!");
                });
            
        }else if(urlheaders[1] == "sim_transfer"){
            var body = "";
            req.on('data', function(data) {
                body += data.toString(); // convert data to string and append it to request body
            });
            
            req.on('end', function() {
                var r = JSON.parse(body); // request is finished receiving data, parse it
                console.log(body);
                console.log(r);
                simulate_transfer(r.from, r.to, r.sub, r.amount)
                res.end("Transfer completed from "+ r.from + " to " + r.to + "!");
            });
        }else if(urlheaders[1] == "get_subscription_info"){
            var body = "";
            req.on('data', function(data) {
                body += data.toString(); // convert data to string and append it to request body
            });
            
            req.on('end', function() {
                var r = JSON.parse(body); // request is finished receiving data, parse it
                console.log(body);
                console.log(r);
                simulate_transfer(r.from, r.to, r.sub, r.amount)
                res.end("Transfer completed from "+ r.from + " to " + r.to + "!");
            });
        }else if(urlheaders[1] == "simulate_monthly_distribution"){
            var body = "";
            req.on('data', function(data) {
                body += data.toString(); // convert data to string and append it to request body
            });
            
            req.on('end', function() {
                var r = JSON.parse(body); // request is finished receiving data, parse it
                console.log(body);
                console.log(r);
                simulate_transfer(r.from, r.to, r.sub, r.amount)
                res.end("Transfer completed from "+ r.from + " to " + r.to + "!");
            });
        }else if(urlheaders[1] == "simulate_monthly_karma"){
            // var body = "";
            // req.on('data', function(data) {
            //     body += data.toString(); // convert data to string and append it to request body
            // });
            
            // req.on('end', function() {
            //     var r = JSON.parse(body); // request is finished receiving data, parse it
            //     console.log(body);
            //     console.log(r);

                simulate_karma_distribution(parseInt(urlheaders[2])).then(function(ee){
                    //set up to allow just one set of karma/point balances per subreddit/user combo to simplify that aspect of the system. 
                    //Running multiple rounds will randomly pick a group and user, then give them between 0 and 100 karma to the user, by setting number of rounds to 1000,
                    //it creates the posted such post or karma updates if the same user is selected multiple times.
                    res.end("Karma/Reddit posts seeded!");
                }).catch(function(ee){
                    res.end("Errpr :" + JSON.stringify(ee));
                });
               
            // });
	    }else{
		    res.end('{"res" : "HOME"}');
	    }
    }
}
});

function get_eth_account(id){
    for(var i = 0;i<userlistmem.length;i++){
        if(userlistmem[i].id == id || userlistmem[i].account == id || userlistmem[i].pubkey == id){
            return userlistmem[i];
        }
    }
    return ["Nothing found"];
}

async function get_eth_list(limit){
    return new Promise(function(resolve, reject){
        var sql = 'select * from accounts where id <= $1'
        var v = {};
        v.query = sql;
        v.vars = [limit];
        callSQL(v).then(function(e){
            resolve(e);
        }).catch(function(e){
            resolve(e);
        });
    });
}

async function simulate_karma_distribution(rounds){
    return new Promise(function(resolve, reject){
        
        var karma = getRandomInt(100);
        
        for(var i = 0;i < rounds;i++){
            setTimeout(function(){
                var user = get_eth_account(getRandomInt(5001));
                var comid = getRandomInt(10);
                console.log(comid);
                var sub = comms[comid];
                console.log(sub);
                var updquery = `UPDATE subscriptions SET karma = karma + $1 WHERE id= $2`;
                var insquery = `INSERT INTO subscriptions (accounteth, subname, account,  karma, balance, datejoined)
                SELECT $1, $2, $3, $4, 0, NOW()
                WHERE NOT EXISTS (SELECT 1 FROM subscriptions WHERE id= $5) returning id, account`;
                var insarr = [user.pubkey, sub.subname, user.account, karma, user.id];
                var updarr = [karma, user.id];
                var updpass = {vars : updarr, query : updquery}
                var inspass = {vars : insarr, query : insquery};
                callSQL(updpass).then(function(ee){
                    console.log(JSON.stringify(ee));
                    callSQL(inspass).then(function(ee){
                        console.log(JSON.stringify(ee));
                        resolve(ee);
                    }).then(function(ee){
                        reject(ee);
                    });
                }).then(function(ee){
                    reject(ee);
                });
            }, 150 * i);
        }
    });
}

// async function simulate_reddit_posts(redditaccount, subname, acmount, karma){
//     return new Promise(function(resolve, reject){
//         var query = "insert into redditposts (redditaccount, subname, amount, karma, dateadded) values ($1, $2, $3, $4, NOW()) returning id, redditaccount, subname";
//         var vararr = [redditaccount, subname, acmount, karma];
//         var pass = {vars : vararr, query : query}
//         callSQL(pass).then(function(ee){
//             resolve(ee);
//         }).then(function(ee){
//             reject(ee);
//         });
//     });
// }

//add subscription EOSIO logic in here

function simulate_subscriptions(subamount, subrate){
    var i = 0;
    var returntext = "";
    setInterval(function(){
        if(i > subamount){
            return returntext;
        }else{
            //pick a random sub
            var s = comms[getRandomInt(5)];
            get_reddit_account(getRandomInt(5001)).then(function(ee){
                //Now call eosjs to burn tokens for user to subscribe to a community
                var res = 'Create subscription for ' + s.subname  +': ' + i.toString() + ", for " + s.cost + ' for ETH address: ' + ee[0].publickey;
                console.log(res);
                returntext += "\r\n" + res; 
                i++;
                return returntext;
            }).catch(function(ee){
                returntext = ee;
                return returntext;
            });
            
        }
    }, subrate)
}

function get_reddit_account(id){
    callSQL("select * from accounts where id = $1 or pubkey = $2 or account = $3", [id, id, id]).then(function(ee){
        resolve(ee);
    }).catch(function(ee){
        resolve(ee);
    })
}

//EOSIO transfer funds
function simulate_transfer(from, to, sub, amount){
    console.log("Simulating Transfer from " + from + " to " + to + " for sub " + sub + ", for " + amount + " community points.");
}

function decryptETHaddress(pk){
    var pubkey = accounts.privateKeyToAccount(pk);
    return pubkey;
}

function createETHaddress(){
    var account = accounts.create();
    return account;
}

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

async function callSQL(v){
    return new Promise(function(resolve, reject){
        const pool = new pg.Pool(config.pgconfig);
        var vararr = v.vars;
        var query = v.query;
        var res = {};
       
        pool.query(query, vararr,  (err, res) => {
          if(err){
            console.log(err);
            reject(["Error in SQL, see console", "Error", "Error", "Error"]);
          }
          var rows = res.rows;
          var resreal = [];
          var rows = res.rows;
          for(var ii = 0;ii < res.rows.length;ii++){
            var therow = rows[ii];
            resreal.push(therow);
          }
          pool.end();
          resolve(resreal);
        });
    })
  }

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function fixPercentages(num){
    var ret = {};
    ret.mods = num * 0.2;
    ret.reddit = num * 0.1;
}