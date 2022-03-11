const ytdl = require('ytdl-core');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');
const cp = require('child_process');
const stream = require('stream');
const getFFSet = require ('./core/utils/set');
// const { codecs, settings } = require ('./ffmpeg-set.json')

const ytmux = async (link, audio = -1, video = -1) => {
    const info = await ytdl.getInfo(link)
    const result = new stream.PassThrough({ highWaterMark: 1024 * 512 });
    const ffSet = getFFSet (audio, video)

    const ffmpegProcess = cp.spawn(ffmpegPath, ffSet.command, ffSet.set);
    if (audio !== -1 && video !== -1) {
        var audioStream = ytdl.downloadFromInfo(info, { quality: audio });
        audioStream.pipe(ffmpegProcess.stdio[3]);
        var videoStream = ytdl.downloadFromInfo(info, { quality: video });
        videoStream.pipe(ffmpegProcess.stdio[4]);
    } 
    else if (audio !== -1) {
        var audioStream = ytdl.downloadFromInfo(info, { quality: audio });
        audioStream.pipe(ffmpegProcess.stdio[2]);
    } else if (video !== -1) {
        var videoStream = ytdl.downloadFromInfo(info, { quality: video });
        videoStream.pipe(ffmpegProcess.stdio[2]);
    }

    ffmpegProcess.stdio[ffSet.set.stdio.length - 1].pipe(result);
    var str = result.pipe(fs.createWriteStream('test.mp4'))
    str.on ('finish', () => {
        console.log ('Video has downloaded successfully');
        ytdl.getInfo(link).then((e) => console.log(e))
    })
    str.on ('error', (e) => {
        console.log(e)
    })
};

ytmux ('https://www.youtube.com/watch?v=yQ4wqJ9qg2Q', 140, 136) //136 140
// const ytmux = (link, audio = -1, video = -1) => {
//     const result = new stream.PassThrough({ highWaterMark: 1024 * 512 });
//     const ffSet = getFFSet (audio, video)
//     console.log(ffSet)
//     ytdl.getInfo(link).then(info => {
//         const ffmpegProcess = cp.spawn(ffmpegPath, ffSet.command, ffSet.set);
//         if (audio !== -1 && video !== -1) {
//             var audioStream = ytdl.downloadFromInfo(info, { quality: audio });
//             audioStream.pipe(ffmpegProcess.stdio[3]);
//             var videoStream = ytdl.downloadFromInfo(info, { quality: video });
//             videoStream.pipe(ffmpegProcess.stdio[4]);
//         } 
//         else if (audio !== -1) {
//             var audioStream = ytdl.downloadFromInfo(info, { quality: audio });
//             audioStream.pipe(ffmpegProcess.stdio[2]);
//         } else if (video !== -1) {
//             var videoStream = ytdl.downloadFromInfo(info, { quality: video });
//             videoStream.pipe(ffmpegProcess.stdio[2]);
//         }

//         ffmpegProcess.stdio[ffSet.set.stdio.length - 1].pipe(result);
//     });
//     var str = result.pipe(fs.createWriteStream('saski.mp4'))
//     str.on ('finish', () => {
//         console.log ('Video has downloaded successfully');
//         // ytdl.getInfo(link).then((e) => console.log(e))
//     })
//     str.on ('error', (e) => {
//         console.log(e)
//     })
// };





/* var download = ytdl('https://www.youtube.com/watch?v=EYu2-K9O5ws')
  .pipe(fs.createWriteStream('video.mp4'));

download.on('finish', () => {
    console.log ('Video has downloaded successfully');
}) */