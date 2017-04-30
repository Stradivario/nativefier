import _ from 'lodash';
import async from 'async';
import log from 'loglevel';
import sanitizeFilenameLib from 'sanitize-filename';

import inferOs from './../infer/inferOs';
import normalizeUrl from './normalizeUrl';
import packageJson from './../../package.json';
import { icon, userAgent, name } from './fields';
import { DEFAULT_APP_NAME, ELECTRON_VERSION, PLACEHOLDER_APP_DIR } from './../constants';

const { inferPlatform, inferArch } = inferOs;

function sanitizeFilename(platform, str) {
  let result = sanitizeFilenameLib(str);

  // remove all non ascii or use default app name
  // eslint-disable-next-line no-control-regex
  result = result.replace(/[^\x00-\x7F]/g, '') || DEFAULT_APP_NAME;

  // spaces will cause problems with Ubuntu when pinned to the dock
  if (platform === 'linux') {
    return _.kebabCase(result);
  }
  return result;
}

function sanitizeOptions(options) {
  const name = sanitizeFilename(options.platform, options.name);
  return Object.assign({}, options, { name });
}

/**
 * @callback optionsCallback
 * @param error
 * @param options augmented options
 */

/**
 * Extracts only desired keys from inpOptions and augments it with defaults
 * @param inpOptions
 * @param {optionsCallback} callback
 */
function optionsFactory(inpOptions, callback) {
  const options = {
    dir: PLACEHOLDER_APP_DIR,
    name: inpOptions.name,
    targetUrl: normalizeUrl(inpOptions.targetUrl),
    platform: inpOptions.platform || inferPlatform(),
    arch: inpOptions.arch || inferArch(),
    electronVersion: inpOptions.electronVersion || ELECTRON_VERSION,
    nativefierVersion: packageJson.version,
    out: inpOptions.out || process.cwd(),
    overwrite: inpOptions.overwrite,
    asar: inpOptions.conceal || false,
    icon: inpOptions.icon,
    counter: inpOptions.counter || false,
    width: inpOptions.width || 1280,
    height: inpOptions.height || 800,
    minWidth: inpOptions.minWidth,
    minHeight: inpOptions.minHeight,
    maxWidth: inpOptions.maxWidth,
    maxHeight: inpOptions.maxHeight,
    showMenuBar: inpOptions.showMenuBar || false,
    fastQuit: inpOptions.fastQuit || false,
    userAgent: inpOptions.userAgent,
    ignoreCertificate: inpOptions.ignoreCertificate || false,
    insecure: inpOptions.insecure || false,
    flashPluginDir: inpOptions.flashPath || inpOptions.flash || null,
    inject: inpOptions.inject || null,
    ignore: 'src',
    fullScreen: inpOptions.fullScreen || false,
    maximize: inpOptions.maximize || false,
    hideWindowFrame: inpOptions.hideWindowFrame,
    verbose: inpOptions.verbose,
    disableContextMenu: inpOptions.disableContextMenu,
    disableDevTools: inpOptions.disableDevTools,
    crashReporter: inpOptions.crashReporter,
        // workaround for electron-packager#375
    tmpdir: false,
    zoom: inpOptions.zoom || 1.0,
    internalUrls: inpOptions.internalUrls || null,
    singleInstance: inpOptions.singleInstance || false,
  };

  if (options.verbose) {
    log.setLevel('trace');
  } else {
    log.setLevel('error');
  }

  if (options.flashPluginDir) {
    options.insecure = true;
  }

  if (inpOptions.honest) {
    options.userAgent = null;
  }

  if (options.platform.toLowerCase() === 'windows') {
    options.platform = 'win32';
  }

  if (options.platform.toLowerCase() === 'osx' || options.platform.toLowerCase() === 'mac') {
    options.platform = 'darwin';
  }

  if (options.width > options.maxWidth) {
    options.width = options.maxWidth;
  }

  if (options.height > options.maxHeight) {
    options.height = options.maxHeight;
  }

  async.waterfall([
    (callback) => {
      userAgent(options).then((result) => {
        options.userAgent = result;
        callback();
      }).catch(callback);
    },
    (callback) => {
      icon(options).then((result) => {
        options.icon = result;
        callback();
      });
    },
    (callback) => {
      name(options).then((result) => {
        options.name = result;
      }).then(() => {
        callback();
      });
    },
  ], (error) => {
    if (error) {
      callback(error);
      return;
    }
    callback(null, sanitizeOptions(options));
  });
}

export default optionsFactory;
