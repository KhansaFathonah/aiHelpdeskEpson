import LoginView from './views/LoginView.vue'

const authRoutes = [
    {
        path: '/',
        name: 'login',
        component: LoginView,
        meta: { public: true }
    },
]

export default authRoutes