
"use strict";

// Require will call this with GameServer, GameSupport, and Misc once
// gameserver.js, gamesupport.js, and misc.js have loaded.

// Start the main app logic.

define([
	'Tone/source/Oscillator',
  ], function( Oscillator ) {

  var AudioUtils = function() {
    this.notes = ["C3", "E3", "G3", "D3"];
    this.osc = new Oscillator(440, "square");
  };

  AudioUtils.prototype.getNote = function(index) {
  	return this.notes[index % (this.notes.length)];
  };

  AudioUtils.prototype.getFreq = function(index) {
  	var note = this.getNote(index);
  	return this.osc.noteToFrequency(note);
  };

  return AudioUtils;

});


