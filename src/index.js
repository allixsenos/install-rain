import core from '@actions/core' // docs: https://github.com/actions/toolkit/tree/main/packages/core
import tc from '@actions/tool-cache' // docs: https://github.com/actions/toolkit/tree/main/packages/tool-cache
import io from '@actions/io' // docs: https://github.com/actions/toolkit/tree/main/packages/io
import cache from '@actions/cache' // docs: https://github.com/actions/toolkit/tree/main/packages/cache
import exec from '@actions/exec' // docs: https://github.com/actions/toolkit/tree/main/packages/exec
import path from 'path'
import os from 'os'
import http from '@actions/http-client' // https://github.com/actions/toolkit/tree/main/packages/http-client

// read action inputs
const input = {
  version: core.getInput('version', {required: true}).replace(/^[vV]/, ''), // strip the 'v' prefix
}

// main action entrypoint
async function runAction() {
  let version

  if (input.version.toLowerCase() === 'latest') {
    core.debug('Requesting latest Rain version...')
    version = await getLatestVersion()
    core.debug(`Latest version: ${version}`)
  } else {
    version = input.version
  }

  core.startGroup('Install Rain')
  await doInstall(version)
  core.endGroup()

  core.startGroup('Installation check')
  await doCheck()
  core.endGroup()
}

/**
 * @param {string} version
 *
 * @returns {Promise<void>}
 *
 * @throws {Error}
 */
async function doInstall(version) {
  const pathToInstall = path.join(os.tmpdir(), `rain-${version}`)
  const cacheKey = `rain-cache-${version}-${process.platform}-${process.arch}`

  core.info(`Version to install: ${version} (target directory: ${pathToInstall})`)

  /** @type {string|undefined} */
  let restoredFromCache = undefined

  try {
    restoredFromCache = await cache.restoreCache([pathToInstall], cacheKey)
  } catch (e) {
    core.warning(e)
  }

  if (restoredFromCache) { // cache HIT
    core.info(`Rain restored from cache`)
  } else { // cache MISS
    const distUri = getDistUrl(process.platform, process.arch, version)
    const distPath = await tc.downloadTool(distUri)
    const pathToUnpack = path.join(os.tmpdir(), `rain.tmp`)

    // Rain releases are all .zip files
    await tc.extractZip(distPath, pathToUnpack)

    // Rain binaries are inside a subdirectory named like rain-v{version}_{platform}-{arch}
    const subDir = getDistSubdir(process.platform, process.arch, version)
    const binName = process.platform === 'win32' ? 'rain.exe' : 'rain'

    await io.mkdirP(pathToInstall)
    await io.mv(path.join(pathToUnpack, subDir, binName), path.join(pathToInstall, binName))

    await io.rmRF(distPath)

    try {
      await cache.saveCache([pathToInstall], cacheKey)
    } catch (e) {
      core.warning(e)
    }
  }

  core.addPath(pathToInstall)
}

/**
 * @returns {Promise<void>}
 *
 * @throws {Error} If binary file not found in $PATH or version check failed
 */
async function doCheck() {
  const binPath = await io.which('rain', true)

  if (binPath === '') {
    throw new Error('rain binary file not found in $PATH')
  }

  await exec.exec('rain', ['--version'], {silent: true})

  core.setOutput('rain-bin', binPath)
  core.info(`Rain installed: ${binPath}`)
}

/**
 * @returns {Promise<string>}
 */
async function getLatestVersion() {
  // use the "magic" GitHub link to get the latest release tag (it returns a 302 redirect with the tag in
  // the location header). this "hack" allows us to avoid the GitHub API rate limits
  const resp = await new http.HttpClient('allixsenos/install-rain', undefined, {
    allowRedirects: false,
  }).get('https://github.com/aws-cloudformation/rain/releases/latest')

  if (resp.message.statusCode !== 302) {
    throw new Error(`Failed to fetch latest version: ${resp.message.statusCode} ${resp.message.statusMessage}`)
  }

  const location = resp.message.headers.location.replace(/^https?:\/\//, '')
  const parts = location.split('/')

  if (parts.length < 6) {
    throw new Error(`Invalid redirect URL: ${location}`)
  }

  const tag = parts[5]

  return tag.replace(/^[vV]/, '') // strip the 'v' prefix
}

/**
 * Get the subdirectory name inside the zip file
 *
 * @param {('linux'|'darwin'|'win32')} platform
 * @param {('x32'|'x64'|'arm'|'arm64')} arch
 * @param {string} version E.g.: `1.24.2`
 *
 * @returns {string}
 */
function getDistSubdir(platform, arch, version) {
  const platformName = platform === 'win32' ? 'windows' : platform
  let archName

  switch (arch) {
    case 'x64':
      archName = 'amd64'
      break
    case 'x32':
      archName = 'i386'
      break
    case 'arm64':
      archName = 'arm64'
      break
    case 'arm':
      archName = 'arm'
      break
    default:
      archName = arch
  }

  return `rain-v${version}_${platformName}-${archName}`
}

/**
 * @link https://github.com/aws-cloudformation/rain/releases
 *
 * @param {('linux'|'darwin'|'win32')} platform
 * @param {('x32'|'x64'|'arm'|'arm64')} arch
 * @param {string} version E.g.: `1.24.2`
 *
 * @returns {string}
 *
 * @throws {Error} Unsupported platform or architecture
 */
function getDistUrl(platform, arch, version) {
  const baseUrl = `https://github.com/aws-cloudformation/rain/releases/download/v${version}`

  switch (platform) {
    case 'linux': {
      switch (arch) {
        case 'x64': // Amd64
          return `${baseUrl}/rain-v${version}_linux-amd64.zip`

        case 'arm64':
          return `${baseUrl}/rain-v${version}_linux-arm64.zip`

        case 'arm':
          return `${baseUrl}/rain-v${version}_linux-arm.zip`

        case 'x32':
          return `${baseUrl}/rain-v${version}_linux-i386.zip`
      }

      throw new Error(`Unsupported linux architecture (${arch})`)
    }

    case 'darwin': {
      switch (arch) {
        case 'x64': // Amd64
          return `${baseUrl}/rain-v${version}_darwin-amd64.zip`

        case 'arm64':
          return `${baseUrl}/rain-v${version}_darwin-arm64.zip`
      }

      throw new Error(`Unsupported macOS architecture (${arch})`)
    }

    case 'win32': {
      switch (arch) {
        case 'x64': // Amd64
          return `${baseUrl}/rain-v${version}_windows-amd64.zip`

        case 'x32':
          return `${baseUrl}/rain-v${version}_windows-i386.zip`
      }

      throw new Error(`Unsupported Windows architecture (${arch})`)
    }
  }

  throw new Error('Unsupported OS (platform)')
}

// run the action
(async () => {
  await runAction()
})().catch(error => {
  core.setFailed(error.message)
})
