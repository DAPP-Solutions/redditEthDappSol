CREATE TABLE accounts(
	id serial PRIMARY KEY,
	pubkey text NOT NULL,
	privkey text NOT NULL,
	account text,
	dateadded TIMESTAMP NOT NULL
);

create TABLE communities(
	id serial PRIMARY KEY,
	subname text,
	subeth text,
	lastrun int,
	dateadded TIMESTAMP NOT NULL
);

create TABLE subscriptions(
	id serial PRIMARY KEY,
	accounteth text,
	subname text,
	account text,
	balance float,
	karma float,
	datejoined TIMESTAMP NOT NULL
);

create TABLE approvequeue (
	id serial PRIMARY KEY,
	accounteth text,
	subname text,
	amount float,
	lastrun int,
	dateadded TIMESTAMP NOT NULL
);

create TABLE redditposts (
	id serial PRIMARY KEY,
	redditaccount text,
	subname text,
	amount float,
	karma int,
	dateadded TIMESTAMP NOT NULL
)

select * from accounts order by id desc limit 10
update accounts set account = substr(pubkey, 0, 12)
select * from subscriptions