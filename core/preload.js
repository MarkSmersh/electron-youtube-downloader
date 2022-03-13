const { ipcRenderer } = require ('electron')

window.addEventListener('info', async (e) => {
    const info = await ipcRenderer.invoke('info', e.detail.link)
    const formats = await ipcRenderer.invoke ('filter', info.response.formats)
    await ipcRenderer.invoke('write', "./core/temp/video_info.json", info.response)
    await ipcRenderer.invoke('write', "./core/temp/video_formats.json", formats)
    if (info.ok) {
        videoDetails = info.response.player_response.videoDetails
        document.getElementById('title').innerText = videoDetails.title
        document.getElementById('info').className += ' ready'
        const thumbnail = videoDetails.thumbnail.thumbnails[videoDetails.thumbnail.thumbnails.length - 1].url
        ipcRenderer.invoke('pic', thumbnail, 'assets/thumbnail.jpeg').then((e) => {
            if (e.ok) {
                const preview = document.getElementById('thumbnail')
                preview.setAttribute('src', e.response)
                preview.className += ' ready'
            }
        })
        document.getElementById('duration').innerText = secsToDuration(videoDetails.lengthSeconds)
        document.getElementById('formats').innerHTML = `<li>video + audio</li><li>audio</li><li>video</li>`
        document.getElementById('format').innerHTML = "video + audio"
        const qualities = () => {
            var result = ``
            for (i = 0; i < formats.video.length; i++) {
                result += `<li>${formats.video[i].quality}</li>`
            }
            return result
        }
        document.getElementById('qualities').innerHTML = qualities()
        document.getElementById('quality').innerHTML = formats.video[0].quality
    } else {
        /* */
    }
})

window.addEventListener('download', async (e) => {
    const info = ipcRenderer.invoke('read', './core/temp/video_info.json')
    const result = await ipcRenderer.invoke('download')
    const link = document.getElementById('link')
    if (result.ok) {
        link.className += " downloaded"
        link.setAttribute('value', "Video has downloaded!")
    } else {
        link.className += " error"
        link.setAttribute('value', result.error)
    }
})

function secsToDuration (secs) {
    const minutes = Math.floor(secs / 60)
    const seconds = secs - minutes * 60
    return `${minutes}:${seconds}`
}

window.addEventListener('calculateLength', async () => {
    const formats  = await ipcRenderer.invoke('read', './core/temp/video_formats.json') 
    const format   = document.getElementById('format').innerText
    const quality  = document.getElementById('quality').innerText
    var download   = document.getElementById('download').innerText
    var index = 0
    var contentLength = 0

    if (format === 'video' || format === 'video + audio') {
        for (let i = 0; i < formats.video.length; i++) {
            if (formats.video.quality == quality) {
                index = i;
                break;
            }
        }
        contentLength += formats.video[index].contentLength
        if (format === 'video + audio') {
            contentLength += formats.audio[0].contentLength
        }
    }
    else if (format === 'audio') {
        for (let i = 0; i < formats.audio.length; i++) {
            if (formats.audio.quality == quality) {
                index = i;
                break;
            }
        }
        contentLength += formats.audio[0].contentLength
    }
    download = contentLength / 1000000
})