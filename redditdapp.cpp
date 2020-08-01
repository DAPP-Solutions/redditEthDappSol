#define USE_ADVANCED_IPFS

#include "../dappservices/multi_index.hpp"
#include "../dappservices/oracle.hpp"
#include "../dappservices/vaccounts.hpp"
#include "../dappservices/ipfs.hpp"
#include <eosio/crypto.hpp>
#include <algorithm>
#include <sstream>
#include <iterator>
#include <iomanip>

#define DAPPSERVICES_ACTIONS()  \
  XSIGNAL_DAPPSERVICE_ACTION    \
  IPFS_DAPPSERVICE_ACTIONS      \
  ORACLE_DAPPSERVICE_ACTIONS
#define DAPPSERVICE_ACTIONS_COMMANDS() \
  IPFS_SVC_COMMANDS()                  \
  ORACLE_SVC_COMMANDS()                

#define CONTRACT_NAME() redditdapp
using std::string;
CONTRACT_START()

TABLE subscomm
{ //used to get all users subbed to a community - subsuser holds balances etc.
  string subname;
  string redditname;
  string ethaddress;
  checksum256 ethcs;
  checksum256 primary_key() const { return ethcs; }
};
typedef dapp::advanced_multi_index<"subscomm"_n, subscomm, checksum256> subscomm_t;
typedef eosio::multi_index<".subscomm"_n, subscomm> subscomm_t_v_abi;

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
typedef dapp::multi_index<"queuetokens"_n, queuetokens> queuetokens_t;
typedef eosio::multi_index<".queuetokens"_n, queuetokens> queuetokens_t_v_abi;

TABLE subsuser
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

typedef dapp::advanced_multi_index<"subsuser"_n, subsuser, checksum256> subsuser_t;
typedef eosio::multi_index<".subsuser"_n, subsuser> subsuser_t_v_abi;

TABLE subreddits
{
  checksum256 ethcs;
  string ethadd;
  string subname;   //e.g. "/r/ethereum"
  uint64_t subhex;  //hex version of community name for indexing
  string configurl; //url to call for client-side variables with oracles if needed
  asset tokendef;   //symbol, total supply
  checksum256 primary_key() const { return ethcs; }
};

typedef dapp::advanced_multi_index<"subreddits"_n, subreddits, checksum256> subreddits_t;
typedef eosio::multi_index<".subreddits"_n, subreddits> subreddits_t_v_abi;

TABLE redditusers
{
  checksum256 ethcs;
  string redditname; //e.g. "/u/username"
  string ethaddress; //create if not exists
  checksum256 primary_key() const { return ethcs; }
};

typedef dapp::advanced_multi_index<"redditusers"_n, redditusers, checksum256> redditusers_t;
typedef eosio::multi_index<".redditusers"_n, redditusers> redditusers_t_v_abi;

TABLE shardbucket
{
  std::vector<char> shard_uri;
  uint64_t shard;
  uint64_t primary_key() const { return shard; }
};
typedef eosio::multi_index<"subscomm"_n, shardbucket> subscomm_t_abi;
typedef eosio::multi_index<"queuetokens"_n, shardbucket> queuetokens_t_abi;
typedef eosio::multi_index<"subsuser"_n, shardbucket> subsuser_t_abi;
typedef eosio::multi_index<"subreddits"_n, shardbucket> subreddits_t_abi;
typedef eosio::multi_index<"redditusers"_n, shardbucket> redditusers_t_abi;

//ACTIONS

[[eosio::action]] void createuser(string url, string ethaddress)
{
  require_auth(_self);
  redditusers_t redusers(_self, _self.value);
  checksum256 sum;
  sum = to_key(ethaddress);
  auto doesexist = redusers.find(sum);
  eosio::check(doesexist == redusers.end(), "User Already Exists");

  redusers.emplace(_self, [&](auto &a) {
    a.ethcs = sum;
    a.redditname = url;
    a.ethaddress = ethaddress;
  });
}

[[eosio::action]] void spendtokens(string user, string sub, int64_t amount)
{
  require_auth(_self);
  subsuser_t subsusers(_self, _self.value);

  checksum256 userkey;
  userkey = to_key(user);

  auto fromuser = subsusers.find(userkey);
  eosio::check(fromuser != subsusers.end(), "No User Found");

  subsusers.modify(fromuser, eosio::same_payer, [&](auto &a) {
    a.balance.amount -= amount;
  });

}

[[eosio::action]] void sendtoken(string from, string to, string sub, asset amount)
{
  require_auth(_self);
  //ETH signing?
  subsuser_t subsusers(_self, _self.value);

  checksum256 fromuserkey;
  fromuserkey = to_key(from);

  auto fromuser = subsusers.find(fromuserkey);
  eosio::check(fromuser != subsusers.end(), "No User Found");

  subsusers.modify(fromuser, eosio::same_payer, [&](auto &a) {
    a.balance -= amount;
  });

  checksum256 touserkey;
  touserkey = to_key(to);
  auto touser = subsusers.find(touserkey);

  if (touser == subsusers.end())
  {
    eosio::asset nohold = eosio::asset(0, amount.symbol);
    subsusers.emplace(_self, [&](auto &a) {
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
    subsusers.modify(touser, eosio::same_payer, [&](auto &a) {
      a.balance += amount;
    });
  }
}

[[eosio::action]] void addcommunity(string ethaddress, string subname, string commsymbol, string url)
{
  require_auth(_self);
  subreddits_t comms(_self, _self.value);

  checksum256 ethtohex;
  ethtohex = to_key(ethaddress);

  auto doesexist = comms.find(ethtohex);
  eosio::check(doesexist == comms.end(), "Community Already Exists");
  eosio::asset tokendef = eosio::asset(0, symbol(symbol_code(commsymbol), 4));
  comms.emplace(_self, [&](auto &a) {
    a.ethcs = ethtohex;
    a.ethadd = ethaddress;
    a.subname = subname;
    a.configurl = url;
    a.tokendef = tokendef;
  });
}

static eosio::checksum256 to_key(string pkeystring)
{
  checksum256 pkeyadd;
  pkeyadd = sha256(const_cast<char *>(pkeystring.c_str()), pkeystring.size());
  const uint64_t *ui64 = reinterpret_cast<const uint64_t *>(&pkeyadd);
  return eosio::checksum256::make_from_word_sequence<uint64_t>(ui64[0], ui64[1], ui64[2], ui64[3]);
}
/////////////////////////////////////////
// CHANGES MADE -

// 1) Made a to_key method which is taking string and converting to checksum256 and returning value as a key
// 2)  Action  spendtokens - converted user field to checksum as the table subsuser_t has checksum as primary key assuming user contains the eth address. 
// Removed for loop, as finding by  primary key will return a single row and modified the row as it was written.
// 3) Action sendtoken - similar to spendtokens, converted all the string to checksum to find from table, assuming from and to will be eth address. 
// (converted eth address to checksum256)
// 4) Action addcommunity - added a new parameter ethaddress, to find data from community table, i.e subreddits_t. As the comm table also has the ethcs primary key.
//  And changed the parameter name from 'symbol' to 'commsymbol'
// 5) removed unused methods for now just for compilation and debugging purpose
// 6) Removed all the unused services of liquidapps which were included, like vcpu, vaccount, cron
//////////////////////////////////////////


CONTRACT_END((createuser)(spendtokens)(sendtoken)(addcommunity))