const config = require('./keys.json');
const Eos = require('eosjs');
var pg = require("pg");
const http = require('http');
const fs = require('fs');
var Accounts = require('web3-eth-accounts');
// Passing in the eth or web3 package is necessary to allow retrieving chainId, gasPrice and nonce automatically
// for accounts.signTransaction().
var accounts = new Accounts('ws://localhost:8546');
const hostname = '0.0.0.0';
const port = 4300;
const { JsonRpc } = require('eosjs');
const fetch = require('node-fetch'); 

var nodeapi = 'https://api.kylin.alohaeos.com';
const acctname = config.eospubkey;
const acctpk = config.eosprivkey;
const kylinid = '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191';
//pvvkey = jcvkey;
var monthbatch = 0;
var comms = ['/r/test1', '/r/test2', '/r/test3', '/r/test4', '/r/test5'];

const server = http.createServer((req, res) => {
    //console.log(req);
    res.statusCode = 200;
   
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
            }
            else if(urlheaders[1] == "test_js"){
                fs.readFile('./test.js', function (err, html) {
                    if (err) {
                       res.end("Error!");
                    }       
                    res.end(html);  
                });
            } else if(urlheaders[1] == "test_css"){
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
                    var amt = 2154;
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
                res.end(JSON.stringify(result));
            }else if(urlheaders[1] == "full_eth_list"){
                var sql = 'select * from accounts'
                var v = {};
                v.query = sql;
                v.vars = []
                callSQL(v).then(function(e){
                    res.end(JSON.stringify(e));
                }).catch(function(e){
                    res.end(JSON.stringify(e));
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
                    simulate_subscriptions(r.amount, r.cost, r.sub);
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
            }else {
                res.end(urlheaders[1]);
            }
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
	    }else{
		    res.end('{"res" : "HOME"}');
	    }
	}
});

//add subscription EOSIO logic in here
function simulate_subscriptions(usereth, subamount, cost, subname){
    var i = 0;
    setInterval(function(){
        if(i > subamount){
            break;
        }else{
            console.log('Create subscription for ' + subname  +': ' + i.toString() + ", for " + cost + 'from ETH address:' + usereth)
        }
    }, 250)
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

// (name user,  eosto, eosfrom,  from, 
// 	 frommemo,  platform,  
// 	 symbol,  amount, memo,  prevtxid) 

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