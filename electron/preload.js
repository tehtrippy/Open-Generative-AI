const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronRuntime', {
    isElectron: true,
});
