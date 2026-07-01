import { app, ipcMain, type IpcMainInvokeEvent } from "electron"
import fs from "node:fs"
import path from "node:path"
import {
    createModelDownloader,
    getLlama,
    LlamaChatSession,
    type Llama,
    type LlamaModel,
    type LlamaContext,
    type ModelDownloader,
} from "node-llama-cpp"

export interface AiModelDefinition {
    id: string
    name: string
    tier: 1 | 2 | 3 | 4
    params: string
    quant: string
    approxSizeGB: number
    minRamGB: number
    requiresGpu: boolean
    description: string
    hfRepo: string
}

export const AI_MODEL_CATALOG: AiModelDefinition[] = [
    {
        id: "llama-3.2-3b-q4",
        name: "Llama 3.2 3B Instruct",
        tier: 1,
        params: "3B",
        quant: "Q4_K_M",
        approxSizeGB: 2.0,
        minRamGB: 8,
        requiresGpu: false,
        description: "Fast, okay quality. 8GB RAM, no GPU.",
        hfRepo: "bartowski/Llama-3.2-3B-Instruct-GGUF",
    },
    {
        id: "llama-3.1-8b-q4",
        name: "Llama 3.1 8B Instruct",
        tier: 2,
        params: "7-8B",
        quant: "Q4_K_M",
        approxSizeGB: 4.9,
        minRamGB: 16,
        requiresGpu: false,
        description: "Good balance, the most common choice. 16GB RAM, no GPU.",
        hfRepo: "bartowski/Meta-Llama-3.1-8B-Instruct-GGUF",
    },
    {
        id: "qwen2.5-14b-q4",
        name: "Qwen 2.5 14B Instruct",
        tier: 3,
        params: "14B",
        quant: "Q4_K_M",
        approxSizeGB: 9.0,
        minRamGB: 16,
        requiresGpu: true,
        description: "Noticeably better reasoning. 16GB+ RAM with GPU (Metal/CUDA).",
        hfRepo: "bartowski/Qwen2.5-14B-Instruct-GGUF",
    },
    {
        id: "qwen2.5-32b-q4",
        name: "Qwen 2.5 32B Instruct",
        tier: 4,
        params: "32B",
        quant: "Q4_K_M",
        approxSizeGB: 19.8,
        minRamGB: 32,
        requiresGpu: true,
        description: "Near cloud-model quality. 32GB+ RAM, good GPU.",
        hfRepo: "bartowski/Qwen2.5-32B-Instruct-GGUF",
    },
]

function get_models_dir() {
    const dir = path.join(app.getPath("userData"), "ai-models")
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    return dir
}

function find_model(model_id: string): AiModelDefinition {
    const model = AI_MODEL_CATALOG.find(m => m.id === model_id)
    if (!model) throw new Error(`Unknown model: ${model_id}`)
    return model
}

function get_model_path(model: AiModelDefinition) {
    return path.join(get_models_dir(), `${model.id}.gguf`)
}

const active_downloaders = new Map<string, ModelDownloader>()

let llama_instance: Llama | null = null
let loaded_model: LlamaModel | null = null
let loaded_context: LlamaContext | null = null
let chat_session: LlamaChatSession | null = null
let loaded_model_id: string | null = null

async function unload_model() {
    chat_session = null
    if (loaded_context) {
        await loaded_context.dispose()
        loaded_context = null
    }
    if (loaded_model) {
        await loaded_model.dispose()
        loaded_model = null
    }
    loaded_model_id = null
}

function get_catalog() {
    ipcMain.handle("ai:getCatalog", () => {
        return AI_MODEL_CATALOG.map(model => ({
            ...model,
            downloaded: fs.existsSync(get_model_path(model)),
        }))
    })
}

function download_model() {
    ipcMain.handle("ai:downloadModel", async (event: IpcMainInvokeEvent, model_id: string) => {
        const model = find_model(model_id)

        const downloader = await createModelDownloader({
            modelUri: `hf:${model.hfRepo}:${model.quant}`,
            dirPath: get_models_dir(),
            fileName: `${model.id}.gguf`,
            onProgress({ totalSize, downloadedSize }) {
                event.sender.send("ai:downloadProgress", {
                    modelId: model.id,
                    downloadedSize,
                    totalSize,
                })
            },
        })

        active_downloaders.set(model_id, downloader)
        try {
            const model_path = await downloader.download()
            return model_path
        } finally {
            active_downloaders.delete(model_id)
        }
    })
}

function cancel_download() {
    ipcMain.handle("ai:cancelDownload", async (_event, model_id: string) => {
        const downloader = active_downloaders.get(model_id)
        if (!downloader) return false
        await downloader.cancel({ deleteTempFile: true })
        active_downloaders.delete(model_id)
        return true
    })
}

function delete_model() {
    ipcMain.handle("ai:deleteModel", async (_event, model_id: string) => {
        const model = find_model(model_id)
        if (loaded_model_id === model_id) await unload_model()
        const model_path = get_model_path(model)
        if (fs.existsSync(model_path)) fs.rmSync(model_path)
        return true
    })
}

function load_model() {
    ipcMain.handle("ai:loadModel", async (_event, model_id: string) => {
        const model = find_model(model_id)
        const model_path = get_model_path(model)
        if (!fs.existsSync(model_path)) throw new Error("Model is not downloaded yet")

        await unload_model()

        if (!llama_instance) llama_instance = await getLlama()

        loaded_model = await llama_instance.loadModel({ modelPath: model_path })
        loaded_context = await loaded_model.createContext()
        chat_session = new LlamaChatSession({ contextSequence: loaded_context.getSequence() })
        loaded_model_id = model_id
        return true
    })
}

function unload_model_handler() {
    ipcMain.handle("ai:unloadModel", async () => {
        await unload_model()
        return true
    })
}

function get_active_model() {
    ipcMain.handle("ai:getActiveModel", () => loaded_model_id)
}

function prompt_model() {
    ipcMain.handle("ai:prompt", async (event: IpcMainInvokeEvent, message: string) => {
        if (!chat_session) throw new Error("No model is loaded")
        return await chat_session.prompt(message, {
            onTextChunk: (chunk: string) => {
                event.sender.send("ai:promptChunk", chunk)
            },
        })
    })
}

export function ai_handlers() {
    get_catalog()
    download_model()
    cancel_download()
    delete_model()
    load_model()
    unload_model_handler()
    get_active_model()
    prompt_model()
}
