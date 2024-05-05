window.onload = (function () {
  var audioContext;
  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
  } catch (e) {
    alert("Web Audio API is not supported in this browser");
  }
  var errorOscillator = audioContext.createOscillator();
  errorOscillator.type = "triangle";
  errorOscillator.frequency.value = 110;
  errorOscillator.start(0.0);
  var errorNode = audioContext.createGain();
  errorOscillator.connect(errorNode);
  errorNode.gain.value = 0;
  errorNode.connect(audioContext.destination);
  var ramp = 0.1;
  var volume = 0.5;

  var config = {};
  config.buttons = [];
  config.strict = false;
  config.gainNodes = [329.63, 261.63, 220, 164.81] // frequencies
    .map(function (frequency) {
      var oscillator = audioContext.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.start(0.0);
      return oscillator;
    })
    .map(function (oscillator) {
      var gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      gainNode.gain.value = 0;
      return gainNode;
    });

  [].forEach.call(document.getElementsByClassName("button"), function (button, index) {
    button.addEventListener("mousedown", function (event) {
      if (config.on) {
        pushButton(index);
      }
    });
    config.buttons.push(button);
  });
  document.addEventListener("mouseup", function (event) {
    event.stopPropagation();
    stopSound();
  });
  document.getElementById("switch").addEventListener("click", function (event) {
    this.checked ? init() : turnOff();
  });
  document.getElementById("start").addEventListener("click", function (event) {
    if (config.on) gameStart();
  });
  document.getElementById("strict").addEventListener("click", function (event) {
    if (config.on) {
      config.strict = !config.strict;
      config.strict ? config.led.classList.add("active") : config.led.classList.remove("active");
    }
  });

  function gameStart() {
    resetTimers();
    stopSound();
    stopError();
    init();
    flashMessage("--", 1);
    step();
  }

  function setStepTime(stepCount) {
    if (config.stepCount < 4) return 1250;
    if (config.stepCount < 4) return 1000;
    if (config.stepCount < 4) return 750;
    return 500;
  }

  function turnOff() {
    config.on = false;
    config.strict = false;
    config.display.innerHTML = "";
    config.led.classList.remove("active");
    resetTimers();
    stopSound();
    stopError();
  }
  function resetTimers() {
    for (timer in config.timers) {
      clearTimeout(config.timers[timer]);
    }
    for (interval in config.intervals) {
      clearInterval(config.intervals[interval]);
    }
  }

  function step() {
    config.stepTime = setStepTime(config.stepCount++);
    config.timers.handler = setTimeout(playSequence, 500);
  }

  function displayCount(count) {
    config.display.innerHTML = count < 10 ? "0" + count : count;
  }
  function flashMessage(text, times) {
    var count = 0;
    config.display.innerHTML = text;
    var flash = function () {
      config.display.innerHTML = "";
      config.timers.flash = setTimeout(function () {
        config.display.innerHTML = text;
      }, 250);
    };
    flash();
    config.intervals.flash = setInterval(function () {
      flash();
      count++;
      if (count === times) clearInterval(config.intervals.flash);
    }, 500);
  }

  function playSound(index) {
    config.gainNodes[index].gain.linearRampToValueAtTime(volume, audioContext.currentTime + ramp);
    config.buttons[index].classList.add("active");
  }
  function stopSound() {
    config.gainNodes.forEach(function (gainNode) {
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + ramp);
    });
    config.buttons.forEach(function (button) {
      button.classList.remove("active");
    });
  }
  function playError() {
    errorNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + ramp);
  }
  function stopError() {
    errorNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + ramp);
  }
  function notifyError(button) {
    config.lock = true;
    playError();
    if (button) button.classList.add("active");
    config.timers.handler = setTimeout(function () {
      stopError();
      if (button) button.classList.remove("active");
      config.timers.strict = setTimeout(function () {
        if (config.strict) gameStart();
        else playSequence();
      }, 1000);
    }, 1000);
    flashMessage("Ep", 2);
  }
  function notifyWin() {
    var count = 0;
    config.lock = true;
    config.intervals.handler = setInterval(function () {
      playSound(config.lastButton);
      config.timers.handler = setTimeout(stopSound, 80);
      count++;
      if (count === 8) clearInterval(config.intervals.handler);
    }, 160);
    flashMessage(88, 2);
  }

  function playSequence() {
    var i = 0;
    config.index = 0;
    config.intervals.handler = setInterval(function () {
      displayCount(config.stepCount);
      config.lock = true;
      playSound(config.sequence[i++]);
      config.timers.handler = setTimeout(stopSound, config.stepTime / 2 - 10);
      if (i === config.stepCount) {
        clearInterval(config.intervals.handler);
        config.lock = false;
        config.timers.handler = setTimeout(notifyError, 5 * config.stepTime);
      }
    }, config.stepTime);
  }

  function pushButton(index) {
    if (!config.lock) {
      clearTimeout(config.timers.handler);
      if (index === config.sequence[config.index] && config.index < config.stepCount) {
        playSound(index);
        config.lastButton = index;
        config.index++;
        if (config.index < config.stepCount) config.timers.handler = setTimeout(notifyError, 5 * config.stepTime);
        else if (config.index === config.sequence.length) config.timers.handler = setTimeout(notifyWin, config.stepTime);
        else step();
      } else {
        notifyError(config.buttons[index]);
      }
    }
  }

  function init() {
    config.on = true;
    config.display = document.getElementById("display__counter");
    config.led = document.getElementById("strict_led");
    config.display.innerHTML = "--";
    config.lock = true;
    config.stepCount = 0;
    config.index = 0;
    config.sequence = Array.apply(null, Array(20)) //Array(20).fill(0)
      .map(function () {
        return Math.floor(Math.random() * 4 + 0);
      });
    config.timers = {};
    config.intervals = {};
  }
})();
