import { IMessageSDK } from '@photon-ai/imessage-kit'

const sdk = new IMessageSDK({ debug: true })


const result = await sdk.getMessages()
console.log('All messages:', result.length)

const filtered = await sdk.getMessages({
    sender: '+19087206096',
    unreadOnly: true,
    limit: 20,
    since: new Date('2025-10-20')
})
console.log('Filtered:', filtered.length)


const unread = await sdk.getUnreadMessages()
console.log('Unread by sender:', Object.keys(unread).length)

