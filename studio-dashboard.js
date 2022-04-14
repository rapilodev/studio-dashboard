function formatTime(date) {
    var hours   = date.getHours();
    var minutes = date.getMinutes();
    if (hours < 10)   hours = "0" + hours;
    if (minutes < 10) minutes = "0" + minutes;
    return `${hours}:${minutes}`
}

var oldEvents;
function showEvents(events) {
    var now = Date.now();
    var html  ="<table>";
    for (let event of events) {
        let started  = ( now - Date.parse(event.start) ) / 1000;
        let stops    = ( Date.parse(event.end) - now ) / 1000;
        let url = event.domain + 'agenda/dashboard/sendung/' + event.id + '/';
        html += '<tr href="' + url + '">'

        html += '<td class="time">'
        html += formatTime(new Date(Date.parse(event.start)))+''
        html += ' - '
        html += formatTime(new Date(Date.parse(event.end)))+''
        html += '</td>'

        html += '<td class="title">'
        html += event.title;
        if (started > 0 && stops > 0) {
            html += '<span class="time"> (noch '+duration(stops)+')</span>';
        }
        html += '</td>'
        html += '</tr>'
    }
    html += '</table>'
    if (html != oldEvents){
        $('#event').html(html);
        $('#event tr').on("click", function(){
            $('#details').load($(this).attr("href"));
        })
    }
    oldEvents = html;
}

var events;
function updateEvent(){
    $.getJSON( 'https://piradio.de/agenda/dashboard/')
    .done( function(entries) {
        events = entries
        showEvents(events);
    });
}

function setChannel(peakId, peak, rmsId, rms){
    $(peakId+" #peakLabel").html( Math.round(peak) );
    $(rmsId+" #rmsLabel").html( Math.round(rms) );

    peak *= -1;
    if (peak < 1){
        $(peakId).addClass("loudPeak");
    }else{
        $(peakId).removeClass("loudPeak");
    }

    if (peak < 3){
        $(peakId).addClass("mediumPeak");
    }else{
        $(peakId).removeClass("mediumPeak");
    }
    
    rms *= -1;
    if (rms < 18) {
        $(rmsId).addClass("loudRms");
    }else{
        $(rmsId).removeClass("loudRms");
    }

    if (rms > 30) {
        $(rmsId).addClass("silent");
    }else{
        $(rmsId).removeClass("silent");
    }
    
    var height  = 100 - peak;
    $(peakId).css("height",  height+"%");
    
    var height  = 100 - rms;
    $(rmsId).css("height",  height+"%");

}

function showLevel(){
    $.getJSON( 'http://localhost:8080/data', 
        function(data) {
            setChannel("#leftIn #peak",   data.in.peakLeft,   "#leftIn #rms",   data.in.rmsLeft);
            setChannel("#rightIn #peak",  data.in.peakRight,  "#rightIn #rms",  data.in.rmsRight);
            setChannel("#leftOut #peak",  data.out.peakLeft,  "#leftOut #rms",  data.out.rmsLeft);
            setChannel("#rightOut #peak", data.out.peakRight, "#rightOut #rms", data.out.rmsRight);
        }
    );
}

function updateClock() {
    var now = new Date();
    $('#clock').html(now.toLocaleTimeString());
}    

function duration ( seconds ) {
    var levels = [
        [Math.floor(seconds / 31536000), 'Jahre'],
        [Math.floor((seconds % 31536000) / 86400), 'Tage'],
        [Math.floor(((seconds % 31536000) % 86400) / 3600), 'Stunden'],
        [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), 'Min.'],
        [(((seconds % 31536000) % 86400) % 3600) % 60, 'Sek.'],
    ];
    var words = [];

    for (var i = 0, max = levels.length; i < max; i++) {
        if ( levels[i][0] === 0 ) continue;
        words.push( ' ' + levels[i][0] + ' ' + (levels[i][0] === 1 ? levels[i][1].substr(0, levels[i][1].length-1): levels[i][1]));
    };
    return words[0];
}

$( document ).ready(
    function() {
        $('#leftIn').hide();
        $('#rightIn').hide();
        showLevel();
        updateClock();
        updateEvent();
        const SEC = 1000;
        setInterval(
            function(){
                showLevel();
            }, 5*SEC
        );
        setInterval(
            function(){
                updateClock();
                showEvents(events);
            }, 1*SEC
        );
        setInterval(
            function(){
                updateEvent();
            }, 60*SEC
        );
    }
);

