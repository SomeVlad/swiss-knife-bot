module.exports = (context, id) => {
    const { chat } = context.message
    const { spawn } = require('child_process')
    const downloader = spawn('youtube-dl', ['--extract-audio', '--audio-format', 'mp3', id, '-o', './youtube/%(id)s/%(title)s.%(ext)s'])
    let progressMessageId = null
    let lastUpdateTime = null
    downloader.stdout.on('data', data => {
        console.log(`stdout: ${data}`)
        const dataString = data.toString()
        if (!progressMessageId) {
            progressMessageId = true
            if (!lastUpdateTime) lastUpdateTime = Date.now()
            context.telegram.sendMessage(chat.id, `Progress: 0%`).then(lastMessage => progressMessageId = lastMessage.message_id)
        }
        else {
            if (dataString.includes('[download]')) {
                if (Date.now() - lastUpdateTime > 500) {
                    lastUpdateTime = Date.now()
                    const percentage = dataString.match(/\d+%|\d+.\d+%/) && dataString.match(/\d+%|\d+.\d+%/)[0]
                    if (percentage) {
                        context.telegram.editMessageText(
                            chat.id,
                            progressMessageId, undefined,
                            `Progress: ${percentage}`
                        ).catch(console.log)
                    }
                }
            }

            if (dataString.includes('100%')) {
                context.telegram.editMessageText(chat.id, progressMessageId, undefined, `Progress: 100%`
                ).catch(console.log)
            }

            if (dataString.includes('[ffmpeg]')) {
                context.telegram.editMessageText(chat.id, progressMessageId, undefined, `Converting to mp3...`
                ).catch(console.log)
            }

            if (dataString.includes('Deleting')) {
                context.telegram.editMessageText(chat.id, progressMessageId, undefined, `Sending file...`
                ).catch(console.log)
            }
        }

    })

    downloader.stderr.on('data', data => {
        console.log(`stderr: ${data}`)
    })

    downloader.on('close', code => {
        if (code === 0) {
            context.telegram.editMessageText(chat.id, progressMessageId, undefined, `Done!`).catch(console.log)
            const fs = require('fs')
            let title = ''
            fs.readdir(`./youtube/${id}`, (err, files) => {
                title = files[0]
                context.replyWithAudio({ source: `./youtube/${id}/${title}` })
                       .then(() => {
                           const fs = require('fs')
                           fs.unlinkSync(`./youtube/${id}/${title}`)
                       })
                       .catch(console.log)
            })

        }
    })
}
