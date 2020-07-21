#include "../dappservices/multi_index.hpp"
#include "../dappservices/log.hpp"
#include "../dappservices/oracle.hpp"
#include "../dappservices/cron.hpp"
#include "../dappservices/vaccounts.hpp"
#include "../dappservices/readfn.hpp"
#include "../dappservices/vcpu.hpp"
#include "../dappservices/multi_index.hpp"
#include <algorithm>
#include <sstream>
#include <iterator>
#include <iomanip>
#define DAPPSERVICES_ACTIONS() \
  XSIGNAL_DAPPSERVICE_ACTION \
  IPFS_DAPPSERVICE_ACTIONS \
  VACCOUNTS_DAPPSERVICE_ACTIONS \
  LOG_DAPPSERVICE_ACTIONS \
  CRON_DAPPSERVICE_ACTIONS \
  ORACLE_DAPPSERVICE_ACTIONS \
  VCPU_DAPPSERVICE_ACTIONS \
  READFN_DAPPSERVICE_ACTIONS
#define DAPPSERVICE_ACTIONS_COMMANDS() \
  IPFS_SVC_COMMANDS()ORACLE_SVC_COMMANDS()CRON_SVC_COMMANDS()VACCOUNTS_SVC_COMMANDS()LOG_SVC_COMMANDS()READFN_SVC_COMMANDS()VCPU_SVC_COMMANDS()
