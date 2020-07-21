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
        string ethaddress;
        string primary_key()const { return redditname; }
    };
    typedef dapp::multi_index<"redditusers"_n, redditusers> redditusers_t;

    TABLE subreddits {
        string subname; //e.g. "/r/ethereum"
        string iconbsf; //base64 icon or icon URL?
        asset tokendef; //symbol, total supply
        string primary_key()const { return subname; }
    };
    typedef dapp::multi_index<"subreddits"_n, subreddits> subreddits_t;

    TABLE subsuser{
        string redditname;
        string subname;
        bool autosub; //auto-burn tokens for subscription?
        uint32_t regtime; //uint32_t eosio::time_point::sec_since_epoch() const - time user registered
        uint32_t lastsub; //last time user paid for subscription, 30+ days = burn tokens if auto is on
        asset balance; //current balance of this subreddit's token for the user
        asset totalbalance; //total balance the user has ever owned
        asset holdbalance; //temp balance when user is withdrawing, but not yet hit ETH commit
        string primary_key()const {return redditname; }
    };
    typedef dapp::multi_index<"subsuser"_n, subsuser> subsuser_t;

    TABLE subscomm{ //used to get all users subbed to a community - subsuser holds balances etc.
        string subname;
        string redditname;
        string primary_key()const {return subname; }
    };
    typedef dapp::multi_index<"subscomm"_n, subscomm> subscomm_t;

    struct ethqueue{
        string reddituser;
        string ethaddress;
        string subname;
        asset amount;
        EOSLIB_SERIALIZE(ethqueue, (reddituser)(ethaddress)(subname)(amount));
    };

    TABLE queuetokens{
        uint64_t queuenum;
        string ipfshead;
        uint32_t starttime; //when did this queue begin? EndTime = starttime + 10min
        std::vector<ethqueue> currentqueue; //list of all ETH transactions to execute
        uint64_t primary_key()const {return queuenum; }
    };
    typedef dapp::multi_index<"queuetokens"_n, queuetokens> queuetokens_t;

    // std::string string_to_hex(std::string tohexa){
    //     std::ostringstream result;
    //     result << std::setw(2) << std::setfill('0') << std::hex << std::uppercase;
    //     std::copy(tohexa.begin(), tohexa.end(), std::ostream_iterator<unsigned int>(result, " "));
    //     std::cout << tohexa << ":" << result.str() << std::endl;
    //     return result.str();
    // }

    [[eosio::action]] void usetokeosio(string updatestring){
        require_auth(_self);//ETH signing?
        stats_def statstable(_self, _self.value);
        stats newstats;
        if(!statstable.exists()){
          statstable.set(newstats, _self);
        }
        else{
          newstats = statstable.get();
        }
        newstats.teststring = updatestring;
        statstable.set(newstats, _self);
        return;
    }

    void updatestats(string updatestring){
        stats_def statstable(_self, _self.value);
        stats newstats;
        if(!statstable.exists()){
          statstable.set(newstats, _self);
        }
        else{
          newstats = statstable.get();
        }
        newstats.anotherstring = updatestring;
        statstable.set(newstats, _self);
        return;
    }

    void updatestaters(string updatestring, string anotherstring){
        stats_def statstable(_self, _self.value);
        stats newstats;
        if(!statstable.exists()){
          statstable.set(newstats, _self);
        }
        else{
          newstats = statstable.get();
        }
        newstats.teststring = updatestring;
        newstats.anotherstring = anotherstring;
        statstable.set(newstats, _self);
        return;
    }

    [[eosio::action]] void testget(std::vector<char>  uri, std::vector<char> expectedfield) {
    /* USE EOSIO'S ASSERTION TO CHECK FOR REQUIRED THREHSHOLD OF ORACLES IS MET */
        require_auth(_self);
        eosio::check(getURI(uri, [&]( auto& results ) { 
            eosio::check(results.size() > 0, "require multiple results for consensus");
            auto itr = results.begin();
            auto first = itr->result;
            ++itr;
            /* SET CONSENSUS LOGIC FOR RESULTS */
            while(itr != results.end()) {
                eosio::check(itr->result == first, "consensus failed");
                ++itr;
            }
            return first;
        }) == expectedfield, "wrong data");
    }
    
    struct testuri{
        std::vector<char> uri;
        EOSLIB_SERIALIZE(testuri, (uri));
    };

    [[eosio::action]] void testrnd(std::vector<char> uri) {
        require_auth(_self);
        getURI(uri, [&]( auto& results ) { 
        return results[0].result;
        });
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
    EOSIO_DISPATCH_SVC(CONTRACT_NAME(),(usetokeosio))