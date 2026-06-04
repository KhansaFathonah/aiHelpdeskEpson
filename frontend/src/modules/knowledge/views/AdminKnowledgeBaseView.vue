<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '../../../layouts/AdminLayout.vue'
import adminService from '../../../services/admin.service'

const docs        = ref([])
const loading     = ref(true)
const saving      = ref(false)
const deleteId    = ref(null)
const toast       = ref(null)

// Form state
const showForm    = ref(false)
const isEdit      = ref(false)
const form        = ref({ id: null, title: '', content: '', source: '', categoryId: null })

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

const openCreate = () => {
    isEdit.value = false
    form.value = { id: null, title: '', content: '', source: '', categoryId: null }
    showForm.value = true
}

const openEdit = (doc) => {
    isEdit.value = true
    form.value = { id: doc.id, title: doc.title, content: doc.content, source: doc.source ?? '', categoryId: doc.categoryId ?? null }
    showForm.value = true
}

const closeForm = () => { showForm.value = false }

const saveDoc = async () => {
    if (!form.value.title.trim() || !form.value.content.trim()) {
        showToast('Title and Content are required', 'error')
        return
    }
    try {
        saving.value = true
        const payload = {
            title:      form.value.title.trim(),
            content:    form.value.content.trim(),
            source:     form.value.source.trim() || undefined,
            categoryId: form.value.categoryId || undefined,
        }
        if (isEdit.value) {
            await adminService.updateKnowledge(form.value.id, payload)
            showToast('Document updated successfully!')
        } else {
            await adminService.createKnowledge(payload)
            showToast('Document added and embeddings generated!')
        }
        closeForm()
        fetchDocs()
    } catch (e) {
        console.error(e)
        showToast(e.response?.data?.message ?? 'Failed to save document', 'error')
    } finally {
        saving.value = false
    }
}

const confirmDelete = (id) => { deleteId.value = id }
const cancelDelete  = () => { deleteId.value = null }

const deleteDoc = async () => {
    try {
        await adminService.deleteKnowledge(deleteId.value)
        showToast('Document deleted')
        deleteId.value = null
        fetchDocs()
    } catch (e) {
        console.error(e)
        showToast('Failed to delete document', 'error')
    }
}

const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
}) : '-'

onMounted(fetchDocs)
</script>

