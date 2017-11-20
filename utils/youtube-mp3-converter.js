module.exports = function(text) {
    const regex = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*‌​/
    const match = text.match(regex)
    return match && match[1].length === 11 ? match[1] : false
}