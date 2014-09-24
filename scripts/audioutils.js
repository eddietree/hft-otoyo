"use strict";

define([
	'Tone/source/Oscillator',
  ], function( Oscillator ) {

  var AudioUtils = function() {
    this.notes = [
      [ "D2", "E2", "F2", "A2",],
      [ "F5", "Bb4", "D5", "E5", "F5", "A5", "E6", "F6", "Bb5", "D6", "E6", "F6", "A6", "E7",  ],
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