<template>
    <AdminLayout title="Knowledge Base" subtitle="Documents used by the AI RAG system">

        <!-- PAGE HEADER -->
        <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <div>
                <h1 style="font-size:18px; font-weight:700; color:#fff; margin:0;">Knowledge Documents</h1>
                <p style="font-size:13px; color:#c7d0ea; margin:4px 0 0;">{{ docs.length }} documents · Changes affect AI answers immediately</p>
            </div>
            <button class="kb-add-btn" @click="openCreate">
                <i class="fa-solid fa-plus"></i>
                Add Document
            </button>
        </div>

        <!-- LOADING -->
        <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            Loading documents…
        </div>

        <!-- EMPTY -->
        <div v-else-if="docs.length === 0" class="ticket-table-card">
            <div class="table-empty">
                <div class="empty-inner">
                    <i class="fa-solid fa-book-open"></i>
                    <p>No knowledge documents yet.</p>
                    <button class="kb-add-btn" @click="openCreate" style="margin-top:12px;">Add First Document</button>
                </div>
            </div>
        </div>

        <!-- DOCS GRID -->
        <div v-else class="kb-grid">
            <div
                v-for="doc in docs"
                :key="doc.id"
                class="kb-card"
            >
                <div class="kb-card-header">
                    <div class="kb-card-icon">
                        <i class="fa-solid fa-file-lines"></i>
                    </div>
                    <div class="kb-card-meta">
                        <div class="kb-card-title">{{ doc.title }}</div>
                        <div class="kb-card-date">Updated {{ fmt(doc.updatedAt) }}</div>
                    </div>
                </div>

                <p class="kb-card-preview">{{ doc.content }}</p>

                <div class="kb-card-footer">
                    <span v-if="doc.source" class="kb-source-tag">
                        <i class="fa-solid fa-link" style="font-size:9px;"></i>
                        {{ doc.source }}
                    </span>
                    <span v-if="doc.category" class="category-tag" style="font-size:11px; padding:2px 8px;">
                        {{ doc.category?.name ?? doc.categoryId }}
                    </span>
                    <div class="kb-card-actions">
                        <button class="kb-btn-edit" @click.stop="openEdit(doc)">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="kb-btn-delete" @click.stop="confirmDelete(doc.id)">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ADD / EDIT FORM MODAL -->
        <Teleport to="body">
            <div v-if="showForm" class="ticket-chat-modal-overlay" @click.self="closeForm">
                <div class="kb-form-modal">

                    <div class="ticket-chat-modal-header">
                        <div class="ticket-chat-modal-header-left">
                            <div class="ticket-chat-modal-avatar">
                                <i class="fa-solid fa-file-lines"></i>
                            </div>
                            <div>
                                <div class="ticket-chat-modal-title">
                                    {{ isEdit ? 'Edit Document' : 'Add New Document' }}
                                </div>
                                <div class="ticket-chat-modal-subtitle">
                                    {{ isEdit ? 'Changes will re-generate embeddings' : 'Will be embedded for AI RAG' }}
                                </div>
                            </div>
                        </div>
                        <button class="ticket-chat-close-btn" @click="closeForm">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div class="kb-form-body">
                        <div class="kb-form-group">
                            <label class="kb-form-label">Title <span style="color:#f87171;">*</span></label>
                            <input
                                v-model="form.title"
                                class="kb-form-input"
                                type="text"
                                placeholder="e.g. Cara Reset Password Printer Epson L3150"
                            />
                        </div>

                        <div class="kb-form-group">
                            <label class="kb-form-label">Source <span style="color:#94a3b8;">(optional)</span></label>
                            <input
                                v-model="form.source"
                                class="kb-form-input"
                                type="text"
                                placeholder="e.g. Manual Epson L3150 hal. 24"
                            />
                        </div>

                        <div class="kb-form-group" style="flex:1;">
                            <label class="kb-form-label">Content <span style="color:#f87171;">*</span></label>
                            <textarea
                                v-model="form.content"
                                class="kb-form-input"
                                style="height:220px; resize:vertical;"
                                placeholder="Isi dokumen yang akan digunakan AI untuk menjawab pertanyaan…"
                            ></textarea>
                        </div>

                        <div class="kb-form-actions">
                            <button class="cancel-button" @click="closeForm" style="flex:none; width:auto; padding:0 20px;">Cancel</button>
                            <button class="kb-save-btn" @click="saveDoc" :disabled="saving">
                                <i class="fa-solid" :class="saving ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'"></i>
                                {{ saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Add Document') }}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </Teleport>

        <!-- DELETE CONFIRM MODAL -->
        <Teleport to="body">
            <div v-if="deleteId" class="ticket-chat-modal-overlay" @click.self="cancelDelete">
                <div class="logout-modal" style="width:380px;">
                    <div class="modal-icon">
                        <i class="fa-solid fa-trash"></i>
                    </div>
                    <h3>Delete Document?</h3>
                    <p>This will permanently delete the document and its AI embeddings. This action cannot be undone.</p>
                    <div class="modal-actions">
                        <button class="cancel-button" @click="cancelDelete">Cancel</button>
                        <button class="confirm-button" @click="deleteDoc">Delete</button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- TOAST -->
        <Teleport to="body">
            <div v-if="toast" class="toast" :class="toast.type">
                <i class="fa-solid" :class="toast.type === 'error' ? 'fa-circle-xmark' : 'fa-circle-check'"></i>
                {{ toast.message }}
            </div>
        </Teleport>

    </AdminLayout>
</template>

<style scoped>
/* ADD BUTTON */
.kb-add-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: background 0.15s;
}
.kb-add-btn:hover { background: #2563eb; }

/* GRID */
.kb-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
}

/* CARD */
.kb-card {
    background: #25345b;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: transform 0.15s, box-shadow 0.15s;
}
.kb-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }

.kb-card-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.kb-card-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: rgba(59,130,246,0.15);
    color: #60a5fa;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
}

.kb-card-title {
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    line-height: 1.4;
}

.kb-card-date {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 2px;
}

.kb-card-preview {
    font-size: 12px;
    color: #c7d0ea;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    flex: 1;
}

.kb-card-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.kb-source-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    color: #94a3b8;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    padding: 2px 8px;
    border-radius: 999px;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.kb-card-actions {
    margin-left: auto;
    display: flex;
    gap: 6px;
}

.kb-btn-edit, .kb-btn-delete {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.15s;
}

.kb-btn-edit {
    background: rgba(59,130,246,0.1);
    color: #60a5fa;
}
.kb-btn-edit:hover { background: rgba(59,130,246,0.25); }

.kb-btn-delete {
    background: rgba(239,68,68,0.1);
    color: #f87171;
}
.kb-btn-delete:hover { background: rgba(239,68,68,0.25); }

/* FORM MODAL */
.kb-form-modal {
    background: #1e2d4d;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 24px 60px rgba(0,0,0,0.4);
    width: 100%;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    max-height: 90vh;
}

.kb-form-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
}

.kb-form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.kb-form-label {
    font-size: 12px;
    font-weight: 600;
    color: #dce3f8;
    text-transform: uppercase;
    letter-spacing: 0.4px;
}

.kb-form-input {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    padding: 10px 14px;
    color: #fff;
    font-size: 13px;
    font-family: 'Inter', sans-serif;
    outline: none;
    transition: border-color 0.15s;
}
.kb-form-input::placeholder { color: #94a3b8; }
.kb-form-input:focus { border-color: rgba(59,130,246,0.5); }

.kb-form-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    padding-top: 8px;
}

.kb-save-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 22px;
    background: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: background 0.15s;
}
.kb-save-btn:hover:not(:disabled) { background: #2563eb; }
.kb-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
