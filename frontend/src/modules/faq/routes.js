import UserFaqView from "./views/UserFaqView.vue";

const faqRoutes = [
    {
        path: "/faq",
        name: "faq",
        component: UserFaqView,
        meta: { roles: ['USER'] }
    },
];

export default faqRoutes;