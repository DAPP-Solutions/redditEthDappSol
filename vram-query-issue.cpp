#define USE_ADVANCED_IPFS

#include "../dappservices/multi_index.hpp"
#include "../dappservices/oracle.hpp"
#include "../dappservices/vaccounts.hpp"
#include "../dappservices/ipfs.hpp"
#include "../dappservices/cron.hpp"
#include <eosio/crypto.hpp>
#include <algorithm>
#include <sstream>
#include <iterator>
#include <iomanip>

#define DAPPSERVICES_ACTIONS()  \
  XSIGNAL_DAPPSERVICE_ACTION    \
  IPFS_DAPPSERVICE_ACTIONS      \
  CRON_DAPPSERVICE_ACTIONS \
  ORACLE_DAPPSERVICE_ACTIONS
#define DAPPSERVICE_ACTIONS_COMMANDS() \
  IPFS_SVC_COMMANDS()                  \
  ORACLE_SVC_COMMANDS()                \
  CRON_SVC_COMMANDS()

#define CONTRACT_NAME() reddit
using std::string;
CONTRACT_START()

TABLE subscomm //used to get all users subbed to a community - subuser holds balances etc.
 {
  string subname;
  string redditname;
  string ethaddress;
  checksum256 ethcs;
  checksum256 primary_key() const { return ethcs; }
 };

struct ethqueue
{
  string redditname;
  string ethaddress;
  string subname;
  asset amount;
  EOSLIB_SERIALIZE(ethqueue, (redditname)(ethaddress)(subname)(amount));
};

TABLE queuetokens
{
  uint64_t queuenum;
  string ipfshead;
  uint32_t starttime;                 //when did this queue begin? EndTime = starttime + 10min
  std::vector<ethqueue> currentqueue; //list of all ETH transactions to execute
  uint64_t primary_key() const { return queuenum; }
};

TABLE subuser
{
  checksum256 ethcs;
  string ethaddress;
  string redditname;
  string subname;
  bool autosub;       //auto-burn tokens for subscription?
  uint32_t regtime;   //uint32_t eosio::time_point::sec_since_epoch() const - time user registered
  uint32_t lastsub;   //last time user paid for subscription, 30+ days = burn tokens if auto is on
  asset balance;      //current balance of this subreddit's token for the user
  asset totalbalance; //total balance the user has ever owned
  asset holdbalance;  //temp balance when user is withdrawing, but not yet hit ETH commit
  checksum256 primary_key() const { return ethcs; }
};


TABLE subreddits
{
  checksum256 ethcs;
  string ethadd;
  string subname;   //e.g. "/r/ethereum"
  uint64_t subhex;  //hex version of community name for indexing
  uint64_t subcost; //cost of subscribing per month
  string configurl; //url to call for client-side variables with oracles if needed
  asset tokendef;   //symbol, total supply
  checksum256 primary_key() const { return ethcs; }
};


TABLE redditusers
{
  checksum256 ethcs;
  string redditname; //e.g. "/u/username"
  string ethaddress; //create if not exists
  checksum256 primary_key() const { return ethcs; }
};


TABLE lookup
{
  checksum256 uname;
  string ethaddress;
  checksum256 primary_key() const { return uname; }
};


TABLE subs_shardbucket
{
  std::vector<char> shard_uri;
  uint64_t shard;
  uint64_t primary_key() const { return shard; }
};

typedef dapp::advanced_multi_index<"subscomm"_n, subscomm, checksum256> subscomm_t;
typedef eosio::multi_index<"subscomm"_n, subs_shardbucket> subscomm_t_abi;
typedef eosio::multi_index<".subscomm"_n, subscomm> subscomm_t_v_abi;

TABLE qtok_shardbucket
{
  std::vector<char> shard_uri;
  uint64_t shard;
  uint64_t primary_key() const { return shard; }
};

typedef dapp::multi_index<"queuetokens"_n, queuetokens> queuetokens_t;
typedef eosio::multi_index<"queuetokens"_n, qtok_shardbucket> queuetokens_t_abi;
typedef eosio::multi_index<".queuetokens"_n, queuetokens> queuetokens_t_v_abi;


TABLE sub_shardbucket
{
  std::vector<char> shard_uri;
  uint64_t shard;
  uint64_t primary_key() const { return shard; }
};

typedef dapp::advanced_multi_index<"subuser"_n, subuser, checksum256> subuser_t;
typedef eosio::multi_index<"subuser"_n, sub_shardbucket> subuser_t_abi;
typedef eosio::multi_index<".subuser"_n, subuser> subuser_t_v_abi;

TABLE redd_shardbucket
{
  std::vector<char> shard_uri;
  uint64_t shard;
  uint64_t primary_key() const { return shard; }
};

