#!/usr/bin/env nodejs

const TelegramBot = require('node-telegram-bot-api')
const WelcomingMessage = require('./utils/welcoming-message')
const FacebookLinkFixer = require('./utils/facebook-link-fixer')

// so secure much wow
const token = [...process.argv].pop()

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true})

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, WelcomingMessage(msg.from.first_name), {parse_mode : "HTML"})
})

// Listen for any kind of message
bot.on('message', (msg) => {
    const {
        chat: {
            id: id
        },
        text: text
    } = msg

    if (text.includes('m.facebook.com') || text.includes('touch.facebook.com')) {
        const replyMessage = FacebookLinkFixer(text)
        bot.sendMessage(id, replyMessage)
    }
})