
"use strict";

// http://www.colourlovers.com/palette/3462660/They_Stole_The_Moon

// Require will call this with GameServer, GameSupport, and Misc once
// gameserver.js, gamesupport.js, and misc.js have loaded.

// Start the main app logic.
requirejs([
    'hft/gameserver',
    'hft/gamesupport',
    'hft/misc/misc',
    './bassist',
    './drummer',
    './synth',
  ]
  , function(GameServer, GameSupport, Misc, Bassist, Drummer, Synth) {
  var statusElem = document.getElementById("status");
  var canvas = document.getElementById("playfield");
  var ctx = canvas.getContext("2d");
  var globals = {
    itemSize: 15,
    //showFPS: true
  };
  Misc.applyUrlSettings(globals);


  var server = new GameServer();
  GameSupport.init(server, globals);

  // roles
  var roles = {
    drummer : { constructor:Drummer, filled:false},
    bassist : { constructor:Bassist, filled:false},
    synth : { constructor:Synth, filled:false},
  };

  var GameState = function() {
    this.roles = roles;
    this.players = [];
  };

  GameState.prototype.onDisconnect = function( musician ) {
    
    var id = musician.id;
    this.roles[id].filled = false;

    console.log("Musician disconnect: " + id);

    var players = this.players;

    for (var ii = 0; ii < players.length; ++ii) {
      var player = players[ii];
      if (player === musician) {
        players.splice(ii, 1);
        return;
      }
    }
  };

  var gameState = new GameState();

  // A new player has arrived.
  server.addEventListener('playerconnect', function(netPlayer, name) {

    // set name
    netPlayer.addEventListener('setName', function(nameObj) {
        netPlayer.name = nameObj.name;
        console.log("Set name: " + name);
    });

    var roleFound = false;

    Object.keys(gameState.roles).forEach(function(key) {

      // quit if already found
      if ( roleFound ) {
        return;
      }

      // found
      var objData = gameState.roles[key];
      if ( !objData.filled )
      {
        console.log("Logging in '" + name + "'' as " + key)
        var constructor = objData.constructor;
        gameState.players.push(new constructor(netPlayer, name, gameState));
        objData.filled = true;
        roleFound = true;
      }
    });

  });

  var render = function() {

    Misc.resize(canvas);
    ctx.fillStyle = "#F8CC8A";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // update/draw for each player
    gameState.players.forEach(function(player) {
      player.update();
      player.draw();
    });
  };
  GameSupport.run(globals, render);
});


