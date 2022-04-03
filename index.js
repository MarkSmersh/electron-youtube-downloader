const { app, BrowserWindow, ipcMain } = require ('electron')
const path = require ('path')
const ytdl = require('ytdl-core')
const fs = require('fs')
const https = require('https')
const Stream = require ('stream').Transform
const cp = require('child_process')
const ffmpegPath = require ('ffmpeg-static')
const getFFSet = require ('./core/utils/set')
const formatFilter = require ('./core/utils/formatFilter')

const createWindow = () => {    
    const win = new BrowserWindow ({ width: 1000, height: 600, 
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, './core/preload.js')
        },
        resizable: false,
        fullscreen: false,
        fullscreenable: false
    })
    win.loadFile('./core/index.html')
    // win.removeMenu()
}

app.on('ready', () => {
    createWindow()
})

app.on('quit', () => {
    fs.rmSync('./tmp', { recursive: true, force: true });
})

ipcMain.handle('info', async (e, link) => {
    var result;
    try {
        const info = await ytdl.getInfo(link)
        result = {'ok': true, 'response': info}
    } catch (e) {
        var text = e.message.split(':')[0]
        if (text = 'No video id found') {
            text = 'No such video by that link'
        }
        result = {'ok': false, 'error': text}
    }
    return result
})

ipcMain.handle('download', async (e, info, audio, video, filepath, rawTitle, qualities) => {
    const title = (() => {
        var stringArr = rawTitle.split('')
        for (let i = 0; i < stringArr.length; i++) {
            let badSymbols = ['/', '|', ':']
            if (badSymbols.includes(stringArr[i])) stringArr[i] = '-'
        }
        return stringArr.join('')
    })()
    
    const Files = await new Promise((resolve) => {
        const streams = []
        if (audio !== -1) {
            let path = './tmp/audio.weba'
            let AudioStream = ytdl.downloadFromInfo(info, { quality: audio })
            streams.push({ stream: AudioStream, path: path })
        }
        if (video !== -1) {
            let path = './tmp/video.webm'
            let VideoStream = ytdl.downloadFromInfo(info, { quality: video })
            streams.push({ stream: VideoStream, path: path })
        }
        for (let i = 0; i < streams.length; i++) {
            if (!fs.existsSync('./tmp/')) fs.mkdirSync('./tmp/')
            let WriteStream = streams[i].stream.pipe(fs.createWriteStream(streams[i].path))
            WriteStream.on('finish', () => {
                if (i === streams.length - 1) {
                    let paths = (() => {
                        let result = []
                        for (let i = 0; i < streams.length; i++) {
                            result.push(streams[i].path)
                        }
                        return result
                    })()
                    resolve({ ok: true, response: paths })
                }
            })
            WriteStream.on('error', e => {
                resolve({ ok: true, error: e.message })
            })
        }
    })
    if (!Files.ok) return Files
    const Result = await new Promise ((resolve) => {
        const commandLine = ["-loglevel", "8", "-hide_banner", "-y"]
        for (let i = 0; i < Files.response.length; i++) {
            commandLine.push('-i', Files.response[i])
        }
        if (audio !== -1 && video === -1) {
            commandLine.push('-vn', '-b:a', `${qualities.audio}k`, '-ac', '2')
        }
        if (audio === -1 && video !== -1) {
            let videoB = Math.round(qualities.video / 1000)
            commandLine.push('-an', '-b:v', `${videoB}k`, '-bufsize', `${videoB}k`)
        }
        if (audio !== -1 && video !== -1) {
            let videoB = Math.round(qualities.video / 1000)
            commandLine.push('-b:a', `${qualities.audio}k`, '-ac', '2', '-b:v', `${videoB}k`, '-bufsize', `${videoB}k`)
        }
        commandLine.push(`${filepath}/${title}`)
        if (!fs.existsSync(filepath)) fs.mkdirSync(filepath)
        const ffmpegProcess = cp.spawn(ffmpegPath, commandLine, { windowsHide: true });
        ffmpegProcess.on('exit', () => {
            resolve({ ok: true, response: 'File has downloaded!' })
        })
        ffmpegProcess.on('error', (e) => {
            console.log(e)
            resolve({ ok: false, error: e.message })
        })
    })
    return Result
})

ipcMain.handle('pic', async (e, url, uri) => {
    const result = await new Promise((resolve) => {
        https.get(url, (res) => {
            const result = new Stream()
    
            res.on('data', (data) => {
                result.push(data)
            })
    
            res.on('end', () => {
                var filepath = uri.split('/')
                filepath.pop()
                filepath = filepath.join('/')
                if (!fs.existsSync(filepath)) fs.mkdirSync(filepath)
                fs.writeFileSync(uri, result.read())
                let fullfilepath = path.resolve(uri)
                resolve({"ok": true, "response": fullfilepath})
            })

            res.on('error', (e) => {
                resolve({"ok": false, "error": e.message})
            })
        }).on('error', (e) => {
            resolve({"ok": false, "error": e.message})
        })
    })
    return result
})

ipcMain.handle('filter', (e, formats) => {
    const result = formatFilter (formats)
    return result
})

ipcMain.handle('write', (e, file, data) => {
    var filepath = file.split('/')
    filepath.pop()
    filepath = filepath.join('/')
    if (!fs.existsSync(filepath)) fs.mkdirSync(filepath)
    fs.writeFileSync(file, JSON.stringify(data))
    return true
})

ipcMain.handle('read', async (e, file) => {
    const data = fs.readFileSync(file)
    const result = await JSON.parse(data)
    return result
})