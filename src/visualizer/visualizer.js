var readyStateCheckInterval = setInterval(() => {
	if (document.readyState === "complete") {
    clearInterval(readyStateCheckInterval);

    const noAudioOverlay = document.getElementById('noAudioOverlay');
    const canvas = document.getElementById('canvas');
    const visualizer = butterchurn.default.createVisualizer(null, canvas , {
      width: 800,
      height: 600,
      mesh_width: 64,
      mesh_height: 48,
      pixelRatio: window.devicePixelRatio || 1,
      textureRatio: 1
    });
    visualizer.loadExtraImages(butterchurnExtraImages.default.getImages());

    const presets = Object.assign({},
                                  butterchurnPresets.getPresets(),
                                  butterchurnPresetsExtra.getPresets(),
                                  butterchurnPresetsExtra2.getPresets());
    const presetKeys = Object.keys(presets);
    const presetIndexHist = [];
    let nextPreset, prevPreset, restartCycleInterval, cycleInterval;

    const setVisualizerSize = () => {
      const vizWidth = window.innerWidth;
      const vizHeight = window.innerHeight;

      canvas.width = vizWidth;
      canvas.height = vizHeight;
      visualizer.setRendererSize(vizWidth, vizHeight);

      noAudioOverlay.style.width = `${vizWidth}px`;
      noAudioOverlay.style.height = `${vizHeight}px`;
    };

    nextPreset = (blendTime) => {
      const presetIdx = presets[presetKeys[Math.floor(presetKeys.length * Math.random())]];
      presetIndexHist.push(presetIdx);
      visualizer.loadPreset(presetIdx, blendTime);
      restartCycleInterval();
    };

    prevPreset = (blendTime) => {
      let presetIdx;
      if (presetIndexHist.length > 0) {
        presetIndexHist.pop();

        if (presetIndexHist.length > 0) {
          presetIdx = presetIndexHist[presetIndexHist.length - 1];
        } else {
          presetIdx = presets[presetKeys[Math.floor(presetKeys.length * Math.random())]];
        }
      } else {
        presetIdx = presets[presetKeys[Math.floor(presetKeys.length * Math.random())]];
      }

      visualizer.loadPreset(presetIdx, blendTime);
      restartCycleInterval();
    };

    restartCycleInterval = () => {
      if (cycleInterval) {
        clearInterval(cycleInterval);
      }

      cycleInterval = setInterval(() => {
        nextPreset(2.7);
      }, 15000);
    };

    setVisualizerSize();
    nextPreset(0);

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'startRendering') {
        noAudioOverlay.style.display = 'none';
      } else if (request.type === 'stopRendering') {
        noAudioOverlay.style.display = 'flex';
      } else if (request.type === 'audioData') {
        visualizer.render(request.data);
      }

      sendResponse();
    });

    document.addEventListener('keydown', (e) => {
      if (e.which === 32 || e.which === 39) { // SPACE or ->
        nextPreset(5.7);
      } else if (e.which === 8 || e.which === 37) { // BACKSPACE or <-
        prevPreset(0);
      } else if (e.which === 72) { // H
        nextPreset(0);
      }
    });

    window.addEventListener('resize', () => {
      setVisualizerSize();
    });
	}
}, 10);
