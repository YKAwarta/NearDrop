const { contextBridge } = require('electron');
const { sendFile } = require('../core/sendFile');


contextBridge.exposeInMainWorld('electron', {
  sendFile: async (filePath, targetIP) => {
    try {
      const result = await sendFile({ filePath, targetIP })
      return result
    } catch (error) {
      return `❌ Error sending file: ${error.message}`;
    }
  },
})
