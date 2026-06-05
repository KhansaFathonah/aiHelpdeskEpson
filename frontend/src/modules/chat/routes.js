import ChatView from './views/UserChatView.vue'

const chatRoutes = [
    {
        path: '/chat',
        name: 'chat',
        component: ChatView,
        meta: { roles: ['USER'] }
    },
]

export default chatRoutes