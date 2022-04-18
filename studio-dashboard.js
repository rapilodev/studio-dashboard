const levelUrl = 'https://piradio.de/level/data';
const domain = "https://piradio.de/";
const SEC = 1000;

function formatTime(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    if (hours < 10) hours = "0" + hours;
    if (minutes < 10) minutes = "0" + minutes;
    return `${hours}:${minutes}`
}

function getNow(){
    var now = new Date();
    now.setMonth(4-1);
    now.setDate(14);
    return now;
}

function showRuntime(events) {
    var now = getNow();
    for (let event of events) {
        let started = (now - Date.parse(event.start)) / 1000;
        let stops = (Date.parse(event.end) - now) / 1000;
        if (started > 0 && stops > 0) {
            if (stops < 180 ){
                $('#running').addClass("ending")
            } else { 
                $('#running').removeClass("ending");
            }
            $('#running').text('-' + duration(stops + 1));
            $('#progress').attr("value", 100*started/(started+stops))
        }
    }
}

function loadEventDetails(url) {
    $('#details').load(url, function() {
        $('#details img[src]').each(function() {
            let val = $(this).attr("src");
            if (val.startsWith("/media")) $(this).attr("src", domain + val.replace(new RegExp("/media/+images/"), "/media/thumbs/"));
        });
    })
}

var oldEvents;
function showEvents(events) {
    var now = getNow();
    var html = "<table>";
    for (let event of events) {
        let started = (now - Date.parse(event.start)) / 1000;
        let stops = (Date.parse(event.end) - now) / 1000;
        let classes = 'time';
        let ending = false;
        if (started > 0 & stops > 0) classes += ' running';
        if (started > 0 & stops > 0 & stops < 180*SEC) ending=true;
        if (started > 0 & stops < 0) classes += ' done';
        let url = domain + 'agenda/dashboard/sendung/' + event.id + '/';
        html += '<tr href="' + url + '" class="' + classes + '">'

        html += '<td class="time">'
        html += formatTime(new Date(Date.parse(event.start))) + ''
        html += '-'
        html += formatTime(new Date(Date.parse(event.end))) + ''
        html += '</td>'
        html += '<td class="title">'
        html += event.title;
        if (started > 0 & stops > 0) html += '<br><progress style="width:100%" id="progress" value="0" max="100"></progress>';
        html += '</td>'
        html += '</tr>'
    }
    html += '</table>'
    if (html != oldEvents) {
        $('#events').html(html);
        $('#events tr').on("click", function() {
            loadEventDetails($(this).attr("href"));
        });
        var elem = document.querySelector('.running');
        if (elem) {
            elem.scrollIntoView();
            loadEventDetails($('.running').attr("href"));
        }
    }
    oldEvents = html;
}

var events;
function updateEvents() {
    $.getJSON(domain + '/agenda/dashboard/date/2022-04-14/')
        .done(function(entries) {
            events = entries
            showEvents(events);
        })
        .fail(function(entries) {
            setTimeout(updateEvents(), 3 * SEC);
        });
;
}

function setChannel(peakId, peak, rmsId, rms) {
    $(peakId + " #peakLabel").html(Math.round(peak));
    $(rmsId + " #rmsLabel").html(Math.round(rms));

    peak *= -1;
    if (peak < 1) {
        $(peakId).addClass("loudPeak");
    } else {
        $(peakId).removeClass("loudPeak");
    }

    if (peak < 3) {
        $(peakId).addClass("mediumPeak");
    } else {
        $(peakId).removeClass("mediumPeak");
    }

    rms *= -1;
    if (rms < 18) {
        $(rmsId).addClass("loudRms");
    } else {
        $(rmsId).removeClass("loudRms");
    }

    if (rms > 30) {
        $(rmsId).addClass("silent");
    } else {
        $(rmsId).removeClass("silent");
    }

    var height = 100 - peak;
    $(peakId).css("height", height + "%");

    var height = 100 - rms;
    $(rmsId).css("height", height + "%");

}

function showLevel() {
    $.getJSON(levelUrl,
        function(data) {
            setChannel("#leftIn #peak", data.in.peakLeft, "#leftIn #rms", data.in.rmsLeft);
            setChannel("#rightIn #peak", data.in.peakRight, "#rightIn #rms", data.in.rmsRight);
            setChannel("#leftOut #peak", data.out.peakLeft, "#leftOut #rms", data.out.rmsLeft);
            setChannel("#rightOut #peak", data.out.peakRight, "#rightOut #rms", data.out.rmsRight);
        }
    );
}

function updateClock() {
    var now = new Date();
    $('#time').text(now.toLocaleTimeString());
}

function duration(seconds) {
    var h = Math.floor(((seconds % 31536000) % 86400) / 3600);
    var m = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
    var s = Math.floor(((seconds % 31536000) % 86400) % 3600) % 60;
    return [
        h < 10 ? '0' + h : h,
        m < 10 ? '0' + m : m,
        s < 10 ? '0' + s : s
    ].join(':');
}

$(document).ready(
    function() {
        $('#leftIn').hide();
        $('#rightIn').hide();
        showLevel();
        updateClock();
        updateEvents();
        setInterval(function() {
            showLevel();
        }, 5 * SEC);

        setInterval(function() {
            updateClock();
            showRuntime(events);
            showEvents(events);
        }, 1 * SEC);

        setInterval(function() {
            updateEvents();
        }, 60 * SEC);

        $('#meters').on('click', function() {
            $('#leftIn').toggle();
            $('#rightIn').toggle();
        })
        $('#time').on('click', function() {
            location.reload();
        });
    }
);