typedef dapp::advanced_multi_index<"subreddits"_n, subreddits, checksum256> subreddits_t;
typedef eosio::multi_index<"subreddits"_n, redd_shardbucket> subreddits_t_abi;
typedef eosio::multi_index<".subreddits"_n, subreddits> subreddits_t_v_abi;

TABLE user_shardbucket
{
  std::vector<char> shard_uri;
  uint64_t shard;
  uint64_t primary_key() const { return shard; }
};

typedef dapp::advanced_multi_index<"redditusers"_n, redditusers, checksum256> redditusers_t;
typedef eosio::multi_index<"redditusers"_n, user_shardbucket> redditusers_t_abi;
typedef eosio::multi_index<".redditusers"_n, redditusers> redditusers_t_v_abi;


TABLE look_shardbucket
{
  std::vector<char> shard_uri;
  uint64_t shard;
  uint64_t primary_key() const { return shard; }
};

typedef dapp::advanced_multi_index<"lookup"_n, lookup, checksum256> lookup_t;
typedef eosio::multi_index<"lookup"_n, look_shardbucket> lookup_t_abi;
typedef eosio::multi_index<".lookup"_n, lookup> lookup_t_v_abi;

bool timer_callback(name timer, std::vector<char> payload, uint32_t seconds){
        auto reschedule = false;
       
        return reschedule;
        // reschedule

      }

[[eosio::action]] void createuser(string name, string ethaddress)
{
  require_auth(_self);
  redditusers_t redusers(_self, _self.value);
  lookup_t lookref(_self, _self.value);
  checksum256 csname;
  checksum256 sum;
  sum = to_key(ethaddress);
  csname = to_key(name);
  auto doesexist = redusers.find(sum);
  auto doeslinkexist = lookref.find(csname);
  eosio::check(doesexist == redusers.end(), "User Already Exists");
  eosio::check(doeslinkexist == lookref.end(), "User Lookup Already Exists");
  redusers.emplace(_self, [&](auto &a) {
    a.ethcs = sum;
    a.redditname = name;
    a.ethaddress = ethaddress;
  });
  lookref.emplace(_self, [&](auto &a) {
    a.uname = csname;
    a.ethaddress = ethaddress;
  });
}

[[eosio::action]] void spendtokens(string user, string sub, int64_t amount)
{
  require_auth(_self);
  subuser_t subusers(_self, _self.value);
  subreddits_t subreddits(_self, _self.value);

  checksum256 userkey;
  userkey = to_key(user);

  auto fromuser = subusers.find(userkey);
  eosio::check(fromuser != subusers.end(), "No User Found");

  subusers.modify(fromuser, eosio::same_payer, [&](auto &a) {
    a.balance.amount -= amount;
  });

  checksum256 subkey;
  subkey = to_key(sub);

  auto subreddit = subreddits.find(userkey);
  eosio::check(subreddit != subreddits.end(), "No Subreddit Found");

  subreddits.modify(subreddit, eosio::same_payer, [&](auto &a) {
    a.tokendef.amount -= amount;
  });

}

[[eosio::action]] void sendtoken(string from, string to, string sub, asset amount)
{
  require_auth(_self);
  //ETH signing?
  subuser_t subusers(_self, _self.value);

  checksum256 fromuserkey;
  fromuserkey = to_key(from);

  auto fromuser = subusers.find(fromuserkey);
  eosio::check(fromuser != subusers.end(), "No User Found");

  subusers.modify(fromuser, eosio::same_payer, [&](auto &a) {
    a.balance -= amount;
  });

  checksum256 touserkey;
  touserkey = to_key(to);
  auto touser = subusers.find(touserkey);

  if (touser == subusers.end())
  {
    eosio::asset nohold = eosio::asset(0, amount.symbol);
    subusers.emplace(_self, [&](auto &a) {
      a.balance = amount;
      a.subname = sub;
      a.redditname = to;
      a.ethaddress = ""; //generation method?
      a.autosub = false;
      a.regtime = current_time_point().sec_since_epoch();
      a.lastsub = current_time_point().sec_since_epoch() - 1;
      a.totalbalance = amount;
      a.holdbalance = nohold;
    });
  }
  else
  {
    subusers.modify(touser, eosio::same_payer, [&](auto &a) {
      a.balance += amount;
    });
  }
}

static eosio::checksum256 to_key(string pkeystring)
{
  checksum256 pkeyadd;
  pkeyadd = sha256(const_cast<char *>(pkeystring.c_str()), pkeystring.size());
  const uint64_t *ui64 = reinterpret_cast<const uint64_t *>(&pkeyadd);
  return eosio::checksum256::make_from_word_sequence<uint64_t>(ui64[0], ui64[1], ui64[2], ui64[3]);
}


CONTRACT_END((createuser)(spendtokens)(sendtoken))