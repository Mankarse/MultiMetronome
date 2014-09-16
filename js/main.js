//Beat pattern is a string of the form:
//Beat-Pattern:
//  List of Beat-Pattern-Element
//Beat-Pattern-Element
//  Bar
//  Repeat
//  BPM
//  Invalid

//List of Beat-Pattern-Element: //Plays each beat-pattern-element sequentially.
//  Beat-Pattern-Element ...
//Beat-Pattern Group: //Groups together beat-pattern-elements for the purpose of repeats and bpm changes
//                    //If the closing bracket is omitted, the group is assumed to terminate at the end of the beat-pattern
//  { Beat-Pattern }
//Bar: //Plays a beat pattern in the given time signature (as a single strong beat (tick) followed by (Number-1) weak beats (tock))
//  <Number>
//Repeat: //Plays the subsequent beat-pattern-element Number times
//  x<Number>
//BPM:    //Plays 
//  bpm<Number>
//Invalid: //Placeholder for strings that are not recognised. Skipped during playback
//  Everything else

//x20 { bpm100 4 2 4 }


//Additionally, there is a separate tempo scaler that changes the global tempo.

console.log("start");

function Loader(n, onLoaded) {
    this.loadedOne = function() {
        if (--n == 0) onLoaded();
    }
}

var ac;
var tick;
var tock;
/*
function parsebeatpattern(str, repeat) {
    var length = parseInt(str);
    if (length != NaN) {
        return {length: parseInt(str), repeat: repeat};
    }
    else {
        return null;
    }
}
*/
/*
function Player(beatpattern) {
    var position = 0;
    var tick = $("#tick")[0]
    var tock = $("#tock")[0]
    this.reset = function() {
        position = 0;
    }
    this.update = function() {
        if (position === beatpattern.length) {
            if (beatpattern.repeat) {
                position = 0;
            }
            else {
                return {sound: tock, delay: null};
            }
        }
        var retv = {sound: (position === 0 && tick || tock), delay: delay};
        ++position;
        return retv;
    }
}
*/
/*
function MetronomeRunner(player) {
    var timeoutID = null;
    this.start = function start() {
        var res = player.update();
        res.sound.play();
        if (res.delay != null) timeoutID = window.setTimeout(start, res.delay);
    }
    this.stop = function() {
        if (timeoutID != null) clearTimeout(timeoutID);
        player.reset();
    }
}
*/

function MetronomePlayer(beatpattern, doStopCallback) {
    var timeoutID;
    var latestSound;
    this.start = function() {
        console.log("metronome started");
        var startTime = ac.currentTime + 0.005;
        var previousTime = startTime;
        var beatPatternIterator = new beatpattern.iterator();
        if (!beatPatternIterator.has_current()) {
            doStopCallback();
            return;
        }
        var currentBeat = beatPatternIterator.current();
        beatPatternIterator.advance();
        var playLoop = function() {
            //console.log("in loop");
            //console.log("Delay:"+currentBeat.delay);
            //console.log("PreviousTime:"+previousTime);
            //console.log("CurrentTime:"+ac.currentTime);
            while (previousTime+currentBeat.delay < ac.currentTime+0.2) {
                latestSound = playSound(
                    currentBeat.sound,
                    previousTime+currentBeat.delay,
                    beatPatternIterator.has_current() ? null : doStopCallback);
                previousTime = previousTime+currentBeat.delay;
                if (!beatPatternIterator.has_current()) {
                    return;
                }
                currentBeat = beatPatternIterator.current();
                beatPatternIterator.advance();
            }
            timeoutID = setTimeout(playLoop,0);
        };
        timeoutID = setTimeout(playLoop,0);
    };
    this.stop = function() {
        clearTimeout(timeoutID);
        if (latestSound !== undefined) latestSound.stop(0);
    };
}

function BeatPattern(string, repeat, bpmstring) {
    var delay = 60/parseBPM(bpmstring);
    //console.log("BeatPattern String: "+string);
    //console.log("BeatPattern Split: "+string.split(" "));
    //Built in array map doesn't work (for some reason... please come back and find out why...)
    var barLengthArray = map(string.split(" "),parseInt);
    //console.log("Parsed BeatPattern: "+barLengthArray);
    this.iterator = function() {
        var justStarted = true;
        var i = 0;
        var sub_i = 0;
        //this.has_next = function() {
        //    return i+1 < barLengthArray.length || i+1 == barLengthArray.length && sub_i+1 < barLengthArray[i];
        //}
        this.has_current = function() {
            return i < barLengthArray.length;
        }
        this.current = function() {
            return {sound: sub_i === 0 ? tick : tock, delay: justStarted ? 0 : delay};
        }
        this.advance = function() {
            justStarted = false;
            if (sub_i+1 < barLengthArray[i]) {
                sub_i = sub_i+1;
            }
            else {
                i = i + 1;
                sub_i = 0;
                if (repeat && i == barLengthArray.length) i = 0;
            }
        }
    }
}

