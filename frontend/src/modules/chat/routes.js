import ChatView from './views/UserChatView.vue'

const chatRoutes = [
    {
        path: '/chat',
        name: 'chat',
        component: ChatView,
    },
    {
        path: '/chat/:sessionId',
        name: 'chat-session',
        component: ChatView,
    },
]

export default chatRoutes
