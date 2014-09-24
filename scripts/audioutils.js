"use strict";

define([
  'Tone/source/Oscillator',
	'Tone/core/Tone',
  ], function( Oscillator, Tone ) {

  var notes = [
      [ "D2", "E2", "F2", "A2",],
      [ "F5", "Bb4", "D5", "E5", "F5", "A5", "E6", "F6", "Bb5", "D6", "E6", "F6", "A6", "E7",  ],
  ];

  var numNotesInChannel = function(channel) {
    var channelNotes = notes[channel];
    return channelNotes.length;
  };

  var getNote = function(channel, index) {
    var channelNotes = notes[channel];
  	return channelNotes[index % ( channelNotes.length)];
  };

  var getFreq = function(channel, index) {
  	var note = this.getNote(channel, index);
  	return Tone.prototype.noteToFrequency(note);
  };

  return {
    numNotesInChannel:numNotesInChannel, 
    getNote:getNote, 
    getFreq:getFreq,
  };
});