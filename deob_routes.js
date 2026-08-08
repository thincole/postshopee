const fs = require('fs');

try {
  const code = fs.readFileSync('./src/routes/video.routes.js', 'utf8');

  const startRemoveIndex = code.indexOf('const express');
  const endRemoveIndex = code.indexOf("module['exports']=router;");

  if (startRemoveIndex === -1 || endRemoveIndex === -1) {
    throw new Error('Could not find start/end marks in video.routes.js');
  }

  const decrypterCode = code.substring(0, startRemoveIndex) + '\n' + code.substring(endRemoveIndex);

  const vm = require('vm');
  const context = { console, module: { exports: {} }, exports: {}, router: {} };
  vm.createContext(context);

  vm.runInContext(decrypterCode, context);

  const decrypt = context.a0_0x71ea;
  if (!decrypt) {
    throw new Error('a0_0x71ea not found in VM context');
  }

  const fnNames = ['a0_0x30d0bf', '_0x228f69', '_0x1c9a29', '_0x478998', 'a0_0x71ea'];
  let deobbedCode = code;

  for (const fnName of fnNames) {
    const regex = new RegExp(fnName + '\\((0x[0-9a-fA-F]+)\\)', 'g');
    deobbedCode = deobbedCode.replace(regex, (match, hex) => {
      try {
        const val = decrypt(parseInt(hex));
        return JSON.stringify(val);
      } catch (e) {
        return match;
      }
    });
  }

  deobbedCode = deobbedCode.replace(/\\x([0-9a-fA-F]{2})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  // Basic formatting
  let formatted = deobbedCode
    .replace(/;/g, ';\n')
    .replace(/{/g, ' {\n')
    .replace(/}/g, '\n}\n')
    .replace(/const /g, '\nconst ')
    .replace(/let /g, '\nlet ')
    .replace(/function /g, '\nfunction ')
    .replace(/router\./g, '\nrouter.')
    .replace(/if \(/g, '\nif (')
    .replace(/try {/g, '\ntry {\n')
    .replace(/catch \(/g, '\n} catch (')
    .replace(/async \(/g, 'async (')
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

  let indent = 0;
  const lines = formatted.split('\n');
  formatted = lines.map(line => {
    if (line.startsWith('}')) indent = Math.max(0, indent - 2);
    const space = ' '.repeat(indent);
    if (line.endsWith('{') || line.endsWith('=> {')) indent += 2;
    return space + line;
  }).join('\n');

  fs.writeFileSync('./deobbed_video_routes.js', formatted);
  console.log('Deobfuscation successful!');
} catch (err) {
  console.error(err);
}
