<script setup>
import { computed, onMounted, ref } from 'vue'
import adminService from '../../../services/admin.service'

const docs = ref([])
const loading = ref(true)
const saving = ref(false)
const deleteId = ref(null)
const toast = ref(null)
const searchQuery = ref('')

const showForm = ref(false)
const isEdit = ref(false)
const form = ref({ id: null, title: '', content: '', source: '', categoryId: null })

const showToast = (message, type = 'success') => {
    toast.value = { message, type }
    setTimeout(() => { toast.value = null }, 3000)
}

const fetchDocs = async () => {
    try {
        loading.value = true
        const res = await adminService.getKnowledge()
        docs.value = res.data?.data ?? []
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

const filteredDocs = computed(() => {
    const keyword = searchQuery.value.trim().toLowerCase()

    if (!keyword) return docs.value

    return docs.value.filter((doc) => {
        return [
            doc.title,
            doc.content,
            doc.source,
            doc.category?.name,
        ].some((value) => String(value ?? '').toLowerCase().includes(keyword))
    })
})

const openCreate = () => {
    isEdit.value = false
    form.value = { id: null, title: '', content: '', source: '', categoryId: null }
    showForm.value = true
}

const openEdit = (doc) => {
    isEdit.value = true
    form.value = {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        source: doc.source ?? '',
        categoryId: doc.categoryId ?? null,
    }
    showForm.value = true
}

const closeForm = () => {
    showForm.value = false
}

const saveDoc = async () => {
    if (!form.value.title.trim() || !form.value.content.trim()) {
        showToast('Title and Content are required', 'error')
        return
    }

    try {
        saving.value = true
        const payload = {
            title: form.value.title.trim(),
            content: form.value.content.trim(),
            source: form.value.source.trim() || undefined,
            categoryId: form.value.categoryId || undefined,
        }

        if (isEdit.value) {
            await adminService.updateKnowledge(form.value.id, payload)
            showToast('Knowledge updated successfully')
        } else {
            await adminService.createKnowledge(payload)
            showToast('Knowledge added successfully')
        }

        closeForm()
        fetchDocs()
    } catch (e) {
        console.error(e)
        showToast(e.response?.data?.message ?? 'Failed to save knowledge', 'error')
    } finally {
        saving.value = false
    }
}

const confirmDelete = (id) => {
    deleteId.value = id
}

const cancelDelete = () => {
    deleteId.value = null
}

const deleteDoc = async () => {
    try {
        await adminService.deleteKnowledge(deleteId.value)
        showToast('Knowledge deleted')
        deleteId.value = null
        fetchDocs()
    } catch (e) {
        console.error(e)
        showToast('Failed to delete knowledge', 'error')
    }
}

const fmt = (dateValue) => {
    if (!dateValue) return '-'
    return new Date(dateValue).toLocaleDateString('en-CA')
}

const displayId = (index) => `KB${String(index + 1).padStart(3, '0')}`

const userLabel = (user) => {
    if (!user) return '-'
    return user.employeeId || user.name || user.email || '-'
}

onMounted(fetchDocs)
</script>

<template>
    <section class="kb-admin-page">
        <header class="kb-admin-header">
            <div>
                <h1>Knowledge Base Management</h1>
                <p>Manage AI knowledge articles</p>
            </div>

            <button
                class="kb-admin-add-btn"
                @click="openCreate"
            >
                <i class="fa-solid fa-plus"></i>
                Add Knowledge
            </button>
        </header>

        <div class="kb-admin-toolbar">
            <div class="kb-admin-search">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search articles..."
                />
            </div>
        </div>

        <div
            v-if="loading"
            class="kb-admin-loading"
        >
            <div class="loading-spinner"></div>
            Loading knowledge articles...
        </div>

        <div
            v-else
            class="kb-admin-table-wrap"
        >
            <table class="kb-admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Created Date</th>
                        <th>Created By</th>
                        <th>Last Updated</th>
                        <th>Last Updated By</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-if="filteredDocs.length === 0">
                        <td colspan="8">
                            <div class="kb-admin-empty">
                                <i class="fa-solid fa-book"></i>
                                <span>No knowledge articles found.</span>
                            </div>
                        </td>
                    </tr>

                    <tr
                        v-for="(doc, index) in filteredDocs"
                        :key="doc.id"
                    >
                        <td class="kb-admin-id">{{ displayId(index) }}</td>
                        <td class="kb-admin-title">{{ doc.title }}</td>
                        <td>
                            <span
                                v-if="doc.category?.name"
                                class="kb-admin-category"
                            >
                                {{ doc.category.name }}
                            </span>
                            <span
                                v-else
                                class="kb-admin-muted"
                            >
                                -
                            </span>
                        </td>
                        <td>{{ fmt(doc.createdAt) }}</td>
                        <td>{{ userLabel(doc.createdBy) }}</td>
                        <td>{{ fmt(doc.updatedAt) }}</td>
                        <td>{{ userLabel(doc.updatedBy) }}</td>
                        <td>
                            <div class="kb-admin-actions">
                                <button
                                    class="kb-admin-icon-btn is-edit"
                                    title="Edit knowledge"
                                    @click="openEdit(doc)"
                                >
                                    <i class="fa-regular fa-pen-to-square"></i>
                                </button>

                                <button
                                    class="kb-admin-icon-btn is-delete"
                                    title="Delete knowledge"
                                    @click="confirmDelete(doc.id)"
                                >
                                    <i class="fa-regular fa-trash-can"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <Teleport to="body">
            <div
                v-if="showForm"
                class="kb-admin-modal-overlay"
                @click.self="closeForm"
            >
                <div class="kb-admin-form-modal">
                    <div class="kb-admin-modal-header">
                        <div>
                            <h2>{{ isEdit ? 'Edit Knowledge' : 'Add Knowledge' }}</h2>
                            <p>{{ isEdit ? 'Update the article used by AI answers' : 'Create a new article for AI answers' }}</p>
                        </div>

                        <button
                            class="kb-admin-close-btn"
                            @click="closeForm"
                        >
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div class="kb-admin-form-body">
                        <label class="kb-admin-form-group">
                            <span>Title</span>
                            <input
                                v-model="form.title"
                                type="text"
                                placeholder="e.g. WiFi setup guide for Epson printers"
                            />
                        </label>

                        <label class="kb-admin-form-group">
                            <span>Source</span>
                            <input
                                v-model="form.source"
                                type="text"
                                placeholder="Optional source"
                            />
                        </label>

                        <label class="kb-admin-form-group">
                            <span>Content</span>
                            <textarea
                                v-model="form.content"
                                placeholder="Write the knowledge article content..."
                            ></textarea>
                        </label>

                        <div class="kb-admin-form-actions">
                            <button
                                class="kb-admin-secondary-btn"
                                @click="closeForm"
                            >
                                Cancel
                            </button>

                            <button
                                class="kb-admin-save-btn"
                                :disabled="saving"
                                @click="saveDoc"
                            >
                                <i
                                    class="fa-solid"
                                    :class="saving ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'"
                                ></i>
                                {{ saving ? 'Saving...' : 'Save Knowledge' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>

        <Teleport to="body">
            <div
                v-if="deleteId"
                class="kb-admin-modal-overlay"
                @click.self="cancelDelete"
            >
                <div class="kb-admin-confirm-modal">
                    <div class="kb-admin-confirm-icon">
                        <i class="fa-solid fa-trash"></i>
                    </div>

                    <h2>Delete Knowledge?</h2>
                    <p>This will permanently delete the article and its AI embeddings.</p>

                    <div class="kb-admin-form-actions">
                        <button
                            class="kb-admin-secondary-btn"
                            @click="cancelDelete"
                        >
                            Cancel
                        </button>
                        <button
                            class="kb-admin-danger-btn"
                            @click="deleteDoc"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <Teleport to="body">
            <div
                v-if="toast"
                class="kb-admin-toast"
                :class="toast.type"
            >
                <i
                    class="fa-solid"
                    :class="toast.type === 'error' ? 'fa-circle-xmark' : 'fa-circle-check'"
                ></i>
                {{ toast.message }}
            </div>
        </Teleport>
    </section>
</template>

<style scoped>
.kb-admin-page {
    color: #f4f7fb;
}

.kb-admin-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 24px;
}

.kb-admin-header h1 {
    margin: 0;
    color: #ffffff;
    font-size: 24px;
    font-weight: 800;
    line-height: 1.15;
}

.kb-admin-header p {
    margin: 10px 0 0;
    color: #9aa8b7;
    font-size: 12px;
    font-weight: 600;
}

.kb-admin-add-btn,
.kb-admin-save-btn {
    height: 36px;
    border: none;
    border-radius: 7px;
    background: #3da2e8;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    padding: 0 18px;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
}

.kb-admin-add-btn:hover,
.kb-admin-save-btn:hover:not(:disabled) {
    background: #3292d5;
}

.kb-admin-save-btn:disabled {
    cursor: not-allowed;
    opacity: 0.55;
}

.kb-admin-toolbar {
    margin-bottom: 22px;
}

.kb-admin-search {
    width: min(420px, 100%);
    height: 40px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #8796a6;
    background: #26394d;
    border: 1px solid rgba(172, 190, 207, 0.14);
    border-radius: 8px;
    padding: 0 14px;
}

.kb-admin-search i {
    font-size: 12px;
}

.kb-admin-search input {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: #dce7f2;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 600;
}

.kb-admin-search input::placeholder {
    color: #8796a6;
}

.kb-admin-loading {
    min-height: 280px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #c7d0ea;
    font-size: 13px;
    font-weight: 700;
}

.kb-admin-table-wrap {
    width: 100%;
    overflow-x: hidden;
    border-radius: 4px;
}

.kb-admin-table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    color: #dce7f2;
}

.kb-admin-table th {
    height: 38px;
    color: #c4d0db;
    font-size: 11px;
    font-weight: 800;
    text-align: left;
    padding: 0 12px;
}

.kb-admin-table td {
    height: 54px;
    background: #2b3e52;
    border-top: 1px solid rgba(19, 34, 49, 0.45);
    border-bottom: 1px solid rgba(19, 34, 49, 0.45);
    color: #cbd7e2;
    font-size: 11px;
    font-weight: 600;
    padding: 0 12px;
    vertical-align: middle;
}

.kb-admin-table th:nth-child(1),
.kb-admin-table td:nth-child(1) {
    width: 7%;
}

.kb-admin-table th:nth-child(2),
.kb-admin-table td:nth-child(2) {
    width: 27%;
}

.kb-admin-table th:nth-child(3),
.kb-admin-table td:nth-child(3) {
    width: 14%;
}

.kb-admin-table th:nth-child(4),
.kb-admin-table td:nth-child(4),
.kb-admin-table th:nth-child(6),
.kb-admin-table td:nth-child(6) {
    width: 11%;
}

.kb-admin-table th:nth-child(5),
.kb-admin-table td:nth-child(5),
.kb-admin-table th:nth-child(7),
.kb-admin-table td:nth-child(7) {
    width: 10%;
}

.kb-admin-table th:nth-child(8),
.kb-admin-table td:nth-child(8) {
    width: 8%;
}

.kb-admin-table td {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.kb-admin-table td:nth-child(3),
.kb-admin-table td:nth-child(8) {
    overflow: visible;
    text-overflow: clip;
}

.kb-admin-table tbody tr:first-child td:first-child {
    border-top-left-radius: 3px;
}

.kb-admin-table tbody tr:first-child td:last-child {
    border-top-right-radius: 3px;
}

.kb-admin-table tbody tr:last-child td:first-child {
    border-bottom-left-radius: 3px;
}

.kb-admin-table tbody tr:last-child td:last-child {
    border-bottom-right-radius: 3px;
}

.kb-admin-id,
.kb-admin-title {
    color: #ffffff;
}

.kb-admin-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.kb-admin-muted {
    color: #97a8b8;
}

.kb-admin-category {
    max-width: 100%;
    min-height: 18px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    background: #3da2e8;
    color: #ffffff;
    padding: 0 9px;
    font-size: 10px;
    font-weight: 800;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.kb-admin-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.kb-admin-icon-btn {
    width: 22px;
    height: 22px;
    border: none;
    background: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 12px;
}

.kb-admin-icon-btn.is-edit {
    color: #3da2e8;
}

.kb-admin-icon-btn.is-delete {
    color: #ef5161;
}

.kb-admin-empty {
    min-height: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #aebbc5;
    font-size: 12px;
}

.kb-admin-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(8, 15, 24, 0.62);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
}

.kb-admin-form-modal,
.kb-admin-confirm-modal {
    width: min(620px, 100%);
    max-height: 90vh;
    overflow: hidden;
    border-radius: 12px;
    background: #1f3144;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.42);
}

.kb-admin-confirm-modal {
    width: min(380px, 100%);
    padding: 28px;
    text-align: center;
}

.kb-admin-modal-header {
    min-height: 76px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 22px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.kb-admin-modal-header h2,
.kb-admin-confirm-modal h2 {
    margin: 0;
    color: #ffffff;
    font-size: 18px;
    font-weight: 800;
}

.kb-admin-modal-header p,
.kb-admin-confirm-modal p {
    margin: 6px 0 0;
    color: #aebbc5;
    font-size: 12px;
    line-height: 1.5;
}

.kb-admin-close-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.06);
    color: #dce7f2;
    cursor: pointer;
}

.kb-admin-form-body {
    max-height: calc(90vh - 76px);
    overflow-y: auto;
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.kb-admin-form-group {
    display: flex;
    flex-direction: column;
    gap: 7px;
}

.kb-admin-form-group span {
    color: #dce7f2;
    font-size: 12px;
    font-weight: 800;
}

.kb-admin-form-group input,
.kb-admin-form-group textarea {
    width: 100%;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    outline: none;
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    padding: 11px 13px;
}

.kb-admin-form-group textarea {
    min-height: 220px;
    resize: vertical;
}

.kb-admin-form-group input::placeholder,
.kb-admin-form-group textarea::placeholder {
    color: #8192a3;
}

.kb-admin-form-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
}

.kb-admin-secondary-btn,
.kb-admin-danger-btn {
    height: 36px;
    border: none;
    border-radius: 7px;
    padding: 0 18px;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
}

.kb-admin-secondary-btn {
    background: #cbd7e2;
    color: #1f3144;
}

.kb-admin-danger-btn {
    background: #ef4438;
    color: #ffffff;
}

.kb-admin-confirm-icon {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    margin: 0 auto 18px;
    background: rgba(239, 68, 56, 0.16);
    color: #ff766e;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
}

.kb-admin-confirm-modal .kb-admin-form-actions {
    justify-content: center;
    margin-top: 22px;
}

.kb-admin-toast {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 1100;
    min-height: 42px;
    border-radius: 8px;
    background: #1f3144;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 16px;
    font-size: 12px;
    font-weight: 800;
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28);
}

.kb-admin-toast.success i {
    color: #24d07f;
}

.kb-admin-toast.error i {
    color: #ef5161;
}

@media (max-width: 760px) {
    .kb-admin-header {
        flex-direction: column;
        margin-bottom: 32px;
    }

    .kb-admin-add-btn {
        width: 100%;
    }

    .kb-admin-toolbar {
        margin-bottom: 26px;
    }
}
</style>
