import { normalize } from 'path'

import test from 'ava'
import execa from 'execa'
import pathKey from 'path-key'
import { each } from 'test-each'

import nvexeca from '../src/main.js'

import { HELPER_VERSION, TEST_VERSION } from './helpers/versions.js'

const FORK_FILE = normalize(`${__dirname}/helpers/fork.js`)
const DEEP_FILE = normalize(`${__dirname}/helpers/deep.js`)

each(
  [
    ['node', '--version'],
    ['node', DEEP_FILE],
    ['node', FORK_FILE, 'node', '--version'],
  ],
  [{}, { [pathKey()]: undefined }],
  ({ title }, args, env) => {
    test(`Works with child processes | ${title}`, async (t) => {
      const { childProcess } = await nvexeca(
        HELPER_VERSION,
        'node',
        [FORK_FILE, ...args],
        { env },
      )
      const { stdout } = await childProcess

      t.is(stdout.trim(), `v${HELPER_VERSION}`)
    })
  },
)

test.serial('Works with nyc as child', async (t) => {
  const { childProcess } = await nvexeca(HELPER_VERSION, 'nyc', [
    '--silent',
    '--',
    'node',
    '--version',
  ])
  const { stdout } = await childProcess

  t.is(stdout, `v${HELPER_VERSION}`)
})

test('Works with nyc as parent with node command', async (t) => {
  const { stdout } = await execa.command(`nyc --silent -- node ${DEEP_FILE}`)

  t.is(stdout, `v${HELPER_VERSION}`)
})

test('Does not change process.execPath', async (t) => {
  // eslint-disable-next-line no-restricted-globals, node/prefer-global/process
  const { execPath } = process
  await nvexeca(TEST_VERSION, 'node', ['--version'])

  // eslint-disable-next-line no-restricted-globals, node/prefer-global/process
  t.is(process.execPath, execPath)
})
