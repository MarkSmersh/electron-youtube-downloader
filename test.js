const fs = require ('fs')
const ytdl = require ('ytdl-core')
const ff = require ('ffmpeg-static')

async function getThumbnail (link, title) {
    let direction = `${title}.mp4`; 
    const info = await ytdl.getInfo(link)
    console.log(info.formats)
    fs.writeFileSync('cache.json', JSON.stringify(info.formats))
    // const stream = ytdl(link).pipe(fs.createWriteStream(direction))
    // const result = await new Promise ((resolve) => {
    //     stream.on('drain', () => {
    //         const stats = fs.statSync(direction)
    //         console.log(stats.size)
    //         console.log(Date.now())
    //     })
    //     stream.on('finish', () => {
    //         resolve('Video has downloaded!')
    //     })
    //     stream.on('error', (err) => {
    //         resolve(err)
    //     })
    // })
    // console.log(result) 
}

let url = 'https://www.youtube.com/watch?v=yQ4wqJ9qg2Q&ab_channel=LittleVMills'

getThumbnail(url, 'cum')