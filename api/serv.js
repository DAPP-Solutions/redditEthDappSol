
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
const acctname = 'eosname';
const prodname = 'keytobe';
const pgconnstring = 'pgconnstring';
const kylinid = '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191';
//pvvkey = jcvkey;
const server = http.createServer((req, res) => {
    //console.log(req);
    res.statusCode = 200;
   
    var urlheaders = [];
    if (req.url.indexOf("/") > -1) {
        urlheaders = req.url.split('/');
    
        
        if(urlheaders[1] == "test_page"){
            console.log("Set content type to html");
            res.setHeader("Content-Type", "text/html");  
        }else if(urlheaders[1] == "test_page_js"){
            console.log("Set content type to javascript");
            res.setHeader("Content-Type", "text/javascript");  
        }else{
            //console.log("Set content type to json");
            res.setHeader('Content-Type', 'application/json');
        }
    }
   
    console.log(urlheaders);
    if (urlheaders.length > 1) {
        if (urlheaders[1] != "") {
            if(urlheaders[1] == "test"){
                fs.readFile('./test.html', function (err, html) {
                    if (err) {
                       res.end("Error!");
                    }       
                    res.end(html);  
                });
            }
            else if(urlheaders[1] == "test.js"){
                fs.readFile('./test.js', function (err, html) {
                    if (err) {
                       res.end("Error!");
                    }       
                    res.end(html);  
                });
            }else if(urlheaders[1] == "eth_create"){
                var acct = createETHaddress();
                var result = {pubkey : acct.address, privatekey : acct.privateKey};
                res.end(JSON.stringify(result));
            }else if(urlheaders[1] == "eth_create_insert"){
                var acct = createETHaddress();
                var sql = 'insert into accounts (pubkey, privkey) values ($1, $2) return id, pubkey, privkey'
                var v = {};
                v.query = sql;
                v.vars = [acct.address, acct.privateKey]
                callSQL(v).then(function(e){
                    res.end(JSON.stringify(e));
                }).catch(function(e){
                    res.end(JSON.stringify(e));
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
            }else {
                res.end(urlheaders[1]);
		    }
	    }
	    else{
		    res.end('{"res" : "HOME"}');
	    }
	}
});

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
        const pool = new pg.Pool(pgconfig);
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