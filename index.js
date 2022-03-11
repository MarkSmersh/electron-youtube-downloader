const { app, BrowserWindow, ipcMain } = require ('electron')
const path = require ('path')
const ytdl = require('ytdl-core')
const fs = require('fs')
const https = require('https')
const Stream = require ('stream').Transform
const cp = require('child_process')
const ffmpegPath = require ('ffmpeg-static')
const getFFSet = require ('./core/utils/set')


const createWindow = () => {    
    new BrowserWindow ({ width: 1000, height: 600, 
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, './core/preload.js')
        },
        fullscreen: false,
        resizable: false
    })
        .loadFile('./core/index.html')
}

app.on('ready', () => {
    createWindow()
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

ipcMain.handle('download', async (e, info, audio, video, path) => {
    const result = new Stream.PassThrough({ highWaterMark: 1024 * 512 });
    const ffSet = getFFSet (audio, video)
    const ffmpegProcess = cp.spawn(ffmpegPath, ffSet.command, ffSet.set);

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
    var str = result.pipe(fs.createWriteStream(path))
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
                let path = `./core/${uri}`
                fs.writeFileSync(path, result.read())
                resolve({"ok": true, "response": uri})
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