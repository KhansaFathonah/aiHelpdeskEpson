import api from "./api";

export const KnowledgeService = {

    async getAll() {
        const response = await api.get("/admin/knowledge");
        return response.data.data;
    }

};