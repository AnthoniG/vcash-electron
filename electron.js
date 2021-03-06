import { app, BrowserWindow, shell } from 'electron'

/**
 * Keep a global reference of the window object, else the window will
 * be closed automatically when the object is garbage collected.
 */
let mainWindow = null

/** All the windows are closed. */
app.on('window-all-closed', () => {
  /**
   * On OS X it is common for applications and their menu bar
   * to stay active until the user quits explicitly with Cmd + Q.
   */
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/** Ready to load the UI. */
app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1152,
    height: 700,
    icon: __dirname + '/src/assets/images/logoRed.png'
  })

  /** Hide browsers menu bar. */
  mainWindow.setMenu(null)

  /** Load the UI starting point. */
  mainWindow.loadURL('file://' + __dirname + '/src/index.html')

  /** Open Chromium DevTools if in dev mode. */
  process.env.NODE_ENV === 'dev' && mainWindow.webContents.openDevTools()

  /** Open external links using OS default browser. */
  mainWindow.webContents.on('new-window', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  /** Main window closed. */
  mainWindow.on('closed', () => {
    /**
     * Dereference the window object, usually you would store windows
     * in an array if your app supports multi windows, this is the time
     * when you should delete the corresponding element.
     */
    mainWindow = null
  })
})
