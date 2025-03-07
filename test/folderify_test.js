'use strict'

var expect = require('expect.js')
var concat = require('concat-stream')
var test = require('tape')
var fs = require('fs')
var path = require('path')
var folderify = require('../lib/folderify')
var browserify = require('browserify')

function rf (file) {
  return fs.readFileSync(path.join(__dirname, file), 'utf8')
}

function checkTransform (sourcefile, expectedfile, t) {
  var source = rf(sourcefile)
  var expected = rf(expectedfile)
  var result = concat(function (data) {
    t.equal && t.equal(data, expected)
    t.end()
  })
  var stream = folderify(sourcefile)
  stream.pipe(result)
  stream.write(source)
  stream.end()
}

test('folderify exports a function', function (t) {
  t.equal(typeof folderify, 'function', 'expect folderify to be a function')
  t.end()
})

test('return a through stream', function (t) {
  expect(folderify('').constructor.name).to.be.equal('Stream')
  t.end()
})

test('un-requires include-folder', function (t) {
  checkTransform(
    'fixtures/source/unrequire-include-folder.js',
    'fixtures/expected/unrequire-include-folder.js',
    t
  )
})

test('replaces includeFolder call with `files` array', function (t) {
  checkTransform(
    'fixtures/source/include-folder-default.js',
    'fixtures/expected/include-folder-default.js',
    t
  )
})

test('respects includeFolder pattern-match arguments', function (t) {
  checkTransform(
    'fixtures/source/include-folder-regex.js',
    'fixtures/expected/include-folder-regex.js',
    t
  )
})

test('preserves filenames when option is set', function (t) {
  checkTransform(
    'fixtures/source/include-folder-filenames.js',
    'fixtures/expected/include-folder-filenames.js',
    t
  )
})

test('as a browserify transform', function (s) {
  // var expectedBundle = rf('fixtures/expected/bundle.js')
  // var expectedBundleWithJson = rf('fixtures/expected/bundle-with-json.js')

  s.test('doesn\'t require brfs', function (t) {
    var b = browserify(path.join(__dirname, 'fixtures/source/bundle.js'))
    b.transform(folderify)

    b
      .bundle()
      .on('error', t.end.bind(t))
      .pipe(concat(function (data) {
        // expect(data.toString('utf8')).to.be.equal(expectedBundle)
        t.end()
      }))
  })

  s.test('supports brfs running after folderify', function (t) {
    var b = browserify(path.join(__dirname, 'fixtures/source/bundle.js'))
    b.transform(folderify)
    b.transform('brfs')

    b
      .bundle()
      .on('error', t.end.bind(t))
      .pipe(concat(function (data) {
        // vexpect(data.toString('utf8')).to.be.equal(expectedBundle)
        t.end()
      }))
  })

  s.test('support brfs running before folderify', function (t) {
    var b = browserify(path.join(__dirname, '/fixtures/source/bundle.js'))
    b.transform('brfs')
    b.transform(folderify)

    b
      .bundle()
      .on('error', t.end.bind(t))
      .pipe(concat(function (data) {
        // expect(data.toString('utf8')).to.be.equal(expectedBundle)
        t.end()
      }))
  })

  s.test('support bundles with non JavaScript files', function (t) {
    var b = browserify(path.join(__dirname, '/fixtures/source/bundle-with-json.js'))
    b.transform('brfs')
    b.transform(folderify)

    b
      .bundle()
      .on('error', t.end.bind(t))
      .pipe(concat(function (data) {
        // expect(data.toString('utf8')).to.be.equal(expectedBundleWithJson)
        t.end()
      }))
  })
})

test('Custom extensions', function (s) {
  s.test('expose validExtensions', function (t) {
    expect(folderify.validExtensions).to.be.an('array')
    t.end()
  })

  s.test('can modify validExtensions for allowing custom extensions', function (t) {
    var origin = folderify.validExtensions
    folderify.validExtensions = ['.custom-js']
    checkTransform(
      'fixtures/source/include-folder-default.custom-js',
      'fixtures/expected/include-folder-default.custom-js',
      {
        end: function (err) {
          folderify.validExtensions = origin
          t.end(err)
        }
      }
    )
  })
})
