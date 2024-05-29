#!/usr/bin/perl
use strict;
use warnings;
use feature 'state';

package RmsLevelServer {
    use HTTP::Server::Simple::CGI;
    use base qw(HTTP::Server::Simple::CGI);
    use IO::Select;
    use Scalar::Util qw(openhandle);
    use JSON;

    my %dispatch = (
        '/'     => \&get_index,
        '/data' => \&get_data,
    );

    sub handle_request {
        my ($self, $cgi)  = @_;
        my $path    = $cgi->path_info();
        my $handler = $dispatch{$path};

        if (ref($handler) eq "CODE") {
            print "HTTP/1.0 200 OK\r\n";
            $handler->($cgi);
        } else {
            print "HTTP/1.0 404 Not Found\r\n";
            print "Content-type: text/plain; charset=utf-8\n";
            print "Access-Control-Allow-Origin: *\n";
            print "\n404 - Not Found\n";
        }
    }

    sub get_index {
        my ($cgi) = @_;
        return if !ref $cgi;

        print "Content-type: text/html; charset=utf-8\n";
        print "Access-Control-Allow-Origin: *\n";
        print "\n";
        print <<'HTML';
<!DOCTYPE html>
<html>
<head>
    <script>
        function setChannel(peakId, peak, rmsId, rms) {
            document.querySelector(peakId + " #peakLabel").innerHTML = Math.round(peak);
            document.querySelector(rmsId + " #rmsLabel").innerHTML = Math.round(rms);

            peak *= -1;
            if (peak < 1) {
                document.querySelector(peakId).classList.add("loudPeak");
            } else {
                document.querySelector(peakId).classList.remove("loudPeak");
            }

            if (peak < 3) {
                document.querySelector(peakId).classList.add("mediumPeak");
            } else {
                document.querySelector(peakId).classList.remove("mediumPeak");
            }

            rms *= -1;
            if (rms < 18) {
                document.querySelector(rmsId).classList.add("loudRms");
            } else {
                document.querySelector(rmsId).classList.remove("loudRms");
            }

            if (rms > 30) {
                document.querySelector(rmsId).classList.add("silent");
            } else {
                document.querySelector(rmsId).classList.remove("silent");
            }

            var peakHeight = 100 - peak;
            document.querySelector(peakId).style.height = peakHeight + "%";

            var rmsHeight = 100 - rms;
            document.querySelector(rmsId).style.height = rmsHeight + "%";
        }

        function showLevel() {
            fetch('data')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('error').innerHTML = data.error;
                    setChannel("#leftIn #peak", data.in["peak-left"], "#leftIn #rms", data.in["rms-left"]);
                    setChannel("#rightIn #peak", data.in["peak-right"], "#rightIn #rms", data.in["rms-right"]);
                    setChannel("#leftOut #peak", data.out["peak-left"], "#leftOut #rms", data.out["rms-left"]);
                    setChannel("#rightOut #peak", data.out["peak-right"], "#rightOut #rms", data.out["rms-right"]);
                });
        }

        function updateClock() {
            var now = new Date();
            var hours = now.getHours();
            var minutes = now.getMinutes();
            var seconds = now.getSeconds();

            if (hours < 10) hours = "0" + hours;
            if (minutes < 10) minutes = "0" + minutes;
            if (seconds < 10) seconds = "0" + seconds;

            document.getElementById('clock').innerHTML = hours + ':' + minutes + ':' + seconds;
        }

        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('leftIn').style.display = 'none';
            document.getElementById('rightIn').style.display = 'none';
            showLevel();
            updateClock();
            setInterval(showLevel, 5000);
            setInterval(updateClock, 1000);
        });
    </script>
    <style>
        html, body {
            background: black;
            font-family: sans-serif;
        }

        #content {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .bar {
            background: black;
            margin: 0.5em;
            text-align: center;
            width: 150px;
            height: 700px;
            border: 6px solid #999;
            overflow: hidden;
            position: relative;
        }

        #rms, #peak {
            color: white;
            background: green;
            font-size: 3rem;
            width: 100%;
            overflow: hidden;
            position: absolute;
            left: -6px;
            border-top: 0;
            border: 6px solid #999;
            bottom: 0;
            height: 0%;
            transition: all 1s linear;
        }

        #peak {
            color: black;
            background: #66ff66;
        }

        #peak.mediumPeak {
            color: black;
            background: yellow !important;
        }

        #peak.loudPeak {
            color: white;
            background: red !important;
        }

        #rms.loudRms {
            color: white;
            background: red !important;
        }

        #rms.silent {
            color: black;
            background: yellow;
        }

        #rightIn {
            margin-right: 3em;
        }

        button {
            position: absolute;
            top: 0;
            right: 0;
            padding: 1em;
            background: #666;
            color: white;
            border: 0;
        }

        #clock {
            color: white;
            font-size: 3em;
        }

        #error {
            color: red;
        }
    </style>
