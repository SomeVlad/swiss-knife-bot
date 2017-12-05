const Telegraf = require('telegraf')

const { token, adminChatId } = require('./config')

const getWelcomingMessage = require('./utils/welcoming-message')
const facebookLinkFixer = require('./utils/facebook-link-fixer')
const youtubeDl = require('./utils/youtube-dl')
const telegraphFromFacebook = require('./utils/telegraph-from-facebook')

// Create a bot that uses 'polling' to fetch new updates
const bot = new Telegraf(token)

// Listen for '/start'
bot.start(context => {
    const { first_name } = context.from
    const welcomingMessage = getWelcomingMessage(first_name)
    context.reply(welcomingMessage, { parse_mode: 'HTML' })
})

bot.hears(/(m|touch)\.facebook.com\S+/i, context => {
    const mLink = `https://${context.match[0]}`
    const { status, message } = facebookLinkFixer(mLink)
    if (status === 'error') return context.reply(message)
    context.reply(message)
    telegraphFromFacebook(mLink)
        .then(url => context.reply(url))
        .catch(console.log)
})

bot.hears(/youtube|youtu.be/i, context => {
    const id = (link => {
        const regex = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/
        const match = link.match(regex)
        return match && match[1].length === 11 ? match[1] : false
    })(context.message.text)
    if (id) {
        youtubeDl(context, id)
    }
})

bot.startPolling()