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
    'Tone/effect/PingPongDelay',
  ], function(GameServer, GameSupport, Misc, AudioUtils, Master, Note, Transport, Oscillator, Envelope, PingPongDelay) {

  var audioUtils = new AudioUtils();
  var osc = audioUtils.osc;
  osc.setType("sine");

  // feedback
  var feedbackDelay = new PingPongDelay("8n");
  feedbackDelay.setFeedback(0.7);
  osc.connect(feedbackDelay);
  feedbackDelay.toMaster(); 
  feedbackDelay.setWet(0.5);  

   // envelope
  //var env = new Envelope(0.5, 0.5, 0.1, 0.5);
  //env.connect(osc.output.gain);

  //osc.setVolume(-30);
  osc.toMaster();

  var canvas = document.getElementById("playfield");
  var ctx = canvas.getContext("2d");

  var lerp = function(start, end, alpha) {
    return start + (end-start) * alpha;
  };

  ////////////////////////////////

  var Synth = function(netPlayer, name, gameState) {
    this.id = 'synth';
    this.netPlayer = netPlayer;
    this.netPlayer.sendCmd(this.id, {x:1});
    this.name = name;
    this.gameState = gameState;
    this.time = 0.0;
    this.volume = 0.0;
    this.position = {x:0, y:0};

    osc.start();
    this.setVolume(this.volume);

    netPlayer.addEventListener('disconnect', Synth.prototype.disconnect.bind(this));
    netPlayer.addEventListener('synth-move', Synth.prototype.onTouch.bind(this));

    Transport.setLoopEnd("1m");
    Transport.loop = true;
    Transport.setInterval(function(time){
      var index = Math.floor( Math.random() * audioUtils.numNotesInChannel(1) );
      var freq = audioUtils.getFreq( 1, index );
      osc.setFrequency(freq);
    }, "8n");

    Transport.start();
  };

  Synth.prototype.setVolume = function(volume) {
    var vol = lerp( -100, -35, volume );
    osc.setVolume(vol);
  }

  // The player disconnected.
  Synth.prototype.disconnect = function() {
    osc.stop();
    this.gameState.onDisconnect(this);
  };

  Synth.prototype.onTouch = function(position) {

    this.volume = 1.0;
    this.position.x = position.x;
    this.position.y = position.y;
  };

  Synth.prototype.update = function() {
    this.volume = lerp( this.volume, 0.0, 0.02 );
    this.setVolume(this.volume);
  };

  Synth.prototype.draw = function() {

    this.time += 1.0/60.0;

    var posX = this.position.x * ctx.canvas.width;
    var posY = this.position.y * ctx.canvas.height;
    var minCanvasWidth = Math.min( ctx.canvas.width, ctx.canvas.height );

    var radius = minCanvasWidth * 0.05;// * this.volume;

    ctx.beginPath();
    ctx.arc(posX, posY, radius, 0, 2 * Math.PI, false );
    ctx.strokeStyle = 'white';
    ctx.lineWidth = minCanvasWidth * 0.05 * this.volume * this.volume;
    ctx.stroke();
  };

  return Synth;

});


