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
    'Tone/source/Player',
  ], function(GameServer, GameSupport, Misc, AudioUtils, Master, Note, Transport, Oscillator, Envelope, Player) {

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

  var smoothstep = function(edge0, edge1, x)
  {
      // Scale, bias and saturate x to 0..1 range
      x = Math.min(Math.max((x - edge0)/(edge1 - edge0), 0.0), 1.0); 
      // Evaluate polynomial
      return x*x*(3 - 2*x);
  }

  ////////////////////////////////

  var Drummer = function(netPlayer, name, gameState) {
    this.id = 'drummer';
    this.netPlayer = netPlayer;
    this.netPlayer.sendCmd(this.id, {x:1});
    this.name = name;
    this.gameState = gameState;

    this.samples = 
    [
      new Player("./audio/kick_strong.wav"),
      new Player("./audio/snare.wav"),
      new Player("./audio/snap.wav"),
      new Player("./audio/chord_nice.wav"),
    ];

    this.numNotes = this.samples.length;
    this.notePulsate = new Array(this.numNotes);

    for( var i = 0; i < this.samples.length; i+=1)
    {
      this.samples[i].toMaster();
      this.notePulsate[i] = 0.0;
    }

    netPlayer.addEventListener('disconnect', Drummer.prototype.disconnect.bind(this));
    netPlayer.addEventListener('drummer-hit', Drummer.prototype.onHit.bind(this));
  };

  // The player disconnected.
  Drummer.prototype.disconnect = function() {
    this.gameState.onDisconnect(this);
  };

  Drummer.prototype.onHit = function(cmd) {

    var index = cmd.index;
    this.notePulsate[index] = 1.0;
    this.samples[index].stop();
    this.samples[index].start();
  };

  Drummer.prototype.update = function() {
     for ( var i = 0; i < this.notePulsate.length; i+=1 )
        this.notePulsate[i] = lerp( this.notePulsate[i], 0.0, 0.1 );
  };

  Drummer.prototype.draw = function() {

    var centerX = ctx.canvas.width*0.5;
    var centerY = ctx.canvas.height*0.5;
    var minCanvasWidth = Math.min( ctx.canvas.width, ctx.canvas.height );

    // kick
    if ( this.notePulsate[0] > 0.01 )
    {
      // drummer kick visual
      var kickMinSideWidth = minCanvasWidth*0.55;
      var kickLineWidth = this.notePulsate[0] * kickMinSideWidth * 0.3;
      var kickRadius = kickMinSideWidth * (0.6 + this.notePulsate[0]*0.2 ) - kickLineWidth;

      // draw kick
      ctx.beginPath();
      ctx.arc(centerX, centerY, kickRadius, 0, 2 * Math.PI, false);
      ctx.strokeStyle = '#FFA100';
      ctx.lineWidth = kickLineWidth;
      ctx.stroke();
      ctx.closePath();
    }

    // snare
    if ( this.notePulsate[1] > 0.01 )
    {
      var alpha = this.notePulsate[1];
      var boxDimen = minCanvasWidth*0.04;
      var boxMargin = minCanvasWidth*0.1;
      var boxTotalWidth = ctx.canvas.width*0.7;
      var boxTotalHeight = ctx.canvas.height*0.8;
      var posOffset = (boxMargin+boxDimen) * 0.5;

      var currBoxDimen = boxDimen  * (1.0-alpha);
      var posOffsetX = ctx.canvas.width*0.5 - boxTotalWidth*0.5 - currBoxDimen*0.5 + posOffset;
      var posOffsetY = ctx.canvas.height*0.5 - boxTotalHeight*0.5 - currBoxDimen*0.5 + posOffset;

      var numBoxX = Math.floor( boxTotalWidth / (boxDimen+boxMargin) );
      var numBoxY = Math.floor( boxTotalHeight / (boxDimen+boxMargin) );

      // line style
      ctx.strokeStyle = 'white';
      ctx.lineWidth = alpha*boxDimen*2.0;

      for ( var x = 0; x <= numBoxX; x+=1 )
      {
        var posX = posOffsetX + x * (boxDimen + boxMargin);

        for ( var y = 0; y <= numBoxY; y+=1 )
        {
          var posY = posOffsetY + y * (boxDimen + boxMargin);
          ctx.strokeRect(posX,posY, currBoxDimen, currBoxDimen);
        }
      }
    }

    // snap
    if ( this.notePulsate[2] > 0.01 )
    {
      var alpha = this.notePulsate[2];
      var numLines = 8;
      var deltaAngle = 2.0 * Math.PI / numLines;

      var radius0 = minCanvasWidth * lerp( 0.45, 0.4, alpha );
      var radius1 = lerp( radius0, radius0*0.6, alpha);

      ctx.strokeStyle = 'black';
      ctx.lineWidth = minCanvasWidth * lerp( 0.02, 0.05, alpha );
      
      for ( var i = 0; i < numLines; i+=1 )
      {
          var angle = deltaAngle * i;
          var dirX = Math.cos(angle);
          var dirY = Math.sin(angle);

          var x0 = centerX + dirX * radius0;
          var y0 = centerY + dirY * radius0;
          var x1 = centerX + dirX * radius1;
          var y1 = centerY + dirY * radius1;

          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
      }
    }

    // chord_filter
    if ( this.notePulsate[3] > 0.01 )
    {
      var alpha = this.notePulsate[3];

      ctx.strokeStyle = "#15305D";
      ctx.lineWidth = minCanvasWidth*0.1 * alpha;
      ctx.strokeRect(0,0, ctx.canvas.width, ctx.canvas.height);
    }
  };

  return Drummer;

});


