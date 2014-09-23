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
  ], function(GameServer, GameSupport, Misc, AudioUtils, Master, Note, Transport, Oscillator, Envelope) {

  var audioUtils = new AudioUtils();
  var osc = new Oscillator(440, "square");

   // envelope
  var env = new Envelope(0.5, 0.5, 0.1, 0.5);
  env.connect(osc.output.gain);

  osc.toMaster();
  osc.start();

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

    netPlayer.addEventListener('disconnect', Synth.prototype.disconnect.bind(this));
    netPlayer.addEventListener('synth-move', Synth.prototype.onTouch.bind(this));
  };

  // The player disconnected.
  Synth.prototype.disconnect = function() {
    this.gameState.onDisconnect(this);
  };

  Synth.prototype.onTouch = function(position) {

    osc.setFrequency( 200 + position.x * 300);
    console.log(position);
    //var index = cmd.index;
  };

  Synth.prototype.update = function() {
  };

  Synth.prototype.draw = function() {

    this.time += 1.0/60.0;

  };

  return Synth;

});


