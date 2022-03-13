function deleteClass (className = [], name = '') {
    const classArray = className.split(' ')
    delete classArray[classArray.indexOf(name)]
    return classArray.join(' ')
}

function randomPlaceholder (e) {
    const placeholders = 
    [
        'Plz, don`t let me go...',
        'Hey, where you go?..',
        'We were so close...',
        'Not now...',
        'Waiting for you...',
        'Can you be faster?..',
        'I`m begging you...',
        'Stay with me...',
        'Miss you :(...',
        'Too small motivation?..'
    ]
    let randomIndex = Math.floor(Math.random() * placeholders.length)
    e.placeholder = placeholders[randomIndex]
}

function isClear(e) {
    const link = document.getElementById('link')
    const classArray = e.className.split(' ')
    const getInfo = new CustomEvent ('info', { detail: { link: link.value }})

    if (classArray.includes('fa-magnifying-glass')) {

        if (!link.value && link.placeholder !== 'Nolink?..') {
            link.placeholder = 'Nolinkies?..'
            setTimeout(() => { 
                if (link.placeholder) randomPlaceholder(link)
            }, 2500)
        } 
        else if (link.value) {
            classArray[classArray.indexOf('fa-magnifying-glass')] = 'fa-xmark'
            e.className = classArray.join(' ')
            link.setAttribute('disabled', 'disabled')
            console.log(1)
            const ev = window.dispatchEvent(getInfo)
            console.log(ev)
            link.className += ' disabled'
            e.className += ' disabled'
        }
    }
    else if (classArray.includes('fa-xmark')) {
        if (!classArray.includes('disabled')) {
            window.location.reload();
        }
    }
}

function isValue (e) {
    const button = document.getElementById('button')
    const classArray = button.className.split(' ')
    if (classArray.includes('fa-magnifying-glass')) {
        if (e.value && !classArray.includes('active')) {
            button.className += ' active'
        } else if (!e.value && classArray.includes('active')) {
            button.className = deleteClass(button.className, 'active')
        }
    }
}

function calculateLength() {
    window.dispatchEvent(new Event('calculateLength'))
}

function changeQuality (e) {
    const quality = document.getElementById('quality').innerText
    if (e.innerText == quality) return
    window.dispatchEvent(new CustomEvent('changeQuality', { detail: e.innerText}))
    calculateLength()
}

function changeFormat (e) {
    const format = document.getElementById('format').innerText
    if (e.innerText == format) return
    window.dispatchEvent(new CustomEvent('changeFormat', { detail: e.innerText}))
    calculateLength()
}

function sendDownload () {
    window.dispatchEvent(new Event('download'))
}