function parseBPM(str) {
    var num = parseInt(str);
    if (num === NaN || num <= 0) return null;
    return num;
}
/*
function BeatTrack(beatPatternField, repeatField, bpmField) {
    var latestGoodBPM = 100;//MAGIC NUMBER, Default in case html starts with bad value
    var updatedGoodBPM = function() {
        var fieldVal = parseBPM(bpmField.val());
        latestGoodBPM = fieldVal || latestGoodBPM;
    }
    updateGoodBPM();
    bpmField.bind('input', updateGoodBPM);
    
    var latestGoodBeatPattern = 4;//MAGIC NUMBER, Default in case html starts with bad value
    var updateGoodBeatPattern = function() {
        var fieldVal = parseBeatPattern(beatPatternField.val());
        latestGoodBeatPattern = fieldVal || latestGoodBeatPattern;
    }
    updateGoodBeatPattern();
    beatPatternField.bind('input', updateGoodBeatPattern);

    this.beatPatternIterator = function() {
        return new function() {
            this.hasNext = function() {
                return false;
            }
            this.next = function() {
                return null;
            }
            this.hasPrev = function() {
                return false;
            }
            this.prev = function() {
                return null;
            }
            this.hasCurr = function() {
                return true;
            }
            this.curr = function() {
                var retv = new Array();
                var len = latestGoodBeatPattern;
                retv[0] = {sound: 'tick', length: 1/latestGoodBPM};
                for (var i = 1; i < len; ++i) {
                    retv[i] = {sound: 'tock', length: 1/latestGoodBPM};
                }
                return [{}]//TODO
            }
            this.reset = function() {}
        }
    }
    this.repeat() = function() {
        return repeatField.checked;
    }
}

function MusicBox() {
    var onPlayCallback;
    var onStopCallback;
    var track;
    this.changeTrack = function(newTrack) {
        track = newTrack;
    }
    this.play = function() {
        if (onPlayCallback) { onPlayCallback(); }
    }
    this.stop = function() {
        if (onStopCallback) { onStopCallback(); }
    }
    this.onPlay = function(callback) {
        onPlayCallback = callback;
    }
    this.onStop = function(callback) {
        onStopCallback = callback;
    }
}
*/

function map(array, func) {
    var retv = [];
    for (var i = 0; i < array.length; i = i+1) {
        retv[i] = func(array[i]);
    }
    return retv;
}

function loadSound(sources, onLoad) {
  var request = new XMLHttpRequest();
  var url;
  $.each(sources.children(), function() {
      var source = $(this)[0];
      if (sources[0].canPlayType(source.type)) {
          url = source.src;
          return false;
      }
  });
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously
  request.onload = function() {
    ac.decodeAudioData(request.response, onLoad);
  }
  request.send();
}

function playSound(buffer, time, onended) {
    var source = ac.createBufferSource();
    source.buffer = buffer;
    source.onended = onended;
    source.connect(ac.destination);
    source.start(time);
    return source;
}

$(document).ready(function(){
    console.log("ready");
    var AudioContext = window.AudioContext||window.webkitAudioContext;
    ac = new AudioContext();
    ac.createBufferSource();//make a dummy source to get ac.currentTime running (on webkit browsers)
    //2 things to load: {tick, tock}
    var loader = new Loader(2, main);
    loadSound($("#tick"), function(audiobuffer) {
        tick = audiobuffer;
        loader.loadedOne();
    });
    loadSound($("#tock"), function(audiobuffer) {
        tock = audiobuffer;
        loader.loadedOne();
    });
    
    function main() {
        console.log("main");
        var beatpatternfield = $("#beatpattern");
        var bpmfield = $("#bpm");
        var test = beatpatternfield.val()
        var beatpattern = new BeatPattern(beatpatternfield.val(), $("#repeat")[0].checked, bpmfield.val());
        var player = new MetronomePlayer(beatpattern, doStop);
        $("#playbutton").one('click', onPlay);
        function doStop() {
            $("#stopbutton").replaceWith('<input id="playbutton" type="button" value="Play">')
            $("#playbutton").one('click', onPlay);
        }
        function onStop() {
            console.log("stopping");
            player.stop();
            doStop();
        }
        function onPlay() {
            console.log("playing");
            var newbeatpattern = new BeatPattern(beatpatternfield.val(), $("#repeat")[0].checked, bpmfield.val());
            if (newbeatpattern != null) beatpattern = newbeatpattern;
            player = new MetronomePlayer(beatpattern, doStop);
            player.start();
            $("#playbutton").replaceWith('<input id="stopbutton" type="button" value="Stop">')
            $("#stopbutton").one('click', onStop);
        }
        $("#beatpattern").bind('input',function(){
            console.log("input");
        });
        //loader.loadedOne();
    }
});
console.log("init");

