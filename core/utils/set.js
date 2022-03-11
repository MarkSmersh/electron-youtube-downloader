function getFFSet (audio = -1, video = -1) {
    var command = ["-loglevel", "8", "-hide_banner"]
    var set = {
        "windowsHide": true,
        "stdio": []
    }

    const add = (data, arr) => {
        for (let i = 0; i < arr.length; i++) {
            data.push(arr[i])
        }
        return data
    }

    if (audio !== -1 && video !== -1) {
        command = add(command, [ "-i", "pipe:3", "-i", "pipe:4"]) // "-map", "0:a", "-map", "1:v"
        set.stdio = add(set.stdio, ["inherit", "inherit", "inherit", "pipe", "pipe", "pipe"])
    }
    else if (audio !== -1) {
        // command = add(command, ["-i", "pipe:3", "-map", "0:a"])
        command = add(command, ["-i", "pipe:2", "-vn"])
        set.stdio = add(set.stdio, ["inherit", "inherit", "pipe", "pipe"])
    }
    else if (video !== -1) {
        // command = add(command, ["-i", "pipe:3", "-map", "0:v"])
        command = add(command, ["-i", "pipe:2", "-an"])
        set.stdio = add(set.stdio, ["inherit", "inherit", "pipe", "pipe"])
    }
    
    command = add(command, ["-c", "copy", "-f", "matroska", `pipe:${set.stdio.length - 1}`])
    return {"command": command, "set": set}
}

module.exports = getFFSet