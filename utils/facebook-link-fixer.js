const {URL} = require('url')

module.exports = function (shittyLink) {
    const errorMessage = 'Something went wrong, sorry. @some_vlad is already aware of your problem and will try to fix it ASAP.'
    const result = {
        status: 'error',
        message: errorMessage
    }
    try {
        const shittyLinkUrl = new URL(shittyLink)

        // if there are 'posts' in da url, there is nothing we should do except for replacing 'm.' with 'www.'
        if (shittyLinkUrl.pathname.includes('/posts/')) {
            result.status = 'success'
            result.message = shittyLinkUrl.href.replace('m.', 'www.').replace('touch.', 'www.')
        }

        // no 'posts', have to parse
        else {
            const postId = shittyLinkUrl.searchParams.get('story_fbid')
            const userId = shittyLinkUrl.searchParams.get('id')

            // parsing failed miserably
            if (!postId || !userId) {
                result.status = 'error'
                result.message = errorMessage
            }

            // parsing DID NAHT fail
            else {
                result.status = 'success'
                result.message = `https://www.facebook.com/${userId}/posts/${postId}`
            }
        }

    }

    catch (err) {
        result.status = 'error'
        result.message = errorMessage
    }

    return result
}