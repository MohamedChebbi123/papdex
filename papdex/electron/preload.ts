import { ipcRenderer, contextBridge } from 'electron'

// Every channel the renderer is allowed to reach. Anything not listed here
// is refused by the bridge below — the renderer must never be able to
// invoke an arbitrary IPC channel (e.g. one reached via injected/compromised
// content such as a malicious link in a previewed file).
const INVOKE_CHANNELS = new Set([
  'academic_years:create', 'academic_years:getAll', 'academic_years:update',
  'academic_years:delete', 'academic_years:getById',

  'semesters:create', 'semesters:getAll', 'semesters:getByYear',
  'semesters:getById', 'semesters:update', 'semesters:delete',

  'subjects:create', 'subjects:getBySemester', 'subjects:getByYear',
  'subjects:getById', 'subjects:update', 'subjects:toggleFavorite',
  'subjects:getFavorites', 'subjects:delete',

  'virtualFolders:create', 'virtualFolders:getBySubject', 'virtualFolders:getChildren',
  'virtualFolders:getPath', 'virtualFolders:getById', 'virtualFolders:update',
  'virtualFolders:delete',

  'files:create', 'files:getBySubject', 'files:getByFolder', 'files:getById',
  'files:update', 'files:updateCategory', 'files:delete', 'files:deleteBySubject',
  'files:getCountBySemester', 'files:getCountByYear', 'files:openPicker',
  'files:pickSingle', 'files:search', 'files:getSearchFilterOptions',
  'files:readBuffer', 'files:open', 'files:markOpened', 'files:getRecentBySubject',
  'files:getRecentBySemester', 'files:getRecentByYear', 'files:getTypeCountBySemester',

  'user:get', 'user:update', 'user:pickAvatar',

  'importedFolders:import', 'importedFolders:getBySubject', 'importedFolders:getById',
  'importedFolders:getFiles', 'importedFolders:delete', 'importedFolders:openFile',
  'importedFolders:readBuffer', 'importedFolders:markOpened',
  'importedFolders:getRecentBySubject',

  'data:deleteAll', 'data:exportBackup', 'data:restoreBackup',

  'shell:openExternal',
])

// Channels the main process is allowed to push events on.
const LISTEN_CHANNELS = new Set(['main-process-message'])

function assertChannel(set: Set<string>, channel: string) {
  if (!set.has(channel)) {
    throw new Error(`Blocked IPC channel: "${channel}" is not allow-listed.`)
  }
}

contextBridge.exposeInMainWorld('ipcRenderer', {
  on(channel: string, listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) {
    assertChannel(LISTEN_CHANNELS, channel)
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(channel: string, ...omit: unknown[]) {
    assertChannel(LISTEN_CHANNELS, channel)
    return (ipcRenderer.off as (...a: unknown[]) => void)(channel, ...omit)
  },
  invoke(channel: string, ...args: unknown[]) {
    assertChannel(INVOKE_CHANNELS, channel)
    return ipcRenderer.invoke(channel, ...args)
  },
})
