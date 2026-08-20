const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

class AdbService {
  constructor() {
    const xiaoweiAdb = 'C:\\Program Files (x86)\\xiaowei_android\\tools\\adb.exe';
    const bundledAdb = path.join(__dirname, '../../bin/platform-tools/adb.exe');
    if (fs.existsSync(xiaoweiAdb)) {
      this.adbPath = xiaoweiAdb;
    } else if (fs.existsSync(bundledAdb)) {
      this.adbPath = bundledAdb;
    } else {
      this.adbPath = 'adb';
    }
  }

  runCommand(args) {
    return new Promise((resolve, reject) => {
      execFile(this.adbPath, args, { encoding: 'utf-8' }, (err, stdout, stderr) => {
        if (err && !stdout) {
          return reject(new Error(stderr.trim() || err.message));
        }
        resolve((stdout || '').trim());
      });
    });
  }

  async getDevices() {
    try {
      const output = await this.runCommand(['devices', '-l']);
      const lines = output.split('\n').map(l => l.trim()).filter(Boolean);
      const devices = [];

      for (const line of lines) {
        if (line.startsWith('*') || line.startsWith('List of')) continue;
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const serial = parts[0];
          const status = parts[1];
          const modelMatch = line.match(/model:(\S+)/);
          const deviceMatch = line.match(/device:(\S+)/);
          const model = modelMatch ? modelMatch[1] : (deviceMatch ? deviceMatch[1] : 'Unknown');

          devices.push({
            serial,
            status,
            model: model.replace(/_/g, ' '),
            raw: line
          });
        }
      }
      return devices;
    } catch (err) {
      console.error('Error fetching ADB devices:', err);
      return [];
    }
  }

  async getForwardList() {
    try {
      const output = await this.runCommand(['forward', '--list']);
      const lines = output.split('\n').map(l => l.trim()).filter(Boolean);
      const forwards = [];

      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          forwards.push({
            serial: parts[0],
            local: parts[1],
            remote: parts[2]
          });
        }
      }
      return forwards;
    } catch (err) {
      return [];
    }
  }

  async forwardPort(serial, localPort = 8080, remotePort = 8080) {
    if (!serial) {
      throw new Error('Cần chỉ định Serial của thiết bị');
    }
    const args = ['-s', serial, 'forward', `tcp:${localPort}`, `tcp:${remotePort}`];
    return await this.runCommand(args);
  }
}

module.exports = new AdbService();
