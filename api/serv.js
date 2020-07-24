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
const hostname = '127.0.0.1';
//const hostname = 'reddit.dappsolutions.app';
const port = 80;
const { JsonRpc } = require('eosjs');
const fetch = require('node-fetch'); 

var nodeapi = 'https://api.kylin.alohaeos.com';
const acctname = config.eospubkey;
const acctpk = config.eosprivkey;
const kylinid = '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191';
//pvvkey = jcvkey;
var monthbatch = 0;

var comms =[
    { id: 0,
        subname : '/r/test1',
        cost : 5,
        symbol : "TONE",
        pubkey: '0x38Ae2C27E9d9d1C4Ea53aFCBc88F5AD3b331ffBc',
        privkey: '0x9fe9e108a1db7a00e5c56858a2c6ffe99b5b0a0f7e9140fba53cfed5b8375f64' },
    { id: 1,
        subname : '/r/test2',
        cost : 15,
        symbol : "TTWO",
        pubkey: '0x279d011aFfa2816a8dF20bdA680b2b4d8F635060',
        privkey: '0xee2014c625f6218cc29aa97636152da0532d55238ac38198edf2de9e1afb6f23' },
    { id: 2,
        subname : '/r/test3',
        cost : 10,
        symbol : "TTHREE",
        pubkey: '0xC91499a9389CC8f124d07b488809A198E4cd1bDb',
        privkey: '0x23e8c8874a4955525cca2e8c3dbc2df6b3f76063feb26f52b3806d51e3df08ee' },
    { id: 3,
        subname : '/r/test4',
        cost : 1,
        symbol : "TFOUR",
        pubkey: '0x556Ffe26E7a4c8BD2Bd4C627DB3B17E9Eb5C1dCA',
        privkey: '0x3696247d03e55624f389643b4bfa1b853dc4a1a2dcdc1dc3b6cad6c060410a37' },
    { id: 4,
        subname : '/r/test5',
        cost : 5,
        symbol : "TFIVE",
        pubkey: '0x24CAcF4F33F2c11670F343Cbcb9dD93c01892A47',
        privkey: '0x9c14f1f55a6e80bf01c85182ff25a88f9926e2d11b30686b156803f80aab053f' }
    ];

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
}
});

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
            callSQL("select * from accounts where id = $1", [getRandomInt(5001)]).then(function(u){

                var res = 'Create subscription for ' + s.subname  +': ' + i.toString() + ", for " + s.cost + ' for ETH address: ' + u[0].publickey;
                console.log(res);
                returntext += "\r\n" + res; 
                i++;
            }).catch(function(e){
                returntext = e;
                return returntext;
            });
            
        }
    }, subrate)

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