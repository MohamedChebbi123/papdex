import { useEffect, useRef, useState } from "react"
import { Download, Loader2, Play, Square, Trash2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  type AiModel,
  getAiCatalog,
  downloadAiModel,
  cancelAiDownload,
  deleteAiModel,
  loadAiModel,
  unloadAiModel,
  getActiveAiModel,
  promptAiModel,
  onAiDownloadProgress,
  onAiPromptChunk,
} from "@/components/ai_service/file"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ChatMessage = { role: "user" | "assistant"; content: string }

function formatBytes(bytes: number) {
  if (!bytes) return "0 GB"
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

export function AiModelsPanel({ open, onOpenChange }: Props) {
  const [models, setModels] = useState<AiModel[]>([])
  const [progress, setProgress] = useState<Record<string, { downloadedSize: number; totalSize: number }>>({})
  const [busyModelId, setBusyModelId] = useState<string | null>(null)
  const [activeModelId, setActiveModelId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState("")
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  function refresh() {
    getAiCatalog().then(setModels)
    getActiveAiModel().then(setActiveModelId)
  }

  useEffect(() => {
    if (open) refresh()
  }, [open])

  useEffect(() => {
    const offProgress = onAiDownloadProgress(p => {
      setProgress(prev => ({ ...prev, [p.modelId]: p }))
    })
    const offChunk = onAiPromptChunk(chunk => {
      setStreaming(prev => prev + chunk)
    })
    return () => {
      offProgress()
      offChunk()
    }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streaming])

  async function handleDownload(modelId: string) {
    setBusyModelId(modelId)
    try {
      await downloadAiModel(modelId)
    } finally {
      setProgress(prev => {
        const next = { ...prev }
        delete next[modelId]
        return next
      })
      setBusyModelId(null)
      refresh()
    }
  }

  async function handleCancel(modelId: string) {
    await cancelAiDownload(modelId)
  }

  async function handleDelete(modelId: string) {
    setBusyModelId(modelId)
    try {
      await deleteAiModel(modelId)
      if (activeModelId === modelId) setActiveModelId(null)
    } finally {
      setBusyModelId(null)
      refresh()
    }
  }

  async function handleLoad(modelId: string) {
    setBusyModelId(modelId)
    try {
      await loadAiModel(modelId)
      setActiveModelId(modelId)
      setMessages([])
    } finally {
      setBusyModelId(null)
    }
  }

  async function handleUnload() {
    await unloadAiModel()
    setActiveModelId(null)
    setMessages([])
  }

  async function handleSend() {
    const message = input.trim()
    if (!message || !activeModelId || sending) return
    setMessages(prev => [...prev, { role: "user", content: message }])
    setInput("")
    setStreaming("")
    setSending(true)
    try {
      const response = await promptAiModel(message)
      setMessages(prev => [...prev, { role: "assistant", content: response }])
    } finally {
      setStreaming("")
      setSending(false)
    }
  }

  const activeModel = models.find(m => m.id === activeModelId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Local AI models</SheetTitle>
          <SheetDescription>
            Download a model from Hugging Face and run it fully offline, on your own machine.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4 pb-4">
          {models.map(model => {
            const p = progress[model.id]
            const isBusy = busyModelId === model.id
            const isDownloading = !!p && !model.downloaded
            const isActive = activeModelId === model.id
            return (
              <div key={model.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      {model.name}
                      {isActive && (
                        <span className="text-xs rounded-full bg-primary/10 text-primary px-1.5 py-0.5">active</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{model.description}</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      {model.params} · {model.quant} · ~{model.approxSizeGB} GB · needs {model.minRamGB}GB RAM
                      {model.requiresGpu ? " + GPU" : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!model.downloaded && !isDownloading && (
                      <Button size="icon-sm" variant="outline" disabled={isBusy} onClick={() => handleDownload(model.id)}>
                        {isBusy ? <Loader2 className="animate-spin" /> : <Download />}
                      </Button>
                    )}
                    {isDownloading && (
                      <Button size="icon-sm" variant="outline" onClick={() => handleCancel(model.id)}>
                        <Square />
                      </Button>
                    )}
                    {model.downloaded && !isActive && (
                      <Button size="icon-sm" variant="outline" disabled={isBusy} onClick={() => handleLoad(model.id)}>
                        {isBusy ? <Loader2 className="animate-spin" /> : <Play />}
                      </Button>
                    )}
                    {isActive && (
                      <Button size="icon-sm" variant="outline" onClick={handleUnload}>
                        <Square />
                      </Button>
                    )}
                    {model.downloaded && (
                      <Button size="icon-sm" variant="destructive" disabled={isBusy} onClick={() => handleDelete(model.id)}>
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                </div>

                {isDownloading && (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${p.totalSize ? (p.downloadedSize / p.totalSize) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(p.downloadedSize)} / {formatBytes(p.totalSize)}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {activeModel && (
          <div className="flex flex-col border-t flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-[10rem] max-h-[16rem]">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                  <span className={`inline-block rounded-lg px-2.5 py-1.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {m.content}
                  </span>
                </div>
              ))}
              {sending && (
                <div className="text-left">
                  <span className="inline-block rounded-lg px-2.5 py-1.5 text-sm bg-muted">
                    {streaming || <Loader2 className="animate-spin inline size-3.5" />}
                  </span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="flex items-center gap-2 p-3">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSend() }}
                placeholder={`Ask ${activeModel.name}...`}
                disabled={sending}
              />
              <Button size="sm" disabled={sending || !input.trim()} onClick={handleSend}>
                Send
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
