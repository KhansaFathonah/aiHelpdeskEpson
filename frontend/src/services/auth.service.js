import api from "./api"

const login = async (payload) => {
    const response = await api.post("/auth/login", payload)

    return response.data
}

export const loginService = login

export default {
    login,
}
