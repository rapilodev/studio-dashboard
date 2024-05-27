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
        formatDigits(date.getYear()+1900),
        formatDigits(date.getMonth()+1),
        formatDigits(date.getDate())
    ].join("-");

}

function getNow(){
    const now = new Date();
//    now.setMonth(9-1);now.setDate(15);
    return now;
}

function toDateTime(secs) {
    const t = new Date(1970, 0, 1);
    t.setSeconds(secs);
    return t;
}

function showRuntime(events, now) {
    if (events == null) return;
    for (let event of events) {
        let started = (now - Date.parse(event.start)) / 1000;
        let stops = (Date.parse(event.end) - now) / 1000;
        if (started > 0 && stops > 0) {
            if (stops < 18000 ){
                $('#running').addClass("ending")
            } else { 
                $('#running').removeClass("ending");
            }
            $('#progress').attr("value", 100*started/(started+stops))
            setSecs('clock2', toDateTime(stops+1))
        }
    }
}

var oldEvents;
function showEvents(events, now) {
    var html = "";
    if (events == null) return;
    for (let event of events) {
        let started = (now - Date.parse(event.start)) / 1000;
        let stops = (Date.parse(event.end) - now) / 1000;
        if (started > 0 & stops > 0) {
            html += '<img id="img" src="'+event.image_url+'"/>'
            html += '<div class="content">'
            html += '<span class="time">'
            html += formatTime(new Date(Date.parse(event.start))) + ''
            html += ' - '
            html += formatTime(new Date(Date.parse(event.end))) + ' '
            html += '</span>'
            html += '<span class="title">'
            html += event.title;
            html += '</span>'
            if (started > 0 & stops > 0) html += '<br><progress style="width:100%" id="progress" value="0" max="100"></progress>';
            html += '<div class="details">'
            html += event.excerpt;
            //html += event.topic + event.content;
            html += '</div>'
            html += '</div>'
        }
    }
    
    if (html != oldEvents) {
        $('#events').html(html);
        oldEvents = html;
    }
}

var events;
function updateEvents() {
    const date = formatDate(getNow());
    $.getJSON(domain + `/agenda/dashboard/date/${date}/`)
    //$.getJSON(domain + '/agenda/dashboard/show')
    .done(function(entries) {
        events = entries
    })
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
            setChannel("#leftIn #peak",   data.in["peak-left"],   "#leftIn #rms",   data.in["rms-left"]);
            setChannel("#rightIn #peak",  data.in["peak-right"],  "#rightIn #rms",  data.in["rms-right"]);
            setChannel("#leftOut #peak",  data.out["peak-left"],  "#leftOut #rms",  data.out["rms-left"]);
            setChannel("#rightOut #peak", data.out["peak-right"], "#rightOut #rms", data.out["rms-right"]);
        }
    );
}

function synchronize(f) {
    const now = getNow();
    const next = new Date(now.getTime());
    next.setSeconds(now.getSeconds() + 1);
    next.setMilliseconds(0);
    setTimeout(f , next-now );
}

// clock

function format_digits(i) {
    return (i < 10) ? "0" + i : i;
}

function formatTime(date) {
    return [
        format_digits(date.getHours()),
        format_digits(date.getMinutes())
    ].join(":");
}

function drawCircle(offset, r, steps, size, className, prefix){
    var i;
    var html='';
    for (i = 0; i < steps; i++){
        let cx = -offset + Math.sin(i*2*3.1415/steps) * (r/2-size);
        let cy = -offset - Math.cos(i*2*3.1415/steps) * (r/2-size);
        html += '<circle class="' + className + '" id="' + prefix + i + '" cx="' + cx + '" cy="' + cy + '" r="' + size + '"/>'
    }
    return html;
}

function drawClock(id){
    var size = $('#clocks').width()/2.1;
    var r = size;
    var cr = size/75;
    var html = drawCircle(size/2, r,     12,  cr, 'fivemin', 'fm');
    html +=    drawCircle(size/2, r*0.9, 60, cr, 'second', 's');
    html +=    '<text id="hm" text-anchor="middle" dominant-baseline="central"'
         + 'dx="-' + r/2 + '" dy="-' + r/2 + '">'
         + '<tspan></tspan>'
         + '</text>';
    html +=     '<text id="s" text-anchor="middle" dominant-baseline="central"'
         + 'dx="-' + r/2 + '" dy="-' + r/4 + '">'
         + '<tspan></tspan>'
         + '</text>';
    $('#' + id)
    .attr("width",r)
    .attr("height",r)
    .attr("viewBox", -r + " " + -r + " " + r + " " +r)
    .html(html);
}

function setSecs(id, date){
    var secs = date.getSeconds();
    if (secs==0) $('#' + id + ' circle.second').removeClass('active');
    for (var i = 1; i <= secs; i++) {
        $('#' + id + ' #s' + i).addClass('active');
    }
    for (var i = secs+1; i <= 60; i++) {
        $('#' + id + ' #s' + i).removeClass('active');
    }

    $('#' + id + ' #hm tspan').html(formatTime(date));
    $('#' + id + ' #s tspan').html(format_digits(date.getSeconds()));
}


$(document).ready(
    function() {
        $('#leftIn').hide();
        $('#rightIn').hide();
        showLevel();
        drawClock('clock1');
        drawClock('clock2');

        updateEvents();
        setInterval(function() { showLevel(); }, 5 * SEC);

        setInterval(function() {
            synchronize(function(){
                const now = getNow();
                setSecs('clock1', now)
                showRuntime(events, now);
                showEvents(events, now);
            });
        }, 0.5 * SEC);

        setInterval(function() { updateEvents(); }, 60 * SEC);

        $('#meters').on('click', function() {
            $('#leftIn').toggle();
            $('#rightIn').toggle();
        });
        
        window.onresize = function() {
            drawClock('clock1');
            drawClock('clock2');
        };

    }
);

