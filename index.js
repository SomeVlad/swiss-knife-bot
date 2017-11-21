#!/usr/bin/env nodejs

const TelegramBot = require('node-telegram-bot-api')
const WelcomingMessage = require('./utils/welcoming-message')
const FacebookLinkFixer = require('./utils/facebook-link-fixer')

// so secure much wow
const args = process.argv.slice(2)
const token = args.pop()
const adminChatId = Number(args.pop())

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true })

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

        switch (type) {
            case 'url':
                if (entityText.includes('m.facebook.com') || entityText.includes('touch.facebook.com')) {
                    const { message, status, adminMessage } = FacebookLinkFixer(entityText)
                    // I gotta know
                    if (status === 'error') bot.sendMessage(adminChatId, adminMessage)
                    else {
                        // return message
                        replyMessage += previousText
                        replyMessage += message
                        previousPosition = length + offset
                    }

                }
                if (entityText.includes('youtube') || entityText.includes('youtu.be')) {
                    const id = (text => {
                        const regex = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/
                        const match = text.match(regex)
                        return match && match[1].length === 11 ? match[1] : false
                    })(entityText)

                    if (id) {
                        const { spawn } = require('child_process')
                        const downloader = spawn('youtube-dl', ['--extract-audio', '--audio-format', 'mp3', id, '-o', './youtube/%(id)s.%(ext)s'])
                        let progressMessageId = null
                        let lastUpdateTime = null

                        downloader.stdout.on('data', data => {
                            console.log(`stdout: ${data}`)
                            const dataString = data.toString()
                            if (!progressMessageId) {
                                progressMessageId = true
                                if (!lastUpdateTime) lastUpdateTime = Date.now()
                                bot.sendMessage(chat.id, `Progress: 0%`).then(lastMessage => progressMessageId = lastMessage.message_id)
                            }
                            else {
                                if (dataString.includes('[download]')) {
                                    if (Date.now() - lastUpdateTime > 500) {
                                        lastUpdateTime = Date.now()
                                        const percentage = dataString.match(/\d+%|\d+.\d+%/) && dataString.match(/\d+%|\d+.\d+%/)[0]
                                        if (percentage) {
                                            bot.editMessageText(`Progress: ${percentage}`, {
                                                chat_id: chat.id,
                                                message_id: progressMessageId
                                            }).catch(console.log)
                                        }
                                    }
                                }

                                if (dataString.includes('100%')) {
                                    const percentage = dataString.match(/\d+%|\d+.\d+%/) && dataString.match(/\d+%|\d+.\d+%/)[0]
                                    bot.editMessageText(`Progress: ${percentage}`, {
                                        chat_id: chat.id,
                                        message_id: progressMessageId
                                    }).catch(console.log)
                                }

                                if (dataString.includes('[ffmpeg]')) {
                                    bot.editMessageText(`Converting to mp3...`, {
                                        chat_id: chat.id,
                                        message_id: progressMessageId
                                    }).catch(console.log)
                                }

                                if (dataString.includes('Deleting')) {
                                    bot.editMessageText(`Sending file...`, {
                                        chat_id: chat.id,
                                        message_id: progressMessageId
                                    }).catch(console.log)
                                }
                            }

                        })

                        downloader.stderr.on('data', data => {
                            console.log(`stderr: ${data}`)
                        })

                        downloader.on('close', code => {
                            if (code === 0) {
                                bot.editMessageText(`Done!`, {
                                    chat_id: chat.id,
                                    message_id: progressMessageId
                                }).catch(console.log)
                                bot.sendAudio(chat.id, `./youtube/${id}.mp3`)
                                   .then(() => {
                                       const fs = require('fs')
                                       fs.unlinkSync(`./youtube/${id}.mp3`)
                                   })
                            }
                        })
                    }
                }
                // return text
                break
            default:
                return entityText
        }
    })
    // add a text after the last entity
    replyMessage += text.substr(previousPosition)

    if (replyMessage !== msg.text) bot.sendMessage(chat.id, replyMessage)
})