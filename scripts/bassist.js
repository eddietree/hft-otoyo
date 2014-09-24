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
    './mathutils',
    './audioutils',
    'Tone/core/Master',
    'Tone/core/Note',
    'Tone/core/Transport',
    'Tone/source/Oscillator',
    'Tone/component/Envelope',
    'Tone/effect/FeedbackDelay',
    'Tone/effect/BitCrusher',
  ], function(GameServer, GameSupport, Misc, MathUtils, AudioUtils, Master, Note, Transport, Oscillator, Envelope, FeedbackDelay, BitCrusher) {

  var canvas = document.getElementById("playfield");
  var ctx = canvas.getContext("2d");

  ////////////////////////////////

  var Bassist = function(netPlayer, name, gameState) {
    this.id = 'bassist';
    this.netPlayer = netPlayer;
    this.netPlayer.sendCmd(this.id, {x:1});
    this.name = name;
    this.gameState = gameState;

    this.osc = new Oscillator(440, "triangle");

    // envelope
    this.env = new Envelope(0.2, 0.5, 0.1, 1.5);
    this.env.connect(this.osc.output.gain);

    this.osc.toMaster();
    this.osc.start();

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
    this.release();
  };

  Bassist.prototype.release = function() {

    this.env.disconnect();
    this.env.dispose();
    this.env = null;

    this.osc.stop();
    this.osc.dispose();
    this.osc = null;
  };

  Bassist.prototype.onHit = function(cmd) {

    var index = cmd.index;
    var channel = 0;
    var numNotes = AudioUtils.numNotesInChannel(channel);

    this.notePulsate[index] = 1.0;
    
    // get freq
    var note = AudioUtils.getNote(channel, numNotes - index - 1);
    var freq = AudioUtils.getFreq(channel, numNotes - index - 1);

    // play the note    
    this.osc.setFrequency( freq );
    this.env.triggerAttack();

    // timeout for release
    Transport.setTimeout(function(time){
        if ( this.env != null ) {
          this.env.triggerRelease(1.0);
        }
    }.bind(this), "16n");
    Transport.start();
  };

  Bassist.prototype.update = function() {
     for ( var i = 0; i < this.notePulsate.length; i+=1 )
        this.notePulsate[i] = MathUtils.lerp( this.notePulsate[i], 0.0, 0.15 );
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