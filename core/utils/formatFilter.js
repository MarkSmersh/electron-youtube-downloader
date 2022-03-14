function includesQuality (formatted, format) {
    for (let i = 0; i < formatted.length; i++) {
        if (formatted[i].quality == format) {
            return true
        }
    }
    return false
}

function formatFilter (formats) {
    const result = {"audio": [], "video": []}
    for (let i = 0; i < formats.length; i++) 
    {
        const format = formats[i]
        if (format.hasAudio && !format.hasVideo) {
            result.audio.push
            (
                {
                    "itag": format.itag,
                    "quality": format.audioBitrate,
                    "contentLength": format.contentLength   
                }
            )
        } 
        else if (!format.hasAudio && format.hasVideo && format.container === 'webm') {
          // console.log(i)
          if (result.video.length === 0) {
            result.video.push
            (
                {
                    "itag": format.itag,
                    "quality": format.qualityLabel.split('p')[0],
                    "contentLength": format.contentLength
                }
            )
          }
          if (!includesQuality(result.video, format.qualityLabel.split('p')[0])) {
            result.video.push
            (
                {
                    "itag": format.itag,
                    "quality": format.qualityLabel.split('p')[0],
                    "contentLength": format.contentLength
                }
            )
          }
        }
    }
    return result
}

module.exports = formatFilter