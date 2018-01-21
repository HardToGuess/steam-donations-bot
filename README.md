# Steam bot for receiving donations
Using this script you can run any amount of donation bots.

How to run:
1. [Install node js](https://nodejs.org/en/) (8+ version)
2. Download bot source code
3. Run ```npm install``` in bot directory (in command line)
4. Edit start.js file and set your bot credentials (If you need APIKey, you can get it [here](https://steamcommunity.com/dev/apikey) (You must be logged in using BOT account))
5. Run bot: ```node start.js```

If you want to run bot forever (on server for example), few additional steps:
1. Install [Forever](https://www.npmjs.com/package/forever): npm i forever -g
2. Run bot: ```forever start start.js```