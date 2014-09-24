"use strict";

// Start the main app logic.
requirejs([
    'hft/commonui',
    'hft/gameclient',
    'hft/misc/input',
    'hft/misc/misc',
    'hft/misc/mobilehacks',
    'hft/misc/touch',
  ], function(
    CommonUI,
    GameClient,
    Input,
    Misc,
    MobileHacks,
    Touch) {

  var globals = {
    debug: false,
  };
  Misc.applyUrlSettings(globals);
  MobileHacks.fixHeightHack();

  var statusElem = document.getElementById("gamestatus");
  var client = new GameClient();

  // Note: CommonUI handles these events for almost all the samples.
  var onConnect = function() {
    //statusElem.style.backgroundColor = "green";
  };

  var onDisconnect = function() {
    //statusElem.style.backgroundColor = "red";
    //statusElem.innerHTML = "you were disconnected from happyFunTimes";
  }

  // Because I want the CommonUI to work
  globals.disconnectFn = onDisconnect;
  globals.connectFn = onConnect;

  CommonUI.setupStandardControllerUI(client, globals);

  var randInt = function(range) {
    return Math.floor(Math.random() * range);
  };

  /////////////////////////////////////////////
  // bassist
  /////////////////////////////////////////////
  function initBassist() {

    document.getElementById("bassist").style.display = "block";

    var buttonsElem = document.getElementById("bassist-buttons");
    var buttons = buttonsElem.children;
    for ( var i = 0; i < buttons.length; i+=1 )
    {
      var button = buttons[i];
      button.index = i;
      button.style.cursor = "pointer";

      button.addEventListener("pointerdown", function(event) {
        var index = this.index;
        client.sendCmd('bassist-hit', {
          index: index
        });
        
        console.log("hit bass index: " + index);
      });
    }

     /*setInterval( function() {
        client.sendCmd('bassist-hit', {
          index: 1,
        });

    }, 500);*/
  };

  /////////////////////////////////////////////
  // drummer
  /////////////////////////////////////////////
  function initDrummer() {
    document.body.style.backgroundColor = "#018A8B";
    document.body.style.borderTop = "1em solid #15305D";
    document.body.style.borderBottom = "1em solid #15305D";
    document.getElementById("drummer").style.display = "block";

    var buttonsElem = document.getElementById("drummer-buttons");
    var buttons = buttonsElem.children;
    for ( var i = 0; i < buttons.length; i+=1 )
    {
      var button = buttons[i];
      button.index = i;
      button.style.cursor = "pointer";

      button.addEventListener("pointerdown", function(event) {
        var index = this.index;
        client.sendCmd('drummer-hit', {
          index: index
        });
        
        console.log("hit bass index: " + index);
      });
    }

    /*setInterval( function() {
        client.sendCmd('drummer-hit', {
          index: 1,
        });

    }, 500);*/
  };

  /////////////////////////////////////////////
  // synth
  /////////////////////////////////////////////
  function initSynth() {

    var sendMoveCmd = function(position, target) {
      
      client.sendCmd('synth-move', {
        x: position.x / target.clientWidth,
        y: position.y / target.clientHeight,
      });
    };

    document.getElementById("synth").style.display = "block";
    var inputElem = document.getElementById("synth-input-pad");
    inputElem.style.cursor = "pointer";

    // Send a message to the game when the screen is touched
    inputElem.addEventListener('pointermove', function(event) {
      var position = Input.getRelativeCoordinates(event.target, event);
    
      sendMoveCmd(position, event.target);
      event.preventDefault();
    });

  };

  /////////////////////////////////////////////
  // full room
  /////////////////////////////////////////////
  function initFullroom() {
    document.getElementById("fullroom").style.display = "block";
  };

  /////////////////////////////////////////////

  // init listeners
  client.addEventListener( "bassist",   function(event) { initBassist(); } );
  client.addEventListener( "drummer",   function(event) { initDrummer(); } );
  client.addEventListener( "synth",     function(event) { initSynth(); } );
  client.addEventListener( "fullroom",  function(event) { initFullroom(); } );

});