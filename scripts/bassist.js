"use strict";

require.config({
    paths: {
        "Tone" : './extlib/Tone'
    }
});

define([
    'hft/gameserver',
    'hft/gamesupport',
    'hft/misc/misc',
    './audioutils',
    'Tone/core/Master',
    'Tone/core/Note',
    'Tone/core/Transport',
    'Tone/source/Oscillator',
    'Tone/component/Envelope',
    'Tone/effect/FeedbackDelay',
    'Tone/effect/BitCrusher',
  ], function(GameServer, GameSupport, Misc, AudioUtils, Master, Note, Transport, Oscillator, Envelope, FeedbackDelay, BitCrusher) {

  var audioUtils = new AudioUtils();
  var osc = audioUtils.osc;
  osc.setType("triangle");

/*   // feedback
  var feedbackDelay = new FeedbackDelay("4n");
  feedbackDelay.setFeedback(0.7);
  osc.connect(feedbackDelay);
  feedbackDelay.toMaster(); 
  feedbackDelay.setWet(0.5);  */

   // envelope
  var env = new Envelope(0.2, 0.5, 0.1, 1.5);
  env.connect(osc.output.gain);

  /*// crusher
  var crusher = new BitCrusher(5);
  osc.connect(crusher);
  crusher.toMaster();*/

  osc.toMaster();
  osc.start();

  var canvas = document.getElementById("playfield");
  var ctx = canvas.getContext("2d");

  var lerp = function(start, end, alpha) {
    return start + (end-start) * alpha;
  };

  ////////////////////////////////

  var Bassist = function(netPlayer, name, gameState) {
    this.id = 'bassist';
    this.netPlayer = netPlayer;
    this.netPlayer.sendCmd(this.id, {x:1});
    this.name = name;
    this.gameState = gameState;

    this.numNotes = 4;
    this.notePulsate = new Array(this.numNotes);
    this.time = 0.0;

    for ( var i = 0; i < this.notePulsate.length; i+=1 )
      this.notePulsate[i] = 0.0;

    netPlayer.addEventListener('disconnect', Bassist.prototype.disconnect.bind(this));
    netPlayer.addEventListener('bassist-hit', Bassist.prototype.onHit.bind(this));
  };

  // The player disconnected.
  Bassist.prototype.disconnect = function() {
    this.gameState.onDisconnect(this);
  };

  Bassist.prototype.onHit = function(cmd) {

    var index = cmd.index;
    var channel = 0;
    var numNotes = audioUtils.numNotesInChannel(channel);

    this.notePulsate[index] = 1.0;
    
    // get freq
    var note = audioUtils.getNote(channel, numNotes - index - 1);
    var freq = audioUtils.getFreq(channel, numNotes - index - 1);

    // play the note    
    osc.setFrequency( freq );
    env.triggerAttack();

    // timeout for release
    Transport.setTimeout(function(time){
         env.triggerRelease(1.0);
    }, "16n");
    Transport.start();
  };

  Bassist.prototype.update = function() {
     for ( var i = 0; i < this.notePulsate.length; i+=1 )
        this.notePulsate[i] = lerp( this.notePulsate[i], 0.0, 0.15 );
  };

  Bassist.prototype.draw = function() {

    this.time += 1.0/60.0;

    // params
    var notes = 4;
    var barHeight = ctx.canvas.height * 0.05;
    var barWidth = ctx.canvas.width * 0.6;
    var barMargin = ctx.canvas.height * 0.1;

    var totalHeight = barHeight * notes + barMargin * (notes-1);
    var yStart = ctx.canvas.height*0.5 - totalHeight * 0.5;
    var x = ctx.canvas.width*0.5 - barWidth*0.5;
   
    for ( var i = 0; i < notes; i+=1 )
    {
      var alpha = this.notePulsate[i];
      var currBarHeight = barHeight + alpha * barHeight;
      
      var y0 = yStart + i * (barHeight+barMargin);
      var x0 = x;
      var x1 = x0 + barWidth;
      
      var pulsateAmmount = alpha * currBarHeight;
      
      ctx.beginPath();
      ctx.fillStyle = "#1D0B31";//"rgba(29,11,49," + alpha + ")";
      ctx.fillRect( x, y0 - pulsateAmmount*0.5, barWidth, currBarHeight + pulsateAmmount );
      ctx.closePath();

      // shadow spacing
      y0 += currBarHeight*0.2;

      var deltaScale = 6.0;
      var deltaMovementX = currBarHeight * deltaScale * alpha;
      var deltaMovementY = currBarHeight * deltaScale * alpha * Math.sin(this.time*30);

      var dx0 = x0 + deltaMovementX;
      var dy0 = y0 + deltaMovementY;
      var dx1 = x1 - deltaMovementX;
      var dy1 = y0 - deltaMovementY;

      ctx.strokeStyle = "#018A8B";
      ctx.lineWidth = currBarHeight;

      ctx.beginPath();
      ctx.moveTo(x0,y0);
      ctx.bezierCurveTo(dx0,dy0,dx1,dy1,x1,y0);
      ctx.stroke();
    }
  };

  return Bassist;

});