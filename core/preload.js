const { ipcRenderer } = require ('electron')

window.addEventListener('info', async (e) => {
    const info = await ipcRenderer.invoke('info', e.detail.link)
    const formats = await ipcRenderer.invoke ('filter', info)
    await ipcRenderer.invoke('write', info, "./core/temp/video_info.json")
    if (info.ok) {
        videoDetails = info.response.player_response.videoDetails
        console.log(videoDetails)
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
        document.getElementById('formats').innerHTML = Object.keys(formats).map((value, i) => 
        {
            if (i = 0) return <li>full</li>
            return <li>only ${value}</li>
        })
        document.getElementById('qualities').innerHTML = formats['video'].map((value) => {
            return <li>${value}</li>
        })
    } else {
        /* */
    }
})

window.addEventListener('download', async (e) => {
    const info = ipcRenderer.invoke('read', '')
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