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

ipcMain.handle('download', async (e, info, audio, video, filepath, rawTitle) => {
    const result = new Stream.PassThrough({ highWaterMark: 1024 * 512 });
    const ffSet = getFFSet (audio, video)
    const ffmpegProcess = cp.spawn(ffmpegPath, ffSet.command, ffSet.set);

    function mirrorSymbols (string) {
        var stringArr = string.split('')
        for (let i = 0; i < stringArr.length; i++) {
            if (stringArr[i] == '/' || stringArr[i] == '|') stringArr[i] = '-'
        }
        return stringArr.join('')
    }
    const title = mirrorSymbols(rawTitle)

    if (audio !== -1 && video !== -1) {
        var audioStream = ytdl.downloadFromInfo(info, { quality: audio });
        audioStream.pipe(ffmpegProcess.stdio[3]);
        var videoStream = ytdl.downloadFromInfo(info, { quality: video });
        videoStream.pipe(ffmpegProcess.stdio[4]);
    } else if (audio !== -1) {
        var audioStream = ytdl.downloadFromInfo(info, { quality: audio });
        audioStream.pipe(ffmpegProcess.stdio[2]);
    } else if (video !== -1) {
        var videoStream = ytdl.downloadFromInfo(info, { quality: video });
        videoStream.pipe(ffmpegProcess.stdio[2]);
    }

    ffmpegProcess.stdio[ffSet.set.stdio.length - 1].pipe(result);
    if (!fs.existsSync(filepath)) fs.mkdirSync(filepath)
    var str = result.pipe(fs.createWriteStream(`${filepath}/${title}`))
    const response = await new Promise ((resolve) => {
        str.on ('finish', () => {
            resolve({"ok": true, "response": "Video has downloaded"})
        })
        str.on ('error', (e) => {
            resolve({"ok": false, "error": e.message})
        })
    })
    return response
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