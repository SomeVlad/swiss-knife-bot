#!/usr/bin/env nodejs

const TelegramBot = require('node-telegram-bot-api')
const WelcomingMessage = require('./utils/welcoming-message')
const FacebookLinkFixer = require('./utils/facebook-link-fixer')
const YoutubeConverter = require('./utils/youtube-mp3-converter')

// so secure much wow
const args = process.argv.slice(2)
const token = args.pop()
const adminChatId = Number(args.pop())

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true })

const processEntityText = function(text, type) {
    switch (type) {
        case 'url':
            if (text.includes('m.facebook.com') || text.includes('touch.facebook.com')) {
                const { message, status, adminMessage } = FacebookLinkFixer(text)
                // I gotta know
                if (status === 'error') bot.sendMessage(adminChatId, adminMessage)
                return message
            }
            if (text.includes('youtube') || text.includes('youtu.be')) {
                return YoutubeConverter(text)
            }
            return text
            break
        default:
            return text
    }
}

// Listen for '/start'
bot.onText(/\/start/, (msg) => {
    const { first_name, id } = msg.chat
    const welcomingMessage = WelcomingMessage(first_name)
    bot.sendMessage(id, welcomingMessage, { parse_mode: 'HTML' })
})

// Listen for any kind of message
bot.on('message', (msg) => {
    const { chat, text, entities } = msg

    // debugger, kinda
    if (chat.id === adminChatId) bot.sendMessage(adminChatId, JSON.stringify(msg, true, 4))

    // received plain text, nothing to do here. Yet.
    if (!entities) return bot.sendMessage(chat.id, 'Huh?')

    let replyMessage = ''
    let previousPosition = 0
    entities.map(({ length, offset, type }) => {
        // a text before the current entity
        const previousText = text.substr(previousPosition, offset)
        // a text in entity
        const entityText = text.substr(offset, length)

        replyMessage += previousText
        replyMessage += processEntityText(entityText, type)
        previousPosition = length + offset
    })
    // add a text after the last entity
    replyMessage += text.substr(previousPosition)

    if (replyMessage !== msg.text) bot.sendMessage(chat.id, replyMessage)
})