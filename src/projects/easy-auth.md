---
title: easy_Auth
line: A login service from my college days, read again nine years later.
meta: Node.js and MongoDB · archived
date: 2017-02-25
url: https://github.com/thangaram611/easy_Auth
group: College
---

This was a security project from my college days. Three of us built it in nine commits between 25 February and 23 March 2017, and it was shown in a review. It was never offered to anyone. In November 2026 I installed it again, ran it and tried each part. This is what I found.

## What it was meant to be

A site owner registers, picks plain login or two-factor, and gets a snippet to paste into their page. The snippet draws a login box that carries the owner's eight-character id. The visitors' accounts live with the service, and the six-digit codes are the standard kind that authenticator apps produce.

That is also what Auth0 and Authy were selling at the time, and I did not know they existed. So the fair question is how far this fell short of them.

## Where it fell short

| | Auth0 and Authy in 2017 | easy_Auth |
| --- | --- | --- |
| A stored password | [hashed with bcrypt](https://web.archive.org/web/20170708154831/https://auth0.com/docs/connections/database), one way | encrypted, with a key anyone can rebuild from one line of the source |
| Proof of a login | [a signed token](https://github.com/auth0/docs/blob/4929e2cfaa1e07d8501e83f8a990c3aaa1c339b7/articles/tokens/id_token.md) the site can check for itself | the word `true` |
| Who may call | each application keeps a secret key ([Auth0](https://github.com/auth0/docs/blob/394dc130f391cc969cab0b7bc0c198b8f401dbc3/articles/applications.md), [Authy](https://web.archive.org/web/20170427222050/http://docs.authy.com/totp.html)) | anyone who knows the id printed in the customer's page |

## What happened when I ran it

**It did not start.** `index.js` requires two packages that `package.json` never lists, and the demo site that came with it was missing a third. There is no lockfile, so I installed today's versions of the 2017 ranges, on Node 6 and MongoDB 4.4.

**The password came back.** The commit is titled "add encryption module". It encrypts each password with a key generated from a passphrase, and the passphrase is in the source:

```js
var PassPhrase = "this is the security code";
var MyRSAkey = cryptico.generateRSAKey(PassPhrase, Bits);
```

The same passphrase gives the same key on any machine. I registered with the password `correct-horse-battery`, copied the stored value out of the database, and three lines of code gave the password back. The server also printed each password to its log as it checked it.

**A wrong password opened the dashboard.** The login handler puts the email in the session before it checks the password, and the dashboard only asks whether an email is there. A wrong password got the answer `false`, and then the dashboard.

**Two people logging in at once were mixed up.** One variable holds the session for every visitor:

```js
var sess;
app.post('/checkregistered', function(req, res) {
	sess = req.session;
```

I sent two logins at the same moment, 200 times: the owner with the right password, and a stranger with an address that does not exist. The stranger's session ended up holding the owner's id 117 times. The owner's own session got it once.

**The second factor could be guessed, and could stop the server.** The standard behind these codes says the server ["needs to detect and stop brute force attacks"](https://www.rfc-editor.org/rfc/rfc4226#section-7.3). The check took 3,000 wrong codes in 1.76 seconds and refused none. On my laptop that is one chance in twenty of a hit before the code changes. A check for an id that had no secret threw `Cannot read property 'secretkey' of null`, and the server was gone. Asking for a QR code twice left the first secret in force, so the second QR never worked.

**In the demo site, the second factor guarded nothing.** The demo customer site, removed in the last commit, opened its dashboard right after the password, before any code was asked for. Then I entered `000000`. The answer was `false`, and the dashboard opened anyway. Every visitor's secret was filed under one id, the word `true`.

**A database login was in the history.** Five of the nine commits held the user name and password of a hosted database. They had been public since February 2017. The host no longer resolves.

## What was missing

Not a tool. bcrypt had been on npm since 2011. The library I used for the codes already had a `verify` call with a window for clock drift, published a year before the first commit. I called the other function and compared two strings.

What was missing was what I did not know. A password is hashed, not encrypted. "Logged in" has to be something the other side can check. A secret in a commit stays in the history after the next commit removes it. Each of those is easy to get wrong, which is why the products existed.

## What I did

I rewrote the history to take the database login out of the five commits that held it, and added a README that says what this was and that it must not be run. GitHub went on serving the old commits to anyone who had their hashes, so I deleted the repository, pushed the clean history to a new one of the same name, and archived that.

## What this does not show

- The dependency versions are today's, not 2017's. Without a lockfile the original install cannot be rebuilt.
- What crossed between sessions was a customer id, which the customer's own page prints anyway. The finding is the mechanism.
- I describe Auth0 and Authy from what they published at the time. I had not used either.
- This is one small project read by its own author. I looked for what I now know to look for.
- The repository on GitHub was created in November 2026, when I replaced the old one. Its commits carry their 2017 dates, but for those you now have my word, not GitHub's.
