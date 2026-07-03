import { app, BrowserWindow, Menu } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import './database/schema'
import { academic_years_handlers } from './handlers/academic_years_handlers'
import { semester_handlers } from './handlers/semester_handler'
import { subject_handlers } from './handlers/subjects'
import { virtual_folder_handlers } from './handlers/virtual_folders_handler'
import { file_handlers } from './handlers/files_handlers'
import { user_handlers } from './handlers/user_handler'
import { imported_folder_handlers } from './handlers/imported_folders_handler'
import { ai_handlers } from './handlers/ai_handler'
const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))



process.env.APP_ROOT = path.join(__dirname, '..')


export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
academic_years_handlers()
semester_handlers()
subject_handlers()
virtual_folder_handlers()
file_handlers()
user_handlers()
imported_folder_handlers()
ai_handlers()
function createWindow() {
  Menu.setApplicationMenu(null)

  win = new BrowserWindow({
    title: 'Papdex',
    icon: path.join(process.env.VITE_PUBLIC, 'papdex-logo.png'),
    backgroundColor: '#0a0a0a',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  win.once('ready-to-show', () => {
    win?.show()
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
