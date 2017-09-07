#!/usr/bin/env nodejs

const TelegramBot = require('node-telegram-bot-api')
const WelcomingMessage = require('./utils/welcoming-message')
const FacebookLinkFixer = require('./utils/facebook-link-fixer')

// so secure much wow
const args = process.argv.slice(2)
const token = args.pop()
const adminChatId = Number(args.pop())

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true})

bot.onText(/\/start/, (msg) => {
    const welcomingMessage = WelcomingMessage(msg.from.first_name)
    bot.sendMessage(msg.chat.id, welcomingMessage, {parse_mode: "HTML"})
})

// Listen for any kind of message
bot.on('message', (msg) => {
    const {
        chat: {
            id: id
        },
        text: text,
        from: {
            first_name: first_name
        }
    } = msg

    // facebook-link-fixer handler
    if (text.includes('m.facebook.com') || text.includes('touch.facebook.com')) {
        const {
            message: replyMessage,
            status: replyStatus
        } = FacebookLinkFixer(text)


        if (replyStatus === 'error')
            bot.sendMessage(adminChatId, `facebook-link-fixer: failed to parse a string ${text}`)

        bot.sendMessage(id, replyMessage)
    }
})