'use strict';

const common = require('../common');

if (common.isIBMi)
  common.skip('IBMi does not support `fs.watch()`');

// fs-watch on folders have limited capability in AIX.
// The testcase makes use of folder watching, and causes
// hang. This behavior is documented. Skip this for AIX.

if (common.isAIX)
  common.skip('folder watch capability is limited in AIX.');

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const tmpdir = require('../common/tmpdir');
const testDir = tmpdir.path;
tmpdir.refresh();

// A watched subfolder that is removed and created again under the same name
// keeps being watched, like the output folder of a code generator.

const rootDirectory = fs.mkdtempSync(testDir + path.sep);
const folder = path.join(rootDirectory, 'generated');
fs.mkdirSync(folder);
fs.writeFileSync(path.join(folder, 'a.txt'), 'old');

const childRelativePath = path.join('generated', 'b.txt');
let watcherClosed = false;

const watcher = fs.watch(rootDirectory, { recursive: true });
const giveUp = setTimeout(() => watcher.close(), common.platformTimeout(5000));
watcher.on('change', common.mustCallAtLeast((event, filename) => {
  if (filename === childRelativePath) {
    clearTimeout(giveUp);
    watcher.close();
    watcherClosed = true;
  }
}));

// Do the writes with a delay to ensure that the OS is ready to notify us.
setTimeout(() => {
  fs.rmSync(folder, { recursive: true });
  fs.mkdirSync(folder);
  setTimeout(() => {
    fs.writeFileSync(path.join(folder, 'b.txt'), 'new');
  }, common.platformTimeout(200));
}, common.platformTimeout(200));

process.once('exit', function() {
  assert(watcherClosed, 'no event for a file in the recreated folder');
});
