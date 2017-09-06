const { URL } = require('url')
const intel = require('intel')
intel.addHandler(new intel.handlers.File('./errors.log'))

module.exports = function (shittyLink) {
    let reply = ''
    try {
        const shittyLinkUrl = new URL(shittyLink)

        // if there are 'posts' in da url, there is nothing we should do except for replacing 'm.' with 'www.'
        if (shittyLinkUrl.pathname.includes('/posts/')) {
            reply = shittyLinkUrl.href.replace('m.', 'www.').replace('touch.', 'www.')
        }

        // no 'posts', have to parse
        else {
            const postId = shittyLinkUrl.searchParams.get('story_fbid')
            const userId = shittyLinkUrl.searchParams.get('id')

            // parsing failed miserably
            if (!postId || !userId) {
                intel.error(
                    'facebook-link-fixer: cannot parse shitty link',
                    new Error(`!postId || !userId. Original string: ${shittyLink}`)
                )
                reply = 'Something went wrong, sorry. @some_vlad is already aware of your problem and will try to fix it ASAP. Or not.'
            }

            // parsing DID NAHT fail
            else reply = `https://www.facebook.com/${userId}/posts/${postId}`
        }

    }

    catch (err) {
        intel.error('facebook-link-fixer: cannot parse shitty link', err)
        reply = 'Something went wrong, sorry. @some_vlad is already aware of your problem and will try to fix it ASAP.'
    }

    return reply
}