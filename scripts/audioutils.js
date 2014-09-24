
"use strict";

// Require will call this with GameServer, GameSupport, and Misc once
// gameserver.js, gamesupport.js, and misc.js have loaded.

// Start the main app logic.

define([
	'Tone/source/Oscillator',
  ], function( Oscillator ) {

  var AudioUtils = function() {
    this.notes = [
      [ "D2", "F2", "A2", "E3"],
      [ "D4", "E4", "F4", "A4", "E5", "F5", "Bb4", "D5", "E5", "F5", "A5", "E6", "F6", "Bb5" ],
    ];
    this.osc = new Oscillator(440, "square");
  };

  AudioUtils.prototype.numNotesInChannel = function(channel) {
    var channelNotes = this.notes[channel];
    return channelNotes.length;
  };

  AudioUtils.prototype.getNote = function(channel, index) {
    var channelNotes = this.notes[channel];
  	return channelNotes[index % ( channelNotes.length)];
  };

  AudioUtils.prototype.getFreq = function(channel, index) {
  	var note = this.getNote(channel, index);
  	return this.osc.noteToFrequency(note);
  };

  return AudioUtils;

});


