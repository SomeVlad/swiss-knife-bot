/*
const fbAccessToken = 'EAAb3AeQZAjpEBABV7Pyu2NRYQRmOmZCC7lg0zNwmVXq6Gc0oSc9D3RS51jFrsZBrrkHabqiWmUdEQO44HqblDyqMJZCjpUUy1itRC18eSeqfLs1M5Awdn8z3uIfHmt5mn9Hci3UqMUmgoQwBnDQP6XeZCJh1MqmmEZBP4xBjSoyAZDZD'
const anotherAccessToken = '1960437354172049|a_jR4LOlZYwSK8cdR5NV6-TubjY'
const url = 'https://m.facebook.com/story.php?story_fbid=10210432218316310&id=1669384860'
// valid till 3.02.2018
var fetch = require('node-fetch');
module.exports = link => {
    fetch(`https://graph.facebook.com/v2.11/10210432218316310?access_token=${anotherAccessToken}`)
        .then(function(res) {
            return res.json();
        }).then(function(json) {
        console.log(json);
    });
    /!*fetch(`https://graph.facebook.com/oauth/access_token?client_id=1960437354172049&client_secret=96d16775799aefb6224aa83684e8084d&grant_type=client_credentials`)
        .then(res => res.json())
        .then(res => console.log(res))*!/

}*/
const needle = require('needle')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const telegraph = require('telegraph-node')
const ph = new telegraph()

function domToNode(domNode) {
    if (domNode.nodeType == domNode.TEXT_NODE) {
        return domNode.data
    }
    if (domNode.nodeType != domNode.ELEMENT_NODE) {
        return false
    }
    var nodeElement = {}
    nodeElement.tag = domNode.tagName.toLowerCase()
    for (var i = 0; i < domNode.attributes.length; i++) {
        var attr = domNode.attributes[i]
        if (attr.name == 'href' || attr.name == 'src') {
            if (!nodeElement.attrs) {
                nodeElement.attrs = {}
            }
            nodeElement.attrs[attr.name] = attr.value
        }
    }
    if (domNode.childNodes.length > 0) {
        nodeElement.children = []
        for (var i = 0; i < domNode.childNodes.length; i++) {
            var child = domNode.childNodes[i]
            nodeElement.children.push(domToNode(child))
        }
    }
    return nodeElement
}

module.exports = url => {
    return new Promise((resolve, reject) => {
        needle('get', url)
            .then(function(resp) {
                const dom = new JSDOM(resp.body)
                const textNode = dom.window.document.querySelector('#m_story_permalink_view h3 + div')
                const authorNode = dom.window.document.querySelector('#m_story_permalink_view a')
                const botName = 'swiss_knife_bot'
                const authorName = authorNode.innerHTML

                ph.createAccount(botName, { short_name: botName, author_name: botName })
                  .then(json => {
                      const token = json.access_token
                      const content = domToNode(textNode).children

                      ph.createPage(token, authorName, content, {
                          return_content: true
                      })
                        .then(json => resolve(json.url))
                        .catch(console.log)
                  })
                  .catch(console.log)

            })
            .catch(console.log)
    })
}