</head>
<body>
    <div id="buttons">
        <button onclick="document.getElementById('leftIn').style.display = document.getElementById('leftIn').style.display === 'none' ? 'block' : 'none';document.getElementById('rightIn').style.display = document.getElementById('rightIn').style.display === 'none' ? 'block' : 'none';">Show Input</button>
    </div>
    <center>
        <div id="clock"></div>
        <div id="error"></div>
    </center>
    <div id="content">
        <div id="leftIn" class="bar">
            <div id="peak">
                <div id="peakLabel"></div>
                <div id="rms">
                    <div id="rmsLabel"></div>
                </div>
            </div>
        </div>
        <div id="rightIn" class="bar">
            <div id="peak">
                <div id="peakLabel"></div>
                <div id="rms">
                    <div id="rmsLabel"></div>
                </div>
            </div>
        </div>
        <div id="leftOut" class="bar">
            <div id="peak">
                <div id="peakLabel"></div>
                <div id="rms">
                    <div id="rmsLabel"></div>
                </div>
            </div>
        </div>
        <div id="rightOut" class="bar">
            <div id="peak">
                <div id="peakLabel"></div>
                <div id="rms">
                    <div id="rmsLabel"></div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
HTML
    }

    my $json_header = "Content-type: application/json; charset=utf-8\n";
    $json_header .= "Access-Control-Allow-Origin: *\n";
    $json_header .= "\n";

    sub get_fh {
        my ($file) = @_;
        state $old_file;
        state $old_fh;

        return $old_fh if $old_file && $old_file eq $file && openhandle $old_fh;

        open my $fh, '<', $file or return;
        $old_fh = $fh;
        $old_file = $file;

        return $fh;
    }

    sub get_data {
        my ($cgi) = @_;

        my $date = get_current_date();
        my $file = "/var/log/wbox/monitor/monitor-$date.log";
        my $fileh = get_fh($file);
        state $data = '';

        if ($fileh) {
            for my $fh (IO::Select->new($fileh)->can_read(0)) {
                my $bytes = sysread $fh, $data, 65536;
                if (!defined $bytes) {
                    close $fh;
                    print $json_header, qq!{"error":"read error"}\n!;
                    return;
                }
            }
        }

        process_data($data);
    }

    sub get_current_date {
        my ($sec, $min, $hour, $day, $month, $year) = localtime(time());
        return sprintf("%4d-%02d-%02d", $year + 1900, $month + 1, $day);
    }

    sub process_data {
        my ($data) = @_;
        state $content = '{}';
        state $updated_at = 0;

        if ($data =~ /(.*)\n$/) {
            my $line = (split /\n+/, $1)[-1];
            my ($datetime, $rmsLeftIn, $rmsRightIn, $peakLeftIn, $peakRightIn, $rmsLeftOut, $rmsRightOut, $peakLeftOut, $peakRightOut) = split /\t/, $line;

            $content = JSON->new->utf8->canonical->encode({
                datetime => $datetime,
                in  => {"rms-left" => $rmsLeftIn,  "rms-right" => $rmsRightIn,   "peak-left" => $peakLeftIn,   "peak-right" => $peakRightIn},
                out => {"rms-left" => $rmsLeftOut, "rms-right" => $rmsRightOut,  "peak-left" => $peakLeftOut,  "peak-right" => $peakRightOut},
                error => defined $peakRightOut ? '' : 'parse error'
            });

            $updated_at = time;
            $data =~ s/.*\n$//;
        }

        print $json_header, (time < $updated_at + 10) ? $content : qq!{"error":"outdated"}\n!;
    }
}

my $pid = RmsLevelServer->new(7654)->run();
print "Use 'kill $pid' to stop the server.\n";
