const levelUrl = 'https://piradio.de/level/data';
const domain = "https://piradio.de/";
const SEC = 1000;

const formatDigits = i => i < 10 ? "0" + i : i;

const formatTime = date => [
    formatDigits(date.getHours()),
    formatDigits(date.getMinutes())
].join(":");

const formatDate = date => [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
].map(formatDigits).join("-");

const getNow = () => new Date();

const toDateTime = secs => {
    const t = new Date(1970, 0, 1);
    t.setSeconds(secs);
    return t;
};

const showRuntime = (events, now) => {
    if (!events) return;
    events.forEach(event => {
        const started = (now - Date.parse(event.start)) / 1000;
        const stops = (Date.parse(event.end) - now) / 1000;
        if (started > 0 && stops > 0) {
            const runningElem = document.getElementById('running');
            runningElem.classList.toggle("ending", stops < 18000);
            document.getElementById('progress').value =
                100 * started / (started + stops);
            setSecs('clock2', toDateTime(stops + 1));
        }
    });
};

let oldEvents;
const showEvents = (events, now) => {
    if (!events) return;
    let html = "";
    events.forEach(event => {
        const started = (now - Date.parse(event.start)) / 1000;
        const stops = (Date.parse(event.end) - now) / 1000;
        if (started > 0 && stops > 0) {
            html += `
                <img id="img" src="${event.image_url}"/>
                <div class="content">
                    <span class="time">${
                        formatTime(new Date(Date.parse(event.start)))
                    } - ${
                        formatTime(new Date(Date.parse(event.end)))
                    }</span>
                    <span class="title">${event.title}</span>
                    ${started > 0 && stops > 0 ? `
                        <br><progress style="width:100%" id="progress" value="0" max="100"></progress>
                    ` : ''}
                    <div class="details">${event.excerpt}</div>
                </div>`;
        }
    });

    if (html !== oldEvents) {
        document.getElementById('events').innerHTML = html;
        oldEvents = html;
    }
};

let events;
const updateEvents = async () => {
    const date = formatDate(getNow());
    const response = await fetch(`${domain}/agenda/dashboard/date/${date}/`);
    if (response.ok) {
        events = await response.json();
    }
};

const setChannel = (peakId, peak, rmsId, rms) => {
    document.querySelector(`${peakId} #peakLabel`).innerText = Math.round(peak);
    document.querySelector(`${rmsId} #rmsLabel`).innerText = Math.round(rms);

    peak *= -1;
    const peakElem = document.querySelector(peakId);
    peakElem.classList.toggle("loudPeak", peak < 1);
    peakElem.classList.toggle("mediumPeak", peak < 3);

    rms *= -1;
    const rmsElem = document.querySelector(rmsId);
    rmsElem.classList.toggle("loudRms", rms < 18);
    rmsElem.classList.toggle("silent", rms > 30);

    peakElem.style.height = `${100 - peak}%`;
    rmsElem.style.height = `${100 - rms}%`;
};

const showLevel = async () => {
    const response = await fetch(levelUrl);
    if (response.ok) {
        const data = await response.json();
        ["leftIn", "rightIn", "leftOut", "rightOut"].forEach(channel => {
            setChannel(
                `#${channel} #peak`,
                data.in[`peak-${channel.replace('In', '').replace('Out', '')}`],
                `#${channel} #rms`,
                data.in[`rms-${channel.replace('In', '').replace('Out', '')}`]
            );
        });
    }
};

const synchronize = f => {
    const now = getNow();
    const next = new Date(now.getTime());
    next.setSeconds(now.getSeconds() + 1);
    next.setMilliseconds(0);
    setTimeout(f, next - now);
};

const drawCircle = (offset, r, steps, size, className, prefix) => {
    return Array.from({ length: steps }, (_, i) => {
        const angle = i * 2 * Math.PI / steps;
        const cx = -offset + Math.sin(angle) * (r / 2 - size);
        const cy = -offset - Math.cos(angle) * (r / 2 - size);
        return `<circle class="${className}" id="${prefix}${i}" cx="${cx}" cy="${cy}" r="${size}"/>`;
    }).join("");
};

const drawClock = id => {
    const size = document.getElementById('clocks').offsetWidth / 2.1;
    const r = size;
    const cr = size / 75;
    const clockElem = document.getElementById(id);
    clockElem.setAttribute("width", r);
    clockElem.setAttribute("height", r);
    clockElem.setAttribute("viewBox", `${-r} ${-r} ${r} ${r}`);
    clockElem.innerHTML = `
        ${drawCircle(size / 2, r, 12, cr, 'fivemin', 'fm')}
        ${drawCircle(size / 2, r * 0.9, 60, cr, 'second', 's')}
        <text id="hm" text-anchor="middle" dominant-baseline="central" dx="0" dy="${-r / 2}">
            <tspan></tspan>
        </text>
        <text id="s" text-anchor="middle" dominant-baseline="central" dx="0" dy="${-r / 4}">
            <tspan></tspan>
        </text>`;
};

const setSecs = (id, date) => {
    const secs = date.getSeconds();
    const secElems = document.querySelectorAll(`#${id} circle.second`);
    secElems.forEach((elem, i) => elem.classList.toggle('active', i < secs));
    document.querySelector(`#${id} #hm tspan`).textContent = formatTime(date);
    document.querySelector(`#${id} #s tspan`).textContent = formatDigits(secs);
};

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
        document.getElementById('leftIn').classList.toggle('hidden');
        document.getElementById('rightIn').classList.toggle('hidden');
    });

    window.addEventListener('resize', () => {
        drawClock('clock1');
        drawClock('clock2');
    });
});
