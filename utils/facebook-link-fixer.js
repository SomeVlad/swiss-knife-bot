const { URL } = require('url')

module.exports = shittyLink => {
    const error = {
        status: 'error',
        message: 'Something went wrong, sorry.'
    }
    const success = message => ({
        status: 'success',
        message
    })

    try {
        const shittyLinkUrl = new URL(shittyLink)

        // if there are 'posts' in da url, there is nothing we should do except for replacing 'm.' with 'www.'
        if (shittyLinkUrl.pathname.includes('/posts/'))
            return success(shittyLinkUrl.href.replace('m.', 'www.').replace('touch.', 'www.'))

        // no 'posts', have to parse
        else {
            const postId = shittyLinkUrl.searchParams.get('story_fbid')
            const userId = shittyLinkUrl.searchParams.get('id')

            // parsing failed miserably
            if (!postId || !userId) return error

            // parsing DID NAHT fail
            else return success(`https://www.facebook.com/${userId}/posts/${postId}`)
        }
    }

    catch (err) {
        return error
    }
}