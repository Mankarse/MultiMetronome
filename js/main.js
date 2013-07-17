function parsebeatpattern(str, repeat) {
    var length = parseInt(str);
    if (length != NaN) {
        return {length: parseInt(str), repeat: repeat};
    }
    else {
        return null;
    }
}

function Player(beatpattern) {
    var delay = 400;
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

function MetrinomeRunner(player) {
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

$(document).ready(function(){
    var beatpatternfield = $("#beatpattern");
    var beatpattern = parsebeatpattern(beatpatternfield.val(), $("#repeat")[0].checked);
    var runner = new MetrinomeRunner(new Player(beatpattern));
    $("#playbutton").one('click', onPlay);
    function onStop() {
        console.log("stopping");
        runner.stop();
        $(this).replaceWith('<input id="playbutton" type="button" value="Play">')
        $("#playbutton").one('click', onPlay);
    }
    function onPlay() {
        console.log("playing");
        var newbeatpattern = parsebeatpattern(beatpatternfield.val(), $("#repeat")[0].checked);
        if (newbeatpattern != null) beatpattern = newbeatpattern;
        runner = new MetrinomeRunner(new Player(beatpattern));
        runner.start();
        $(this).replaceWith('<input id="stopbutton" type="button" value="Stop">')
        $("#stopbutton").one('click', onStop);
    }
    beatpatternfield.keyup(function(){
        //console.log(beatpatternfield.val());
    });
});