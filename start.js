const events = require('events'),
      SteamUser = require('steam-user'),
      SteamCommunity = require('steamcommunity'),
      SteamTotp = require('steam-totp'),
      SteamTradeOffers = require('steam-tradeoffers'),
      TradeOfferManager = require('steam-tradeoffer-manager');

const bots = [
  {
    username: 'BotUsername',
    password: 'BotPassword',
    sharedSecret: 'BotSharedSecret',
    identitySecret: 'BotIdentitySecret',
    APIKey: 'BotApiKey',
    adminSteamid: 'Your (admin) steamID64'
  }
]

class Bot {
  constructor ({ config }) {
    this.community = new SteamCommunity()
    this.client = new SteamUser()
    this.offers = new SteamTradeOffers()
    this.eventEmitter = new events.EventEmitter()
    this.username = config.username
    this.password = config.password
    this.sharedSecret = config.sharedSecret
    this.identitySecret = config.identitySecret
    this.APIKey = config.APIKey
    this.adminSteamid = config.adminSteamid
    this.online = false
    this.client.setOption('promptSteamGuardCode', false)

    this.tradeOfferManager = new TradeOfferManager({
      'steam': this.client,
      'domain': 'example.com',
      'language': 'en'
    })

    this.client.on('error', (err) => {
      console.log(err)
    })
    // If two-factor auth code incorrect, retry in 5 seconds
    this.client.on('steamGuard', (d, cb, lastCodeWrong) => {
      lastCodeWrong && setTimeout(() => {
        console.log(`Last auth code for bot ${this.username} was wrong, trying to login now`)
        this.login()
      }, 5000)
    })

    this.client.on('loggedOn', () => { console.log(`Bot ${this.username} logged on`) })

    this.client.on('webSession', (sessionId, cookies) => {
      console.log('Got cookies from steam')
      this.webCookies = cookies
      // Set web cookies
      this.tradeOfferManager.setCookies(cookies, (err) => {
        if (err) return console.log('Cant set manager web cookies')
      })

      this.community.setCookies(cookies)

      // Go online
      this.setStatusOnline()
    })

    this.client.on('disconnected', () => { this.online = false })
    this.runTradeOffersManager();
    this.login()
  }

  login () {
    this.client.logOn({
      'accountName': this.username,
      'password': this.password,
      'twoFactorCode': SteamTotp.generateAuthCode(this.sharedSecret)
    })
  }

  setupOffers () {
    this.offers.setup({
      sessionID: this.community.getSessionID(),
      webCookie: this.webCookies,
      APIKey: this.APIKey
    })
  }

  setStatusOnline () {
    this.client.setPersona(SteamUser.Steam.EPersonaState.Online)
    this.eventEmitter.emit('online')
    console.log('Bot online now');
    this.online = true
    // Process confirmations every 30 seconds
    this.community.startConfirmationChecker(30000, this.identitySecret)
  }

  async runTradeOffersManager () {
    this.tradeOfferManager.on('newOffer', async (offer) => {
      const partnerSteamId = offer.partner.getSteamID64()
      // If someone (not admin) wants any items from us, decline offer
      if (offer.itemsToGive.length > 0 && partnerSteamId !== this.adminSteamid) {
        console.log(`Trade offer declined [User SteamID ${partnerSteamId}]`)
        return offer.decline()
      }
      
      try {
        offer.accept();
        console.log(`Trade offer from user [User SteamID ${partnerSteamId}] accepted`)
      } catch (error) {
        return console.log('Cant accept offer.', error)
      }
    })
  }
}

for (const config of bots) {
  let createBot = new Bot({ config })
}