#define CONTRACT_NAME() redditdapp
using std::string;
CONTRACT_START()

   bool timer_callback(name timer, std::vector<char> payload, uint32_t seconds){
        return false;
    }

    TABLE stats {
        string   teststring = "";
        string anotherstring = "";
    };

    typedef eosio::singleton<"stats"_n, stats> stats_def;

    TABLE redditusers {
        string redditname; //e.g. "/u/username"
        string ethaddress; //create if not exists
        string primary_key()const { return ethaddress; }
    };
    typedef dapp::multi_index<"redditusers"_n, redditusers> redditusers_t;

    TABLE subscomm{ //used to get all users subbed to a community - subsuser holds balances etc.
        string subname;
        string redditname;
        string ethaddress;
        string primary_key()const {return subname; }
    };
    typedef dapp::multi_index<"subscomm"_n, subscomm> subscomm_t;

    struct ethqueue{
        string redditname;
        string ethaddress;
        string subname;
        asset amount;
        EOSLIB_SERIALIZE(ethqueue, (redditname)(ethaddress)(subname)(amount));
    };

    TABLE queuetokens{
        uint64_t queuenum;
        string ipfshead;
        uint32_t starttime; //when did this queue begin? EndTime = starttime + 10min
        std::vector<ethqueue> currentqueue; //list of all ETH transactions to execute
        uint64_t primary_key()const {return queuenum; }
    };
    typedef dapp::multi_index<"queuetokens"_n, queuetokens> queuetokens_t;

    TABLE subsuser{
        string redditname;
        string subname;
        string ethaddress;
        bool autosub; //auto-burn tokens for subscription?
        uint32_t regtime; //uint32_t eosio::time_point::sec_since_epoch() const - time user registered
        uint32_t lastsub; //last time user paid for subscription, 30+ days = burn tokens if auto is on
        asset balance; //current balance of this subreddit's token for the user
        asset totalbalance; //total balance the user has ever owned
        asset holdbalance; //temp balance when user is withdrawing, but not yet hit ETH commit
        string primary_key()const {return ethaddress; }
    };
    typedef dapp::multi_index<"subsuser"_n, subsuser> subsuser_t;

    TABLE subreddits {
        string subname; //e.g. "/r/ethereum"
        string configurl; //url to call for client-side variables with oracles if needed
        asset tokendef; //symbol, total supply
        string primary_key()const { return subname; }
    };
    typedef dapp::multi_index<"subreddits"_n, subreddits> subreddits_t;

    [[eosio::action]] void burntokens(string user, string sub, int64_t amount){
        require_auth(_self);
        subsuser_t subsusers(_self, _self.value);
        auto fromuser = subsusers.find(from);
        if( fromuser == subusers.end()){
            eosio::check(false,"No User Found");
        }else{
            for ( auto itr = fromuser.begin(); itr != fromuser.end(); itr++ ) {
                if(itr-> subname == sub){
                    subsusers.modify( *fromuser, eosio::same_payer, [&]( auto& a ) {
                        a.balance -= amount;
                    });
                }
            }
        }
    }

    [[eosio::action]] void sendtoken(string from, string to, string sub, asset amount){
        require_auth(_self);
        //ETH signing?
        subsuser_t subsusers(_self, _self.value);
        auto fromuser = subsusers.find(from);
        if( fromuser == subusers.end()){
            eosio::check(false,"No User Found");
        }else{
            for ( auto itr = fromuser.begin(); itr != fromuser.end(); itr++ ) {
                if(itr-> subname == sub){
                    subsusers.modify( *fromuser, eosio::same_payer, [&]( auto& a ) {
                        a.balance -= value;
                    });
                }
            }
        }
        auto touser = subusers.find(to);
        if( touser == subusers.end()){
            eosio::asset nohold = eosio::asset::asset(0, amount.symbol);
            subsusers.emplace(_self, [&]( auto& a ){
                a.balance = amount;
                a.subname = sub;
                a.redditname = to;
                a.ethaddress = ""; //generation method?
                a.autosub = false;
                a.regtime = eosio::time_point::sec_since_epoch();
                a.lastsub = eosio::time_point::sec_since_epoch() - 1;
                a.totalbalance = amount;
                a.holdbalance = nohold;
            });
        }else{
             for ( auto itr = fromuser.begin(); itr != fromuser.end(); itr++ ) {
                if(itr-> subname == sub){
                    subsusers.modify( *fromuser, eosio::same_payer, [&]( auto& a ) {
                        a.balance += value;
                    });
                }
            }
        }
    }

    [[eosio::action]] void addcommunity(string subname, string symbol, string url){
        require_auth(_self);
        subreddits_t comms(_self, _self.value);
        auto doesexist = comms.find(from);
        if( fromuser == subusers.end()){
            eosio::asset tokendef = eosio::asset::asset(0, symbol);
            comms.emplace(_self, [&]( auto& a ){
                a.subname = subname;
                a.configurl = url;
                a.tokendef = tokendef;
            });
        }else{
           eosio::check(false,"Community Already Exists");
        }
    }

    void add_cold_balance( name owner, extended_asset value){
            cold_accounts_t to_acnts( _self, owner.value );
            auto to = to_acnts.find( value.contract.value );
            if( to == to_acnts.end() ) {
                to_acnts.emplace(_self, [&]( auto& a ){
                    a.balance = value;
                });
            } else {
                to_acnts.modify( *to, eosio::same_payer, [&]( auto& a ) {
                    a.balance += value;
                });
           }
     }

    TABLE account {
        extended_asset balance;
        uint64_t primary_key()const { return balance.contract.value; }
    };

    typedef dapp::multi_index<"vaccounts"_n, account> cold_accounts_t;
    typedef eosio::multi_index<".vaccounts"_n, account> cold_accounts_t_v_abi;
    TABLE shardbucket {
        std::vector<char> shard_uri;
        uint64_t shard;
        uint64_t primary_key() const { return shard; }
    };
    typedef eosio::multi_index<"vaccounts"_n, shardbucket> cold_accounts_t_abi;

    string to_hex( const char* d, uint32_t s ) 
    {
        string r;
        const char* to_hex="0123456789abcdef";
        uint8_t* c = (uint8_t*)d;
        for( uint32_t i = 0; i < s; ++i )
            (r += to_hex[(c[i]>>4)]) += to_hex[(c[i] &0x0f)];
        return r;
    }

    VACCOUNTS_APPLY()
    };
    EOSIO_DISPATCH_SVC(CONTRACT_NAME(),(sendtoken)(addcommunity)(burntokens))