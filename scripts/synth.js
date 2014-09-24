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
    'Tone/effect/PingPongDelay',
  ], function(GameServer, GameSupport, Misc, MathUtils, AudioUtils, Master, Note, Transport, Oscillator, Envelope, PingPongDelay) {

  var canvas = document.getElementById("playfield");
  var ctx = canvas.getContext("2d");

  var Synth = function(netPlayer, name, gameState) {
    this.id = 'synth';
    this.netPlayer = netPlayer;
    this.netPlayer.sendCmd(this.id, {x:1});
    this.name = name;
    this.gameState = gameState;
    this.time = 0.0;
    this.volume = 0.0;
    this.position = {x:0, y:0};
    this.dt = 1.0 / 60.0;

    this.osc = new Oscillator(440, "sine");

    // feedback
    var feedbackDelay = new PingPongDelay("8n");
    feedbackDelay.setFeedback(0.7);
    this.osc.connect(feedbackDelay);
    feedbackDelay.toMaster(); 
    feedbackDelay.setWet(0.5);  

    this.osc.toMaster();
    this.osc.start();

    this.setVolume(this.volume);

    netPlayer.addEventListener('disconnect', Synth.prototype.disconnect.bind(this));
    netPlayer.addEventListener('synth-move', Synth.prototype.onTouch.bind(this));

    // schedule to hit a range of notes in scale
    this.transportId = Transport.setInterval( function(time) {

      var posYRange = 0.2;
      var channel = 1;

      var posY = 1.0 - this.position.y;
      var posYmin = MathUtils.clamp( posY - posYRange*0.5 ); 
      var posYmax = MathUtils.clamp( posY + posYRange*0.5 ); 

      var numNotes = AudioUtils.numNotesInChannel(channel);
      var noteMin = Math.floor( posYmin * numNotes );
      var noteMax = Math.floor( posYmax * numNotes );
      var noteIndex = MathUtils.randInt( noteMin, noteMax );

      var freq = AudioUtils.getFreq( channel, noteIndex );
      this.osc.setFrequency(freq);
    }.bind(this), "8n");

    Transport.start();

    this.initParticles();
  };

  Synth.prototype.initParticles = function() {
    var numParticles = 32;
    this.particles = new Array(numParticles);
    this.particleIndex = 0;
    this.emitTimer = 0.0;

    for ( var i = 0; i < this.particles.length; i+=1 )
    {
      this.particles[i] = 
      {
        posX: 0.0,
        posY: 0.0,
        dirX: 0.0,
        dirY: 0.0,
        radius0: 0.0,
        radius1: 0.0,
        time:1.0,
        timeMax:1.0,        
      };
    }
  };

  Synth.prototype.emitParticleAt = function(posX, posY) {
    var minCanvasWidth = Math.min( ctx.canvas.width, ctx.canvas.height );
    var angle = MathUtils.randFloat( 0, 2.0 * Math.PI );
    var speed = MathUtils.randFloat( 50, 180 );

    // init properties
    var p = this.particles[ this.particleIndex ];
    p.time = 0.0;
    p.timeMax = MathUtils.randFloat( 0.8, 1.5 );
    p.dirX = Math.cos(angle) * speed;
    p.dirY = Math.sin(angle) * speed;
    p.posX = posX;
    p.posY = posY;
    p.radius0 = MathUtils.randFloat( minCanvasWidth*0.01, minCanvasWidth*0.05 );
    p.radius1 = 0.0;

    // next index
    this.particleIndex = (this.particleIndex+1)%this.particles.length;
  };

  Synth.prototype.updateParticles = function() {
    var dt = this.dt;
    
    for ( var i = 0; i < this.particles.length; i+=1 )
    {
      var p = this.particles[i];

      // move it
      p.time += dt;
      p.posX += p.dirX * dt;
      p.posY += p.dirY * dt;

      // slow it down
      p.dirX = MathUtils.lerp(p.dirX, 0.0, 0.02 );
      p.dirY = MathUtils.lerp(p.dirY, -50.0, 0.01 );
    }
  };

  Synth.prototype.drawParticles = function() {

    ctx.fillStyle = "#1D0B31";

    for ( var i = 0; i < this.particles.length; i+=1 )
    {
      var p = this.particles[i];
      var alpha = (p.time / p.timeMax);

      if ( alpha < 1.0 )
      {
        var radius = MathUtils.lerp( p.radius0, p.radius1, alpha );
        var posX = p.posX;
        var posY = p.posY;

        ctx.beginPath();
        ctx.arc(posX, posY, radius, 0, 2 * Math.PI, false );
        ctx.fill();
      }
    }
  };

  Synth.prototype.setVolume = function(volume) {
    var vol = MathUtils.lerp( -100, -35, volume );
    this.osc.setVolume(vol);
  }

  // The player disconnected.
  Synth.prototype.disconnect = function() {
    this.release();
    this.gameState.onDisconnect(this);
  };

  Synth.prototype.release = function() {
    Transport.clearInterval( this.transportId );
    this.osc.stop();
    this.osc.dispose();
  };

  Synth.prototype.onTouch = function(position) {
    if ( this.emitTimer <= 0.0 )
    {
      this.emitTimer = 0.02;
      this.emitParticleAt( position.x * ctx.canvas.width, position.y * ctx.canvas.height );
    }

    this.volume = MathUtils.lerp( this.volume, 1.0, 0.2 );
    this.position.x = position.x;
    this.position.y = position.y;
  };

  Synth.prototype.update = function() {

    this.time += this.dt;
    this.emitTimer -= this.dt;
    this.updateParticles();
    this.volume = MathUtils.lerp( this.volume, 0.0, 0.02 );
    this.setVolume(this.volume);
  };

  Synth.prototype.draw = function() {

    this.drawParticles();

    if ( this.volume < 0.01 )
      return;

    var posX = this.position.x * ctx.canvas.width;
    var posY = this.position.y * ctx.canvas.height;
    var minCanvasWidth = Math.min( ctx.canvas.width, ctx.canvas.height );

    var radiusOuter = minCanvasWidth * (0.03 +  (1.0 - this.volume)*0.2 );
    var radiusInner = minCanvasWidth * (0.03) * this.volume;

    ctx.beginPath();
    ctx.arc(posX, posY, radiusOuter, 0, 2 * Math.PI, false );
    ctx.strokeStyle = 'white';
   
    ctx.lineWidth = minCanvasWidth * 0.07 * Math.pow(this.volume,3.0);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(posX, posY, radiusInner, 0, 2 * Math.PI, false );
    ctx.fillStyle = "#FFA100";
    ctx.fill();
  };

  return Synth;
});