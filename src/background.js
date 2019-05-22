const renderWindows = {};
const renderToTabId = {};

chrome.browserAction.onClicked.addListener((tab) => {
  if(!renderWindows[tab.id]) {
    chrome.tabCapture.capture({ audio: true }, (stream) => {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(audioContext.destination);

      renderWindows[tab.id] = true; // so we dont create twice while making tab

      chrome.tabs.create({
        url: chrome.extension.getURL('src/visualizer/index.html'),
        active: false
      }, (renderTab) => {
        chrome.windows.create({
          tabId: renderTab.id,
          type: 'popup',
          focused: true,
          width: 800,
          height: 600
        });

        const analyser = audioContext.createAnalyser();
        analyser.smoothingTimeConstant = 0.0;
        analyser.fftSize = 1024;

        const analyserL = audioContext.createAnalyser();
        analyserL.smoothingTimeConstant = 0.0;
        analyserL.fftSize = 1024;

        const analyserR = audioContext.createAnalyser();
        analyserR.smoothingTimeConstant = 0.0;
        analyserR.fftSize = 1024;

        const splitter = audioContext.createChannelSplitter(2);

        source.connect(analyser);
        source.connect(splitter);
        splitter.connect(analyserL, 0);
        splitter.connect(analyserR, 1);

        let lastTime = +Date.now();

        const intervalId = setInterval(() => {
          const timeByteArray = new Uint8Array(1024);
          const timeByteArrayL = new Uint8Array(1024);
          const timeByteArrayR = new Uint8Array(1024);

          analyser.getByteTimeDomainData(timeByteArray);
          analyserL.getByteTimeDomainData(timeByteArrayL);
          analyserR.getByteTimeDomainData(timeByteArrayR);

          const currentTime = +Date.now();
          const elapsedTime = (currentTime - lastTime) / 1000;
          lastTime = currentTime;

          const renderOpts = {
            elapsedTime: elapsedTime,
            audioLevels: {
              timeByteArray: Array.from(timeByteArray),
              timeByteArrayL: Array.from(timeByteArrayL),
              timeByteArrayR: Array.from(timeByteArrayR)
            }
          };

          chrome.tabs.sendMessage(renderTab.id, renderOpts);
        }, (1000 / 60));

        renderWindows[tab.id] = {
          id: renderTab.id,
          intervalId: intervalId,
          audioContext: audioContext,
          audioSource: source,
          analyser: analyser,
          analyserL: analyserL,
          analyserR: analyserR
        };
        renderToTabId[renderTab.id] = tab.id;
      });
    });
  }
});
