const levelUrl = 'https://piradio.de/level/data';
const domain = "https://piradio.de/";
const SEC = 1000;

function formatDigits(i) {
    return (i < 10) ? "0" + i : i;
}

function formatTime(date) {
    return [
        formatDigits(date.getHours()),
        formatDigits(date.getMinutes())
    ].join(":");
}

function formatDate(date) {
    return [
        formatDigits(date.getFullYear()),
        formatDigits(date.getMonth() + 1),
        formatDigits(date.getDate())
    ].join("-");
}

function getNow() {
    return new Date();
}

function toDateTime(secs) {
    const t = new Date(1970, 0, 1);
    t.setSeconds(secs);
    return t;
}

function showRuntime(events, now) {
    if (!events) return;
    for (let event of events) {
        let started = (now - Date.parse(event.start)) / 1000;
        let stops = (Date.parse(event.end) - now) / 1000;
        if (started > 0 && stops > 0) {
            const runningElem = document.getElementById('running');
            if (stops < 18000) {
                runningElem.classList.add("ending");
            } else {
                runningElem.classList.remove("ending");
            }
            document.getElementById('progress').value = 100 * started / (started + stops);
            setSecs('clock2', toDateTime(stops + 1));
        }
    }
}

let oldEvents;
function showEvents(events, now) {
    let html = "";
    if (!events) return;
    for (let event of events) {
        let started = (now - Date.parse(event.start)) / 1000;
        let stops = (Date.parse(event.end) - now) / 1000;
        if (started > 0 && stops > 0) {
            html += `<img id="img" src="${event.image_url}"/>`;
            html += `<div class="content">`;
            html += `<span class="time">`;
            html += `${formatTime(new Date(Date.parse(event.start)))} - `;
            html += `${formatTime(new Date(Date.parse(event.end)))} `;
            html += `</span>`;
            html += `<span class="title">${event.title}</span>`;
            if (started > 0 && stops > 0) {
                html += `<br><progress style="width:100%" id="progress" value="0" max="100"></progress>`;
            }
            html += `<div class="details">${event.excerpt}</div>`;
            html += `</div>`;
        }
    }

    if (html !== oldEvents) {
        document.getElementById('events').innerHTML = html;
        oldEvents = html;
    }
}

let events;
async function updateEvents() {
    const date = formatDate(getNow());
    const response = await fetch(`${domain}/agenda/dashboard/date/${date}/`);
    if (response.ok) {
        events = await response.json();
    }
}

function setChannel(peakId, peak, rmsId, rms) {
    document.querySelector(`${peakId} #peakLabel`).innerText = Math.round(peak);
    document.querySelector(`${rmsId} #rmsLabel`).innerText = Math.round(rms);

    peak *= -1;
    const peakElem = document.querySelector(peakId);
    if (peak < 1) {
        peakElem.classList.add("loudPeak");
    } else {
        peakElem.classList.remove("loudPeak");
    }

    if (peak < 3) {
        peakElem.classList.add("mediumPeak");
    } else {
        peakElem.classList.remove("mediumPeak");
    }

    rms *= -1;
    const rmsElem = document.querySelector(rmsId);
    if (rms < 18) {
        rmsElem.classList.add("loudRms");
    } else {
        rmsElem.classList.remove("loudRms");
    }

    if (rms > 30) {
        rmsElem.classList.add("silent");
    } else {
        rmsElem.classList.remove("silent");
    }

    peakElem.style.height = `${100 - peak}%`;
    rmsElem.style.height = `${100 - rms}%`;
}

async function showLevel() {
    const response = await fetch(levelUrl);
    if (response.ok) {
        const data = await response.json();
        setChannel("#leftIn #peak", data.in["peak-left"], "#leftIn #rms", data.in["rms-left"]);
        setChannel("#rightIn #peak", data.in["peak-right"], "#rightIn #rms", data.in["rms-right"]);
        setChannel("#leftOut #peak", data.out["peak-left"], "#leftOut #rms", data.out["rms-left"]);
        setChannel("#rightOut #peak", data.out["peak-right"], "#rightOut #rms", data.out["rms-right"]);
    }
}

function synchronize(f) {
    const now = getNow();
    const next = new Date(now.getTime());
    next.setSeconds(now.getSeconds() + 1);
    next.setMilliseconds(0);
    setTimeout(f, next - now);
}

function format_digits(i) {
    return (i < 10) ? "0" + i : i;
}

function drawCircle(offset, r, steps, size, className, prefix) {
    let html = '';
    for (let i = 0; i < steps; i++) {
        let cx = -offset + Math.sin(i * 2 * Math.PI / steps) * (r / 2 - size);
        let cy = -offset - Math.cos(i * 2 * Math.PI / steps) * (r / 2 - size);
        html += `<circle class="${className}" id="${prefix}${i}" cx="${cx}" cy="${cy}" r="${size}"/>`;
    }
    return html;
}

function drawClock(id) {
    const size = document.getElementById('clocks').offsetWidth / 2.1;
    const r = size;
    const cr = size / 75;
    let html = drawCircle(size / 2, r, 12, cr, 'fivemin', 'fm');
    html += drawCircle(size / 2, r * 0.9, 60, cr, 'second', 's');
    html += `<text id="hm" text-anchor="middle" dominant-baseline="central" dx="-${r / 2}" dy="-${r / 2}">
                <tspan></tspan>
            </text>`;
    html += `<text id="s" text-anchor="middle" dominant-baseline="central" dx="-${r / 2}" dy="-${r / 4}">
                <tspan></tspan>
            </text>`;
    const clockElem = document.getElementById(id);
    clockElem.setAttribute("width", r);
    clockElem.setAttribute("height", r);
    clockElem.setAttribute("viewBox", `${-r} ${-r} ${r} ${r}`);
    clockElem.innerHTML = html;
}

function setSecs(id, date) {
    const secs = date.getSeconds();
    const secElems = document.querySelectorAll(`#${id} circle.second`);
    if (secs === 0) {
        secElems.forEach(elem => elem.classList.remove('active'));
    }
    for (let i = 1; i <= secs; i++) {
        document.querySelector(`#${id} #s${i}`).classList.add('active');
    }
    for (let i = secs + 1; i < 60; i++) {
        document.querySelector(`#${id} #s${i}`).classList.remove('active');
    }

    document.querySelector(`#${id} #hm tspan`).textContent = formatTime(date);
    document.querySelector(`#${id} #s tspan`).textContent = format_digits(secs);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('leftIn').style.display = 'none';
    document.getElementById('rightIn').style.display = 'none';
    showLevel();
    drawClock('clock1');
    drawClock('clock2');

    updateEvents();
    setInterval(showLevel, 5 * SEC);

    setInterval(() => {
        synchronize(() => {
            const now = getNow();
            setSecs('clock1', now);
            showEvents(events, now);
            showRuntime(events, now);
        });
    }, 0.5 * SEC);

    setInterval(updateEvents, 60 * SEC);

    document.getElementById('meters').addEventListener('click', () => {
        const leftIn = document.getElementById('leftIn');
        const rightIn = document.getElementById('rightIn');
        leftIn.style.display = leftIn.style.display === 'none' ? 'block' : 'none';
        rightIn.style.display = rightIn.style.display === 'none' ? 'block' : 'none';
    });

    window.addEventListener('resize', () => {
        drawClock('clock1');
        drawClock('clock2');
    });
});
