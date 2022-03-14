const { ipcRenderer } = require ('electron')

window.addEventListener('info', async (e) => {
    const info = await ipcRenderer.invoke('info', e.detail.link)
    const formats = await ipcRenderer.invoke ('filter', info.response.formats)
    await ipcRenderer.invoke('write', "./tmp/video_info.json", info.response)
    await ipcRenderer.invoke('write', "./tmp/video_formats.json", formats)
    if (info.ok) {
        videoDetails = info.response.player_response.videoDetails
        document.getElementById('title').innerText = videoDetails.title
        document.getElementById('info').className += ' ready'
        const thumbnail = videoDetails.thumbnail.thumbnails[videoDetails.thumbnail.thumbnails.length - 1].url
        ipcRenderer.invoke('pic', thumbnail, './tmp/thumbnail.jpeg').then((e) => {
            if (e.ok) {
                const preview = document.getElementById('thumbnail')
                preview.setAttribute('src', e.response)
                preview.className += ' ready'
            }
        })
        document.getElementById('duration').innerText = secsToDuration(videoDetails.lengthSeconds)
        document.getElementById('formats').innerHTML = `
            <li onclick="changeFormat(this)">video + audio</li>
            <li onclick="changeFormat(this)">audio</li>
            <li onclick="changeFormat(this)">video</li>`
            document.getElementById('format').innerHTML = "video + audio"
            document.getElementById('qualities').innerHTML = calculateFormat('video + audio', formats)
        document.getElementById('quality').innerHTML = formats.video[0].quality
        calculateLength()
        document.getElementById('button').removeAttribute('disabled')
        document.getElementById('button').className = deleteClass(document.getElementById('button').className, 'disabled')
    } else {
        /* */
    }
})

window.addEventListener('download', async (e) => {
    const download = document.getElementById('download')
    if (download.innerText == "File has downloaded!" || download.innerText == "In progress...") return
    const info    = await ipcRenderer.invoke('read', './tmp/video_info.json')
    const formats = await ipcRenderer.invoke('read', './tmp/video_formats.json') 
    const format  = document.getElementById('format').innerText
    const quality = document.getElementById('quality').innerText
    var audio = -1, video = -1, index = -1, audioQ = -1, videoQ = -1
    
    download.className += ' progress'
    download.innerText = "In progress..."

    if (format === 'video' || format === 'video + audio') {
        for (let i = 0; i < formats.video.length; i++) {
            if (formats.video[i].quality == quality) {
                index = i;
                break;
            }
        }
        video = formats.video[index].itag
        videoQ = formats.video[index].quality
        if (format === 'video + audio') {
            audio = formats.audio[0].itag
            audioQ = formats.audio[0].quality
        }
    }
    else if (format === 'audio') {
        for (let i = 0; i < formats.audio.length; i++) {
            if (formats.audio[i].quality == quality) {
                index = i;
                break;
            }
        }
        audio = formats.audio[index].itag
        audioQ = formats.audio[index].quality
    }

    function getTitle (info, audio, video) {
        if (video !== -1 && audio !== -1) {
            return `${info.videoDetails.title}_${videoQ}p_${audioQ}kbps.mp4`
        } 
        else if (video !== -1 && audio === -1) {
            return `${info.videoDetails.title}_${videoQ}p.mp4`
        }
        else if (video === -1 && audio !== -1) {
            return `${info.videoDetails.title}_${audioQ}kbps.mp3`
        }
    }

    const title = getTitle(info, audio, video)

    const result = await ipcRenderer.invoke(
        'download',
        info,
        audio,
        video,
        './downloaded',
        title
    )

    if (result.ok) {
        download.className = deleteClass(download.className, 'progress')
        download.innerText = "File has downloaded!"
    }
})

function secsToDuration (secs) {
    const minutes = Math.floor(secs / 60)
    const seconds = secs - minutes * 60
    return `${minutes}:${seconds}`
}

window.addEventListener('calculateLength', async () => {
    calculateLength()
})

window.addEventListener('changeFormat', async (e) => {
    var format = e.detail
    document.getElementById('format').innerHTML = format
    if (format == 'video + audio') format = 'video'
    const formats = await ipcRenderer.invoke('read', './tmp/video_formats.json') 
    document.getElementById('qualities').innerHTML = calculateFormat(format, formats)
    document.getElementById('quality').innerText = formats[format][0].quality
})

function calculateFormat (format, allFormats) {
    if (format == 'video + audio') format = 'video'
    const formats = allFormats[format]

    var result = ``
    for (i = 0; i < formats.length; i++) {
        result += `<li onclick="changeQuality(this)">${formats[i].quality}</li>`
    }
    return result
}

window.addEventListener('changeQuality', async (e) => {
    document.getElementById('quality').innerText = e.detail
})

async function calculateLength() {
    const formats  = await ipcRenderer.invoke('read', './tmp/video_formats.json') 
    const format   = document.getElementById('format').innerText
    const quality  = document.getElementById('quality').innerText
    const download = document.getElementById('download')
    var index = 0
    var contentLength = 0

    if (format === 'video' || format === 'video + audio') {
        for (let i = 0; i < formats.video.length; i++) {
            if (formats.video[i].quality == quality) {
                index = i;
                break;
            }
        }
        contentLength += parseInt(formats.video[index].contentLength, 10)
        if (format === 'video + audio') {
            contentLength += parseInt(formats.audio[0].contentLength, 10)
        }
    }
    else if (format === 'audio') {
        for (let i = 0; i < formats.audio.length; i++) {
            if (formats.audio[i].quality == quality) {
                index = i;
                break;
            }
        }
        contentLength += parseInt(formats.audio[index].contentLength, 10)
    }
    download.innerText = `Download | ${Math.round(contentLength / 1000000 * 100) / 100}MB`
}

function deleteClass (className = '', name = '') {
    const classArray = className.split(' ')
    delete classArray[classArray.indexOf(name)]
    return classArray.join(' ')
}