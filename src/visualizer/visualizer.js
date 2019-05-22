var readyStateCheckInterval = setInterval(() => {
	if (document.readyState === "complete") {
    clearInterval(readyStateCheckInterval);

    const canvas = document.getElementById('canvas');
    const visualizer = butterchurn.default.createVisualizer(null, canvas , {
      width: 800,
      height: 600,
      mesh_width: 64,
      mesh_height: 48,
      pixelRatio: window.devicePixelRatio || 1,
      textureRatio: 1
    });
    const presets = butterchurnPresets.getPresets();
    const presetKeys = Object.keys(presets);

    visualizer.loadPreset(presets[presetKeys[Math.floor(presetKeys.length * Math.random())]], 0);

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      visualizer.render(request);
      sendResponse();
    });
	}
}, 10);
