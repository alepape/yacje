(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.jsonSchemaFaker = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const faker = require('json-schema-faker')
module.exports=faker

},{"json-schema-faker":5}],2:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],3:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":2,"buffer":3,"ieee754":4}],4:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],5:[function(require,module,exports){
(function (process,Buffer){(function (){
var JSONSchemaFaker = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/lib/vendor.mjs
  var vendor_exports = {};
  __export(vendor_exports, {
    getDependencies: () => getDependencies,
    setDependencies: () => setDependencies
  });
  var DEPENDENCIES, getDependencies, setDependencies;
  var init_vendor = __esm({
    "src/lib/vendor.mjs"() {
      DEPENDENCIES = {};
      getDependencies = () => {
        return DEPENDENCIES;
      };
      setDependencies = (value) => {
        Object.assign(DEPENDENCIES, value);
      };
    }
  });

  // src/lib/class/Registry.mjs
  var Registry, Registry_default;
  var init_Registry = __esm({
    "src/lib/class/Registry.mjs"() {
      Registry = class {
        constructor() {
          this.data = {};
        }
        unregister(name) {
          if (!name) {
            this.data = {};
          } else {
            delete this.data[name];
          }
        }
        register(name, callback) {
          this.data[name] = callback;
        }
        registerMany(formats) {
          Object.keys(formats).forEach((name) => {
            this.data[name] = formats[name];
          });
        }
        get(name) {
          const format = this.data[name];
          return format;
        }
        list() {
          return this.data;
        }
      };
      Registry_default = Registry;
    }
  });

  // src/lib/api/defaults.mjs
  var defaults, defaults_default;
  var init_defaults = __esm({
    "src/lib/api/defaults.mjs"() {
      defaults = {};
      defaults_default = defaults;
      defaults.defaultInvalidTypeProduct = void 0;
      defaults.defaultRandExpMax = 10;
      defaults.pruneProperties = [];
      defaults.ignoreProperties = [];
      defaults.ignoreMissingRefs = false;
      defaults.failOnInvalidTypes = true;
      defaults.failOnInvalidFormat = true;
      defaults.alwaysFakeOptionals = false;
      defaults.optionalsProbability = null;
      defaults.fixedProbabilities = false;
      defaults.useExamplesValue = false;
      defaults.useDefaultValue = false;
      defaults.requiredOnly = false;
      defaults.omitNulls = false;
      defaults.minItems = 0;
      defaults.maxItems = null;
      defaults.minLength = 0;
      defaults.maxLength = null;
      defaults.resolveJsonPath = false;
      defaults.reuseProperties = false;
      defaults.fillProperties = true;
      defaults.sortProperties = null;
      defaults.replaceEmptyByRandomValue = false;
      defaults.random = Math.random;
      defaults.renderTitle = true;
      defaults.renderDescription = true;
      defaults.renderComment = false;
    }
  });

  // src/lib/class/OptionRegistry.mjs
  var OptionRegistry, OptionRegistry_default;
  var init_OptionRegistry = __esm({
    "src/lib/class/OptionRegistry.mjs"() {
      init_Registry();
      init_defaults();
      OptionRegistry = class extends Registry_default {
        constructor() {
          super();
          this.data = { ...defaults_default };
          this._defaults = defaults_default;
        }
        get defaults() {
          return { ...this._defaults };
        }
      };
      OptionRegistry_default = OptionRegistry;
    }
  });

  // src/lib/api/option.mjs
  function optionAPI(nameOrOptionMap, optionalValue) {
    if (typeof nameOrOptionMap === "string") {
      if (typeof optionalValue !== "undefined") {
        return registry.register(nameOrOptionMap, optionalValue);
      }
      return registry.get(nameOrOptionMap);
    }
    return registry.registerMany(nameOrOptionMap);
  }
  var registry, option_default;
  var init_option = __esm({
    "src/lib/api/option.mjs"() {
      init_OptionRegistry();
      registry = new OptionRegistry_default();
      optionAPI.getDefaults = () => registry.defaults;
      option_default = optionAPI;
    }
  });

  // src/lib/core/constants.mjs
  var ALLOWED_TYPES, SCALAR_TYPES, ALL_TYPES, MOST_NEAR_DATETIME, MIN_INTEGER, MAX_INTEGER, MIN_NUMBER, MAX_NUMBER, constants_default;
  var init_constants = __esm({
    "src/lib/core/constants.mjs"() {
      ALLOWED_TYPES = ["integer", "number", "string", "boolean"];
      SCALAR_TYPES = ALLOWED_TYPES.concat(["null"]);
      ALL_TYPES = ["array", "object"].concat(SCALAR_TYPES);
      MOST_NEAR_DATETIME = 2524608e6;
      MIN_INTEGER = -1e8;
      MAX_INTEGER = 1e8;
      MIN_NUMBER = -100;
      MAX_NUMBER = 100;
      constants_default = {
        ALLOWED_TYPES,
        SCALAR_TYPES,
        ALL_TYPES,
        MIN_NUMBER,
        MAX_NUMBER,
        MIN_INTEGER,
        MAX_INTEGER,
        MOST_NEAR_DATETIME
      };
    }
  });

  // node_modules/ret/lib/types.js
  var require_types = __commonJS({
    "node_modules/ret/lib/types.js"(exports, module) {
      module.exports = {
        ROOT: 0,
        GROUP: 1,
        POSITION: 2,
        SET: 3,
        RANGE: 4,
        REPETITION: 5,
        REFERENCE: 6,
        CHAR: 7
      };
    }
  });

  // node_modules/ret/lib/sets.js
  var require_sets = __commonJS({
    "node_modules/ret/lib/sets.js"(exports) {
      var types2 = require_types();
      var INTS = () => [{ type: types2.RANGE, from: 48, to: 57 }];
      var WORDS = () => {
        return [
          { type: types2.CHAR, value: 95 },
          { type: types2.RANGE, from: 97, to: 122 },
          { type: types2.RANGE, from: 65, to: 90 }
        ].concat(INTS());
      };
      var WHITESPACE = () => {
        return [
          { type: types2.CHAR, value: 9 },
          { type: types2.CHAR, value: 10 },
          { type: types2.CHAR, value: 11 },
          { type: types2.CHAR, value: 12 },
          { type: types2.CHAR, value: 13 },
          { type: types2.CHAR, value: 32 },
          { type: types2.CHAR, value: 160 },
          { type: types2.CHAR, value: 5760 },
          { type: types2.RANGE, from: 8192, to: 8202 },
          { type: types2.CHAR, value: 8232 },
          { type: types2.CHAR, value: 8233 },
          { type: types2.CHAR, value: 8239 },
          { type: types2.CHAR, value: 8287 },
          { type: types2.CHAR, value: 12288 },
          { type: types2.CHAR, value: 65279 }
        ];
      };
      var NOTANYCHAR = () => {
        return [
          { type: types2.CHAR, value: 10 },
          { type: types2.CHAR, value: 13 },
          { type: types2.CHAR, value: 8232 },
          { type: types2.CHAR, value: 8233 }
        ];
      };
      exports.words = () => ({ type: types2.SET, set: WORDS(), not: false });
      exports.notWords = () => ({ type: types2.SET, set: WORDS(), not: true });
      exports.ints = () => ({ type: types2.SET, set: INTS(), not: false });
      exports.notInts = () => ({ type: types2.SET, set: INTS(), not: true });
      exports.whitespace = () => ({ type: types2.SET, set: WHITESPACE(), not: false });
      exports.notWhitespace = () => ({ type: types2.SET, set: WHITESPACE(), not: true });
      exports.anyChar = () => ({ type: types2.SET, set: NOTANYCHAR(), not: true });
    }
  });

  // node_modules/ret/lib/util.js
  var require_util = __commonJS({
    "node_modules/ret/lib/util.js"(exports) {
      var types2 = require_types();
      var sets = require_sets();
      var CTRL = "@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^ ?";
      var SLSH = { "0": 0, "t": 9, "n": 10, "v": 11, "f": 12, "r": 13 };
      exports.strToChars = function(str) {
        var chars_regex = /(\[\\b\])|(\\)?\\(?:u([A-F0-9]{4})|x([A-F0-9]{2})|(0?[0-7]{2})|c([@A-Z[\\\]^?])|([0tnvfr]))/g;
        str = str.replace(chars_regex, function(s, b, lbs, a16, b16, c8, dctrl, eslsh) {
          if (lbs) {
            return s;
          }
          var code = b ? 8 : a16 ? parseInt(a16, 16) : b16 ? parseInt(b16, 16) : c8 ? parseInt(c8, 8) : dctrl ? CTRL.indexOf(dctrl) : SLSH[eslsh];
          var c = String.fromCharCode(code);
          if (/[[\]{}^$.|?*+()]/.test(c)) {
            c = "\\" + c;
          }
          return c;
        });
        return str;
      };
      exports.tokenizeClass = (str, regexpStr) => {
        var tokens = [];
        var regexp = /\\(?:(w)|(d)|(s)|(W)|(D)|(S))|((?:(?:\\)(.)|([^\]\\]))-(?:\\)?([^\]]))|(\])|(?:\\)?([^])/g;
        var rs, c;
        while ((rs = regexp.exec(str)) != null) {
          if (rs[1]) {
            tokens.push(sets.words());
          } else if (rs[2]) {
            tokens.push(sets.ints());
          } else if (rs[3]) {
            tokens.push(sets.whitespace());
          } else if (rs[4]) {
            tokens.push(sets.notWords());
          } else if (rs[5]) {
            tokens.push(sets.notInts());
          } else if (rs[6]) {
            tokens.push(sets.notWhitespace());
          } else if (rs[7]) {
            tokens.push({
              type: types2.RANGE,
              from: (rs[8] || rs[9]).charCodeAt(0),
              to: rs[10].charCodeAt(0)
            });
          } else if (c = rs[12]) {
            tokens.push({
              type: types2.CHAR,
              value: c.charCodeAt(0)
            });
          } else {
            return [tokens, regexp.lastIndex];
          }
        }
        exports.error(regexpStr, "Unterminated character class");
      };
      exports.error = (regexp, msg) => {
        throw new SyntaxError("Invalid regular expression: /" + regexp + "/: " + msg);
      };
    }
  });

  // node_modules/ret/lib/positions.js
  var require_positions = __commonJS({
    "node_modules/ret/lib/positions.js"(exports) {
      var types2 = require_types();
      exports.wordBoundary = () => ({ type: types2.POSITION, value: "b" });
      exports.nonWordBoundary = () => ({ type: types2.POSITION, value: "B" });
      exports.begin = () => ({ type: types2.POSITION, value: "^" });
      exports.end = () => ({ type: types2.POSITION, value: "$" });
    }
  });

  // node_modules/ret/lib/index.js
  var require_lib = __commonJS({
    "node_modules/ret/lib/index.js"(exports, module) {
      var util = require_util();
      var types2 = require_types();
      var sets = require_sets();
      var positions = require_positions();
      module.exports = (regexpStr) => {
        var i = 0, l, c, start = { type: types2.ROOT, stack: [] }, lastGroup = start, last = start.stack, groupStack = [];
        var repeatErr = (i2) => {
          util.error(regexpStr, `Nothing to repeat at column ${i2 - 1}`);
        };
        var str = util.strToChars(regexpStr);
        l = str.length;
        while (i < l) {
          c = str[i++];
          switch (c) {
            case "\\":
              c = str[i++];
              switch (c) {
                case "b":
                  last.push(positions.wordBoundary());
                  break;
                case "B":
                  last.push(positions.nonWordBoundary());
                  break;
                case "w":
                  last.push(sets.words());
                  break;
                case "W":
                  last.push(sets.notWords());
                  break;
                case "d":
                  last.push(sets.ints());
                  break;
                case "D":
                  last.push(sets.notInts());
                  break;
                case "s":
                  last.push(sets.whitespace());
                  break;
                case "S":
                  last.push(sets.notWhitespace());
                  break;
                default:
                  if (/\d/.test(c)) {
                    last.push({ type: types2.REFERENCE, value: parseInt(c, 10) });
                  } else {
                    last.push({ type: types2.CHAR, value: c.charCodeAt(0) });
                  }
              }
              break;
            case "^":
              last.push(positions.begin());
              break;
            case "$":
              last.push(positions.end());
              break;
            case "[":
              var not;
              if (str[i] === "^") {
                not = true;
                i++;
              } else {
                not = false;
              }
              var classTokens = util.tokenizeClass(str.slice(i), regexpStr);
              i += classTokens[1];
              last.push({
                type: types2.SET,
                set: classTokens[0],
                not
              });
              break;
            case ".":
              last.push(sets.anyChar());
              break;
            case "(":
              var group = {
                type: types2.GROUP,
                stack: [],
                remember: true
              };
              c = str[i];
              if (c === "?") {
                c = str[i + 1];
                i += 2;
                if (c === "=") {
                  group.followedBy = true;
                } else if (c === "!") {
                  group.notFollowedBy = true;
                } else if (c !== ":") {
                  util.error(
                    regexpStr,
                    `Invalid group, character '${c}' after '?' at column ${i - 1}`
                  );
                }
                group.remember = false;
              }
              last.push(group);
              groupStack.push(lastGroup);
              lastGroup = group;
              last = group.stack;
              break;
            case ")":
              if (groupStack.length === 0) {
                util.error(regexpStr, `Unmatched ) at column ${i - 1}`);
              }
              lastGroup = groupStack.pop();
              last = lastGroup.options ? lastGroup.options[lastGroup.options.length - 1] : lastGroup.stack;
              break;
            case "|":
              if (!lastGroup.options) {
                lastGroup.options = [lastGroup.stack];
                delete lastGroup.stack;
              }
              var stack = [];
              lastGroup.options.push(stack);
              last = stack;
              break;
            case "{":
              var rs = /^(\d+)(,(\d+)?)?\}/.exec(str.slice(i)), min, max;
              if (rs !== null) {
                if (last.length === 0) {
                  repeatErr(i);
                }
                min = parseInt(rs[1], 10);
                max = rs[2] ? rs[3] ? parseInt(rs[3], 10) : Infinity : min;
                i += rs[0].length;
                last.push({
                  type: types2.REPETITION,
                  min,
                  max,
                  value: last.pop()
                });
              } else {
                last.push({
                  type: types2.CHAR,
                  value: 123
                });
              }
              break;
            case "?":
              if (last.length === 0) {
                repeatErr(i);
              }
              last.push({
                type: types2.REPETITION,
                min: 0,
                max: 1,
                value: last.pop()
              });
              break;
            case "+":
              if (last.length === 0) {
                repeatErr(i);
              }
              last.push({
                type: types2.REPETITION,
                min: 1,
                max: Infinity,
                value: last.pop()
              });
              break;
            case "*":
              if (last.length === 0) {
                repeatErr(i);
              }
              last.push({
                type: types2.REPETITION,
                min: 0,
                max: Infinity,
                value: last.pop()
              });
              break;
            default:
              last.push({
                type: types2.CHAR,
                value: c.charCodeAt(0)
              });
          }
        }
        if (groupStack.length !== 0) {
          util.error(regexpStr, "Unterminated group");
        }
        return start;
      };
      module.exports.types = types2;
    }
  });

  // node_modules/drange/lib/index.js
  var require_lib2 = __commonJS({
    "node_modules/drange/lib/index.js"(exports, module) {
      "use strict";
      var SubRange = class {
        constructor(low, high) {
          this.low = low;
          this.high = high;
          this.length = 1 + high - low;
        }
        overlaps(range) {
          return !(this.high < range.low || this.low > range.high);
        }
        touches(range) {
          return !(this.high + 1 < range.low || this.low - 1 > range.high);
        }
        add(range) {
          return new SubRange(
            Math.min(this.low, range.low),
            Math.max(this.high, range.high)
          );
        }
        subtract(range) {
          if (range.low <= this.low && range.high >= this.high) {
            return [];
          } else if (range.low > this.low && range.high < this.high) {
            return [
              new SubRange(this.low, range.low - 1),
              new SubRange(range.high + 1, this.high)
            ];
          } else if (range.low <= this.low) {
            return [new SubRange(range.high + 1, this.high)];
          } else {
            return [new SubRange(this.low, range.low - 1)];
          }
        }
        toString() {
          return this.low == this.high ? this.low.toString() : this.low + "-" + this.high;
        }
      };
      var DRange = class {
        constructor(a, b) {
          this.ranges = [];
          this.length = 0;
          if (a != null)
            this.add(a, b);
        }
        _update_length() {
          this.length = this.ranges.reduce((previous, range) => {
            return previous + range.length;
          }, 0);
        }
        add(a, b) {
          var _add = (subrange) => {
            var i = 0;
            while (i < this.ranges.length && !subrange.touches(this.ranges[i])) {
              i++;
            }
            var newRanges = this.ranges.slice(0, i);
            while (i < this.ranges.length && subrange.touches(this.ranges[i])) {
              subrange = subrange.add(this.ranges[i]);
              i++;
            }
            newRanges.push(subrange);
            this.ranges = newRanges.concat(this.ranges.slice(i));
            this._update_length();
          };
          if (a instanceof DRange) {
            a.ranges.forEach(_add);
          } else {
            if (b == null)
              b = a;
            _add(new SubRange(a, b));
          }
          return this;
        }
        subtract(a, b) {
          var _subtract = (subrange) => {
            var i = 0;
            while (i < this.ranges.length && !subrange.overlaps(this.ranges[i])) {
              i++;
            }
            var newRanges = this.ranges.slice(0, i);
            while (i < this.ranges.length && subrange.overlaps(this.ranges[i])) {
              newRanges = newRanges.concat(this.ranges[i].subtract(subrange));
              i++;
            }
            this.ranges = newRanges.concat(this.ranges.slice(i));
            this._update_length();
          };
          if (a instanceof DRange) {
            a.ranges.forEach(_subtract);
          } else {
            if (b == null)
              b = a;
            _subtract(new SubRange(a, b));
          }
          return this;
        }
        intersect(a, b) {
          var newRanges = [];
          var _intersect = (subrange) => {
            var i = 0;
            while (i < this.ranges.length && !subrange.overlaps(this.ranges[i])) {
              i++;
            }
            while (i < this.ranges.length && subrange.overlaps(this.ranges[i])) {
              var low = Math.max(this.ranges[i].low, subrange.low);
              var high = Math.min(this.ranges[i].high, subrange.high);
              newRanges.push(new SubRange(low, high));
              i++;
            }
          };
          if (a instanceof DRange) {
            a.ranges.forEach(_intersect);
          } else {
            if (b == null)
              b = a;
            _intersect(new SubRange(a, b));
          }
          this.ranges = newRanges;
          this._update_length();
          return this;
        }
        index(index) {
          var i = 0;
          while (i < this.ranges.length && this.ranges[i].length <= index) {
            index -= this.ranges[i].length;
            i++;
          }
          return this.ranges[i].low + index;
        }
        toString() {
          return "[ " + this.ranges.join(", ") + " ]";
        }
        clone() {
          return new DRange(this);
        }
        numbers() {
          return this.ranges.reduce((result, subrange) => {
            var i = subrange.low;
            while (i <= subrange.high) {
              result.push(i);
              i++;
            }
            return result;
          }, []);
        }
        subranges() {
          return this.ranges.map((subrange) => ({
            low: subrange.low,
            high: subrange.high,
            length: 1 + subrange.high - subrange.low
          }));
        }
      };
      module.exports = DRange;
    }
  });

  // node_modules/randexp/lib/randexp.js
  var require_randexp = __commonJS({
    "node_modules/randexp/lib/randexp.js"(exports, module) {
      var ret = require_lib();
      var DRange = require_lib2();
      var types2 = ret.types;
      module.exports = class RandExp2 {
        constructor(regexp, m) {
          this._setDefaults(regexp);
          if (regexp instanceof RegExp) {
            this.ignoreCase = regexp.ignoreCase;
            this.multiline = regexp.multiline;
            regexp = regexp.source;
          } else if (typeof regexp === "string") {
            this.ignoreCase = m && m.indexOf("i") !== -1;
            this.multiline = m && m.indexOf("m") !== -1;
          } else {
            throw new Error("Expected a regexp or string");
          }
          this.tokens = ret(regexp);
        }
        _setDefaults(regexp) {
          this.max = regexp.max != null ? regexp.max : RandExp2.prototype.max != null ? RandExp2.prototype.max : 100;
          this.defaultRange = regexp.defaultRange ? regexp.defaultRange : this.defaultRange.clone();
          if (regexp.randInt) {
            this.randInt = regexp.randInt;
          }
        }
        gen() {
          return this._gen(this.tokens, []);
        }
        _gen(token, groups) {
          var stack, str, n, i, l;
          switch (token.type) {
            case types2.ROOT:
            case types2.GROUP:
              if (token.followedBy || token.notFollowedBy) {
                return "";
              }
              if (token.remember && token.groupNumber === void 0) {
                token.groupNumber = groups.push(null) - 1;
              }
              stack = token.options ? this._randSelect(token.options) : token.stack;
              str = "";
              for (i = 0, l = stack.length; i < l; i++) {
                str += this._gen(stack[i], groups);
              }
              if (token.remember) {
                groups[token.groupNumber] = str;
              }
              return str;
            case types2.POSITION:
              return "";
            case types2.SET:
              var expandedSet = this._expand(token);
              if (!expandedSet.length) {
                return "";
              }
              return String.fromCharCode(this._randSelect(expandedSet));
            case types2.REPETITION:
              n = this.randInt(
                token.min,
                token.max === Infinity ? token.min + this.max : token.max
              );
              str = "";
              for (i = 0; i < n; i++) {
                str += this._gen(token.value, groups);
              }
              return str;
            case types2.REFERENCE:
              return groups[token.value - 1] || "";
            case types2.CHAR:
              var code = this.ignoreCase && this._randBool() ? this._toOtherCase(token.value) : token.value;
              return String.fromCharCode(code);
          }
        }
        _toOtherCase(code) {
          return code + (97 <= code && code <= 122 ? -32 : 65 <= code && code <= 90 ? 32 : 0);
        }
        _randBool() {
          return !this.randInt(0, 1);
        }
        _randSelect(arr) {
          if (arr instanceof DRange) {
            return arr.index(this.randInt(0, arr.length - 1));
          }
          return arr[this.randInt(0, arr.length - 1)];
        }
        _expand(token) {
          if (token.type === ret.types.CHAR) {
            return new DRange(token.value);
          } else if (token.type === ret.types.RANGE) {
            return new DRange(token.from, token.to);
          } else {
            let drange = new DRange();
            for (let i = 0; i < token.set.length; i++) {
              let subrange = this._expand(token.set[i]);
              drange.add(subrange);
              if (this.ignoreCase) {
                for (let j = 0; j < subrange.length; j++) {
                  let code = subrange.index(j);
                  let otherCaseCode = this._toOtherCase(code);
                  if (code !== otherCaseCode) {
                    drange.add(otherCaseCode);
                  }
                }
              }
            }
            if (token.not) {
              return this.defaultRange.clone().subtract(drange);
            } else {
              return this.defaultRange.clone().intersect(drange);
            }
          }
        }
        randInt(a, b) {
          return a + Math.floor(Math.random() * (1 + b - a));
        }
        get defaultRange() {
          return this._range = this._range || new DRange(32, 126);
        }
        set defaultRange(range) {
          this._range = range;
        }
        static randexp(regexp, m) {
          var randexp;
          if (typeof regexp === "string") {
            regexp = new RegExp(regexp, m);
          }
          if (regexp._randexp === void 0) {
            randexp = new RandExp2(regexp, m);
            regexp._randexp = randexp;
          } else {
            randexp = regexp._randexp;
            randexp._setDefaults(regexp);
          }
          return randexp.gen();
        }
        static sugar() {
          RegExp.prototype.gen = function() {
            return RandExp2.randexp(this);
          };
        }
      };
    }
  });

  // src/lib/core/random.mjs
  function getRandomInteger(min, max) {
    min = typeof min === "undefined" ? constants_default.MIN_INTEGER : min;
    max = typeof max === "undefined" ? constants_default.MAX_INTEGER : max;
    return Math.floor(option_default("random")() * (max - min + 1)) + min;
  }
  function _randexp(value) {
    import_randexp.default.prototype.max = option_default("defaultRandExpMax");
    import_randexp.default.prototype.randInt = (a, b) => a + Math.floor(option_default("random")() * (1 + (b - a)));
    const re = new import_randexp.default(value);
    return re.gen();
  }
  function pick(collection) {
    return collection[Math.floor(option_default("random")() * collection.length)];
  }
  function shuffle(collection) {
    let tmp;
    let key;
    let length = collection.length;
    const copy = collection.slice();
    for (; length > 0; ) {
      key = Math.floor(option_default("random")() * length);
      length -= 1;
      tmp = copy[length];
      copy[length] = copy[key];
      copy[key] = tmp;
    }
    return copy;
  }
  function getRandom(min, max) {
    return option_default("random")() * (max - min) + min;
  }
  function number(min, max, defMin, defMax, hasPrecision = false) {
    defMin = typeof defMin === "undefined" ? constants_default.MIN_NUMBER : defMin;
    defMax = typeof defMax === "undefined" ? constants_default.MAX_NUMBER : defMax;
    min = typeof min === "undefined" ? defMin : min;
    max = typeof max === "undefined" ? defMax : max;
    if (max < min) {
      max += min;
    }
    if (hasPrecision) {
      return getRandom(min, max);
    }
    return getRandomInteger(min, max);
  }
  function by(type) {
    switch (type) {
      case "seconds":
        return number(0, 60) * 60;
      case "minutes":
        return number(15, 50) * 612;
      case "hours":
        return number(12, 72) * 36123;
      case "days":
        return number(7, 30) * 86412345;
      case "weeks":
        return number(4, 52) * 604812345;
      case "months":
        return number(2, 13) * 2592012345;
      case "years":
        return number(1, 20) * 31104012345;
      default:
        break;
    }
  }
  function date(step) {
    if (step) {
      return by(step);
    }
    const now = new Date();
    const days = number(-1e3, constants_default.MOST_NEAR_DATETIME);
    now.setTime(now.getTime() - days);
    return now;
  }
  var import_randexp, random_default;
  var init_random = __esm({
    "src/lib/core/random.mjs"() {
      import_randexp = __toESM(require_randexp(), 1);
      init_option();
      init_constants();
      random_default = {
        pick,
        date,
        shuffle,
        number,
        randexp: _randexp
      };
    }
  });

  // src/lib/core/utils.mjs
  function getLocalRef(obj, path, refs) {
    path = decodeURIComponent(path);
    if (refs && refs[path])
      return clone(refs[path]);
    const keyElements = path.replace("#/", "/").split("/");
    let schema = obj.$ref && refs && refs[obj.$ref] || obj;
    if (!schema && !keyElements[0]) {
      keyElements[0] = obj.$ref.split("#/")[0];
    }
    if (refs && path.includes("#/") && refs[keyElements[0]]) {
      schema = refs[keyElements.shift()];
    }
    if (!keyElements[0])
      keyElements.shift();
    while (schema && keyElements.length > 0) {
      const prop = keyElements.shift();
      if (!schema[prop]) {
        throw new Error(`Prop not found: ${prop} (${path})`);
      }
      schema = schema[prop];
    }
    return schema;
  }
  function isNumeric(value) {
    return typeof value === "string" && RE_NUMERIC.test(value);
  }
  function isScalar(value) {
    return ["number", "boolean"].includes(typeof value);
  }
  function hasProperties(obj, ...properties) {
    return properties.filter((key) => {
      return typeof obj[key] !== "undefined";
    }).length > 0;
  }
  function clampDate(value) {
    if (value.includes(" ")) {
      return new Date(value).toISOString().substr(0, 10);
    }
    let [year, month, day] = value.split("T")[0].split("-");
    month = `0${Math.max(1, Math.min(12, month))}`.slice(-2);
    day = `0${Math.max(1, Math.min(31, day))}`.slice(-2);
    return `${year}-${month}-${day}`;
  }
  function clampDateTime(value) {
    if (value.includes(" ")) {
      return new Date(value).toISOString().substr(0, 10);
    }
    let [year, month, day] = value.split("T")[0].split("-");
    let [hour, minute, second] = value.split("T")[1].split(".")[0].split(":");
    month = `0${Math.max(1, Math.min(12, month))}`.slice(-2);
    day = `0${Math.max(1, Math.min(31, day))}`.slice(-2);
    hour = `0${Math.max(1, Math.min(23, hour))}`.slice(-2);
    minute = `0${Math.max(1, Math.min(59, minute))}`.slice(-2);
    second = `0${Math.max(1, Math.min(59, second))}`.slice(-2);
    return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
  }
  function typecast(type, schema, callback) {
    const params = {};
    switch (type || schema.type) {
      case "integer":
      case "number":
        if (typeof schema.minimum !== "undefined") {
          params.minimum = schema.minimum;
        }
        if (typeof schema.maximum !== "undefined") {
          params.maximum = schema.maximum;
        }
        if (schema.enum) {
          let min = Math.max(params.minimum || 0, 0);
          let max = Math.min(params.maximum || Infinity, Infinity);
          if (schema.exclusiveMinimum && min === schema.minimum) {
            min += schema.multipleOf || 1;
          }
          if (schema.exclusiveMaximum && max === schema.maximum) {
            max -= schema.multipleOf || 1;
          }
          if (min || max !== Infinity) {
            schema.enum = schema.enum.filter((x) => {
              if (x >= min && x <= max) {
                return true;
              }
              return false;
            });
          }
        }
        break;
      case "string": {
        params.minLength = option_default("minLength") || 0;
        params.maxLength = option_default("maxLength") || Number.MAX_SAFE_INTEGER;
        if (typeof schema.minLength !== "undefined") {
          params.minLength = Math.max(params.minLength, schema.minLength);
        }
        if (typeof schema.maxLength !== "undefined") {
          params.maxLength = Math.min(params.maxLength, schema.maxLength);
        }
        break;
      }
      default:
        break;
    }
    let value = callback(params);
    if (value === null || value === void 0) {
      return null;
    }
    switch (type || schema.type) {
      case "number":
        value = isNumeric(value) ? parseFloat(value) : value;
        break;
      case "integer":
        value = isNumeric(value) ? parseInt(value, 10) : value;
        break;
      case "boolean":
        value = !!value;
        break;
      case "string": {
        if (isScalar(value)) {
          return value;
        }
        value = String(value);
        const min = Math.max(params.minLength || 0, 0);
        const max = Math.min(params.maxLength || Infinity, Infinity);
        let prev;
        let noChangeCount = 0;
        while (value.length < min) {
          prev = value;
          if (!schema.pattern) {
            value += `${random_default.pick([" ", "/", "_", "-", "+", "=", "@", "^"])}${value}`;
          } else {
            value += random_default.randexp(schema.pattern);
          }
          if (value === prev) {
            noChangeCount += 1;
            if (noChangeCount === 3) {
              break;
            }
          } else {
            noChangeCount = 0;
          }
        }
        if (value.length > max) {
          value = value.substr(0, max);
        }
        switch (schema.format) {
          case "date-time":
          case "datetime":
            value = new Date(clampDateTime(value)).toISOString().replace(/([0-9])0+Z$/, "$1Z");
            break;
          case "full-date":
          case "date":
            value = new Date(clampDate(value)).toISOString().substr(0, 10);
            break;
          case "time":
            value = new Date(`1969-01-01 ${value}`).toISOString().substr(11);
            break;
          default:
            break;
        }
        break;
      }
      default:
        break;
    }
    return value;
  }
  function merge(a, b) {
    Object.keys(b).forEach((key) => {
      if (typeof b[key] !== "object" || b[key] === null) {
        a[key] = b[key];
      } else if (Array.isArray(b[key])) {
        a[key] = a[key] || [];
        b[key].forEach((value, i) => {
          if (a.type === "array" && b.type === "array") {
            a[key][i] = merge(a[key][i] || {}, value, true);
          } else if (Array.isArray(a[key]) && a[key].indexOf(value) === -1) {
            a[key].push(value);
          }
        });
      } else if (typeof a[key] !== "object" || a[key] === null || Array.isArray(a[key])) {
        a[key] = merge({}, b[key]);
      } else {
        a[key] = merge(a[key], b[key]);
      }
    });
    return a;
  }
  function clone(obj, cache = /* @__PURE__ */ new Map()) {
    if (!obj || typeof obj !== "object") {
      return obj;
    }
    if (cache.has(obj)) {
      return cache.get(obj);
    }
    if (Array.isArray(obj)) {
      const arr = [];
      cache.set(obj, arr);
      arr.push(...obj.map((x) => clone(x, cache)));
      return arr;
    }
    const clonedObj = {};
    cache.set(obj, clonedObj);
    return Object.keys(obj).reduce((prev, cur) => {
      prev[cur] = clone(obj[cur], cache);
      return prev;
    }, clonedObj);
  }
  function short(schema) {
    const s = JSON.stringify(schema);
    const l = JSON.stringify(schema, null, 2);
    return s.length > 400 ? `${l.substr(0, 400)}...` : l;
  }
  function anyValue() {
    return random_default.pick([
      false,
      true,
      null,
      -1,
      NaN,
      Math.PI,
      Infinity,
      void 0,
      [],
      {},
      Math.random(),
      Math.random().toString(36).substr(2)
    ]);
  }
  function hasValue(schema, value) {
    if (schema.enum)
      return schema.enum.includes(value);
    if (schema.const)
      return schema.const === value;
  }
  function notValue(schema, parent) {
    const copy = merge({}, parent);
    if (typeof schema.minimum !== "undefined") {
      copy.maximum = schema.minimum;
      copy.exclusiveMaximum = true;
    }
    if (typeof schema.maximum !== "undefined") {
      copy.minimum = schema.maximum > copy.maximum ? 0 : schema.maximum;
      copy.exclusiveMinimum = true;
    }
    if (typeof schema.minLength !== "undefined") {
      copy.maxLength = schema.minLength;
    }
    if (typeof schema.maxLength !== "undefined") {
      copy.minLength = schema.maxLength > copy.maxLength ? 0 : schema.maxLength;
    }
    if (schema.type) {
      copy.type = random_default.pick(constants_default.SCALAR_TYPES.filter((x) => {
        const types2 = Array.isArray(schema.type) ? schema.type : [schema.type];
        return types2.every((type) => {
          if (x === "number" || x === "integer") {
            return type !== "number" && type !== "integer";
          }
          return x !== type;
        });
      }));
    } else if (schema.enum) {
      let value;
      do {
        value = anyValue();
      } while (schema.enum.indexOf(value) !== -1);
      copy.enum = [value];
    }
    if (schema.required && copy.properties) {
      schema.required.forEach((prop) => {
        delete copy.properties[prop];
      });
    }
    return copy;
  }
  function validateValueForSchema(value, schema) {
    const schemaHasMin = schema.minimum !== void 0;
    const schemaHasMax = schema.maximum !== void 0;
    return (schemaHasMin || schemaHasMax) && (!schemaHasMin || value >= schema.minimum) && (!schemaHasMax || value <= schema.maximum);
  }
  function validate(value, schemas) {
    return !schemas.every((schema) => validateValueForSchema(value, schema));
  }
  function validateValueForOneOf(value, oneOf) {
    const validCount = oneOf.reduce((count, schema) => count + (validateValueForSchema(value, schema) ? 1 : 0), 0);
    return validCount === 1;
  }
  function isKey(prop) {
    return ["enum", "const", "default", "examples", "required", "definitions", "items", "properties"].includes(prop);
  }
  function omitProps(obj, props) {
    return Object.keys(obj).filter((key) => !props.includes(key)).reduce((copy, k) => {
      if (Array.isArray(obj[k])) {
        copy[k] = obj[k].slice();
      } else {
        copy[k] = obj[k] instanceof Object ? merge({}, obj[k]) : obj[k];
      }
      return copy;
    }, {});
  }
  function template(value, schema) {
    if (Array.isArray(value)) {
      return value.map((x) => template(x, schema));
    }
    if (typeof value === "string") {
      value = value.replace(/#\{([\w.-]+)\}/g, (_, $1) => schema[$1]);
    }
    return value;
  }
  function isEmpty(value) {
    return Object.prototype.toString.call(value) === "[object Object]" && !Object.keys(value).length;
  }
  function shouldClean(key, schema) {
    const isRequired = Array.isArray(schema.required) && schema.required.includes(key);
    const wasCleaned = typeof schema.thunk === "function" || schema.additionalProperties && typeof schema.additionalProperties.thunk === "function";
    return !isRequired && !wasCleaned;
  }
  function clean(obj, schema, isArray = false) {
    if (!obj || typeof obj !== "object") {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((value) => clean(value, schema, true)).filter((value) => typeof value !== "undefined");
    }
    Object.keys(obj).forEach((k) => {
      if (isEmpty(obj[k])) {
        if (shouldClean(k, schema)) {
          delete obj[k];
        }
      } else {
        const value = clean(obj[k], schema);
        if (!isEmpty(value)) {
          obj[k] = value;
        }
      }
      if (typeof obj[k] === "undefined") {
        delete obj[k];
      }
    });
    if (!Object.keys(obj).length && isArray) {
      return void 0;
    }
    return obj;
  }
  var RE_NUMERIC, utils_default;
  var init_utils = __esm({
    "src/lib/core/utils.mjs"() {
      init_option();
      init_constants();
      init_random();
      RE_NUMERIC = /^(0|[1-9][0-9]*)$/;
      utils_default = {
        hasProperties,
        getLocalRef,
        omitProps,
        typecast,
        merge,
        clone,
        short,
        hasValue,
        notValue,
        anyValue,
        validate,
        validateValueForSchema,
        validateValueForOneOf,
        isKey,
        template,
        shouldClean,
        clean,
        isEmpty,
        clampDate
      };
    }
  });

  // src/lib/class/Container.mjs
  function proxy(gen) {
    return (value, schema, property, rootSchema) => {
      let fn = value;
      let args = [];
      if (typeof value === "object") {
        fn = Object.keys(value)[0];
        if (Array.isArray(value[fn])) {
          args = value[fn];
        } else {
          args.push(value[fn]);
        }
      }
      const props = fn.split(".");
      let ctx = gen();
      while (props.length > 1) {
        ctx = ctx[props.shift()];
      }
      value = typeof ctx === "object" ? ctx[props[0]] : ctx;
      if (typeof value === "function") {
        value = value.apply(ctx, args.map((x) => utils_default.template(x, rootSchema)));
      }
      if (Object.prototype.toString.call(value) === "[object Object]") {
        Object.keys(value).forEach((key) => {
          if (typeof value[key] === "function") {
            throw new Error(`Cannot resolve value for '${property}: ${fn}', given: ${value}`);
          }
        });
      }
      return value;
    };
  }
  var Container, Container_default;
  var init_Container = __esm({
    "src/lib/class/Container.mjs"() {
      init_utils();
      Container = class {
        constructor() {
          this.registry = {};
          this.support = {};
        }
        reset(name) {
          if (!name) {
            this.registry = {};
            this.support = {};
          } else {
            delete this.registry[name];
            delete this.support[name];
          }
        }
        extend(name, callback) {
          this.registry[name] = callback(this.registry[name]);
          if (!this.support[name]) {
            this.support[name] = proxy(() => this.registry[name]);
          }
        }
        define(name, callback) {
          this.support[name] = callback;
        }
        get(name) {
          if (typeof this.registry[name] === "undefined") {
            throw new ReferenceError(`'${name}' dependency doesn't exist.`);
          }
          return this.registry[name];
        }
        wrap(schema) {
          if (!("generate" in schema)) {
            const keys = Object.keys(schema);
            const context = {};
            let length = keys.length;
            while (length--) {
              const fn = keys[length].replace(/^x-/, "");
              const gen = this.support[fn];
              if (typeof gen === "function") {
                Object.defineProperty(schema, "generate", {
                  configurable: false,
                  enumerable: false,
                  writable: false,
                  value: (rootSchema, key) => gen.call(context, schema[keys[length]], schema, keys[length], rootSchema, key.slice())
                });
                break;
              }
            }
          }
          return schema;
        }
      };
      Container_default = Container;
    }
  });

  // src/lib/api/format.mjs
  function formatAPI(nameOrFormatMap, callback) {
    if (typeof nameOrFormatMap === "undefined") {
      return registry2.list();
    }
    if (typeof nameOrFormatMap === "string") {
      if (typeof callback === "function") {
        registry2.register(nameOrFormatMap, callback);
      } else if (callback === null || callback === false) {
        registry2.unregister(nameOrFormatMap);
      } else {
        return registry2.get(nameOrFormatMap);
      }
    } else {
      registry2.registerMany(nameOrFormatMap);
    }
  }
  var registry2, format_default;
  var init_format = __esm({
    "src/lib/api/format.mjs"() {
      init_Registry();
      registry2 = new Registry_default();
      format_default = formatAPI;
    }
  });

  // src/lib/core/error.mjs
  var ParseError, error_default;
  var init_error = __esm({
    "src/lib/core/error.mjs"() {
      ParseError = class extends Error {
        constructor(message, path) {
          super();
          if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
          }
          this.name = "ParseError";
          this.message = message;
          this.path = path;
        }
      };
      error_default = ParseError;
    }
  });

  // src/lib/core/infer.mjs
  function matchesType(obj, lastElementInPath, inferredTypeProperties) {
    return Object.keys(obj).filter((prop) => {
      const isSubschema = subschemaProperties.indexOf(lastElementInPath) > -1;
      const inferredPropertyFound = inferredTypeProperties.indexOf(prop) > -1;
      if (inferredPropertyFound && !isSubschema) {
        return true;
      }
      return false;
    }).length > 0;
  }
  function inferType(obj, schemaPath) {
    const keys = Object.keys(inferredProperties);
    for (let i = 0; i < keys.length; i += 1) {
      const typeName = keys[i];
      const lastElementInPath = schemaPath[schemaPath.length - 1];
      if (matchesType(obj, lastElementInPath, inferredProperties[typeName])) {
        return typeName;
      }
    }
  }
  var inferredProperties, subschemaProperties, infer_default;
  var init_infer = __esm({
    "src/lib/core/infer.mjs"() {
      inferredProperties = {
        array: [
          "additionalItems",
          "items",
          "maxItems",
          "minItems",
          "uniqueItems"
        ],
        integer: [
          "exclusiveMaximum",
          "exclusiveMinimum",
          "maximum",
          "minimum",
          "multipleOf"
        ],
        object: [
          "additionalProperties",
          "dependencies",
          "maxProperties",
          "minProperties",
          "patternProperties",
          "properties",
          "required"
        ],
        string: [
          "maxLength",
          "minLength",
          "pattern",
          "format"
        ]
      };
      inferredProperties.number = inferredProperties.integer;
      subschemaProperties = [
        "additionalItems",
        "items",
        "additionalProperties",
        "dependencies",
        "patternProperties",
        "properties"
      ];
      infer_default = inferType;
    }
  });

  // src/lib/generators/boolean.mjs
  function booleanGenerator() {
    return option_default("random")() > 0.5;
  }
  var boolean_default;
  var init_boolean = __esm({
    "src/lib/generators/boolean.mjs"() {
      init_option();
      boolean_default = booleanGenerator;
    }
  });

  // src/lib/types/boolean.mjs
  var booleanType, boolean_default2;
  var init_boolean2 = __esm({
    "src/lib/types/boolean.mjs"() {
      init_boolean();
      booleanType = boolean_default;
      boolean_default2 = booleanType;
    }
  });

  // src/lib/generators/null.mjs
  function nullGenerator() {
    return null;
  }
  var null_default;
  var init_null = __esm({
    "src/lib/generators/null.mjs"() {
      null_default = nullGenerator;
    }
  });

  // src/lib/types/null.mjs
  var nullType, null_default2;
  var init_null2 = __esm({
    "src/lib/types/null.mjs"() {
      init_null();
      nullType = null_default;
      null_default2 = nullType;
    }
  });

  // src/lib/types/array.mjs
  function unique(path, items, value, sample, resolve2, traverseCallback) {
    const tmp = [];
    const seen = [];
    function walk(obj) {
      const json = JSON.stringify(obj.value);
      if (seen.indexOf(json) === -1) {
        seen.push(json);
        tmp.push(obj);
        return true;
      }
      return false;
    }
    items.forEach(walk);
    let limit = 100;
    while (tmp.length !== items.length) {
      if (!walk(traverseCallback(value.items || sample, path, resolve2))) {
        limit -= 1;
      }
      if (!limit) {
        break;
      }
    }
    return tmp;
  }
  function arrayType(value, path, resolve2, traverseCallback) {
    const items = [];
    if (!(value.items || value.additionalItems)) {
      if (utils_default.hasProperties(value, "minItems", "maxItems", "uniqueItems")) {
        throw new error_default(`missing items for ${utils_default.short(value)}`, path);
      }
      return items;
    }
    if (Array.isArray(value.items)) {
      return value.items.map((item, key) => {
        const itemSubpath = path.concat(["items", key]);
        return traverseCallback(item, itemSubpath, resolve2);
      });
    }
    let minItems = value.minItems;
    let maxItems = value.maxItems;
    const defaultMinItems = option_default("minItems");
    const defaultMaxItems = option_default("maxItems");
    if (defaultMinItems) {
      minItems = typeof minItems === "undefined" ? defaultMinItems : Math.min(defaultMinItems, minItems);
    }
    if (defaultMaxItems) {
      maxItems = typeof maxItems === "undefined" ? defaultMaxItems : Math.min(defaultMaxItems, maxItems);
      if (maxItems && maxItems > defaultMaxItems) {
        maxItems = defaultMaxItems;
      }
      if (minItems && minItems > defaultMaxItems) {
        minItems = maxItems;
      }
    }
    const optionalsProbability = option_default("alwaysFakeOptionals") === true ? 1 : option_default("optionalsProbability");
    const fixedProbabilities = option_default("alwaysFakeOptionals") || option_default("fixedProbabilities") || false;
    let length = random_default.number(minItems, maxItems, 1, 5);
    if (optionalsProbability !== null) {
      length = Math.max(fixedProbabilities ? Math.round((maxItems || length) * optionalsProbability) : Math.abs(random_default.number(minItems, maxItems) * optionalsProbability), minItems || 0);
    }
    const sample = typeof value.additionalItems === "object" ? value.additionalItems : {};
    for (let current = items.length; current < length; current += 1) {
      const itemSubpath = path.concat(["items", current]);
      const element = traverseCallback(value.items || sample, itemSubpath, resolve2);
      items.push(element);
    }
    if (value.contains && length > 0) {
      const idx = random_default.number(0, length - 1);
      items[idx] = traverseCallback(value.contains, path.concat(["items", idx]), resolve2);
    }
    if (value.uniqueItems) {
      return unique(path.concat(["items"]), items, value, sample, resolve2, traverseCallback);
    }
    return items;
  }
  var array_default;
  var init_array = __esm({
    "src/lib/types/array.mjs"() {
      init_random();
      init_utils();
      init_error();
      init_option();
      array_default = arrayType;
    }
  });

  // src/lib/types/number.mjs
  function numberType(value) {
    let min = typeof value.minimum === "undefined" || value.minimum === -Number.MAX_VALUE ? constants_default.MIN_INTEGER : value.minimum;
    let max = typeof value.maximum === "undefined" || value.maximum === Number.MAX_VALUE ? constants_default.MAX_INTEGER : value.maximum;
    const multipleOf = value.multipleOf;
    const decimals = multipleOf && String(multipleOf).match(/e-(\d)|\.(\d+)$/);
    if (decimals) {
      const number2 = (Math.random() * random_default.number(0, 10) + 1) * multipleOf;
      const truncate = decimals[1] || decimals[2].length;
      const result = parseFloat(number2.toFixed(truncate));
      const base = random_default.number(min, max - 1);
      if (!String(result).includes(".")) {
        return (base + result).toExponential();
      }
      return base + result;
    }
    if (multipleOf) {
      max = Math.floor(max / multipleOf) * multipleOf;
      min = Math.ceil(min / multipleOf) * multipleOf;
    }
    if (value.exclusiveMinimum && min === value.minimum) {
      min += multipleOf || 1;
    }
    if (value.exclusiveMaximum && max === value.maximum) {
      max -= multipleOf || 1;
    }
    if (min > max) {
      return NaN;
    }
    if (multipleOf) {
      let base = random_default.number(Math.floor(min / multipleOf), Math.floor(max / multipleOf)) * multipleOf;
      while (base < min) {
        base += multipleOf;
      }
      return base;
    }
    return random_default.number(min, max, void 0, void 0, true);
  }
  var number_default;
  var init_number = __esm({
    "src/lib/types/number.mjs"() {
      init_random();
      init_constants();
      number_default = numberType;
    }
  });

  // src/lib/types/integer.mjs
  function integerType(value) {
    return Math.floor(number_default({ ...value }));
  }
  var integer_default;
  var init_integer = __esm({
    "src/lib/types/integer.mjs"() {
      init_number();
      integer_default = integerType;
    }
  });

  // src/lib/generators/words.mjs
  function wordsGenerator(length) {
    const words = random_default.shuffle(LIPSUM_WORDS);
    return words.slice(0, length);
  }
  var LIPSUM_WORDS, words_default;
  var init_words = __esm({
    "src/lib/generators/words.mjs"() {
      init_random();
      LIPSUM_WORDS = `Lorem ipsum dolor sit amet consectetur adipisicing elit sed do eiusmod tempor incididunt ut labore
et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
pariatur Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est
laborum`.split(/\W/);
      words_default = wordsGenerator;
    }
  });

  // src/lib/types/object.mjs
  function objectType(value, path, resolve2, traverseCallback) {
    const props = {};
    const properties = value.properties || {};
    const patternProperties = value.patternProperties || {};
    const requiredProperties = typeof value.required === "boolean" ? [] : (value.required || []).slice();
    const allowsAdditional = value.additionalProperties !== false;
    const propertyKeys = Object.keys(properties);
    const patternPropertyKeys = Object.keys(patternProperties);
    const optionalProperties = propertyKeys.concat(patternPropertyKeys).reduce((_response, _key) => {
      if (requiredProperties.indexOf(_key) === -1)
        _response.push(_key);
      return _response;
    }, []);
    const allProperties = requiredProperties.concat(optionalProperties);
    const additionalProperties = allowsAdditional ? value.additionalProperties === true ? anyType : value.additionalProperties : value.additionalProperties;
    if (!allowsAdditional && propertyKeys.length === 0 && patternPropertyKeys.length === 0 && utils_default.hasProperties(value, "minProperties", "maxProperties", "dependencies", "required")) {
      return null;
    }
    if (option_default("requiredOnly") === true) {
      requiredProperties.forEach((key) => {
        if (properties[key]) {
          props[key] = properties[key];
        }
      });
      return traverseCallback(props, path.concat(["properties"]), resolve2, value);
    }
    const optionalsProbability = option_default("alwaysFakeOptionals") === true ? 1 : option_default("optionalsProbability");
    const fixedProbabilities = option_default("alwaysFakeOptionals") || option_default("fixedProbabilities") || false;
    const ignoreProperties = option_default("ignoreProperties") || [];
    const reuseProps = option_default("reuseProperties");
    const fillProps = option_default("fillProperties");
    const max = value.maxProperties || allProperties.length + (allowsAdditional ? random_default.number(1, 5) : 0);
    let min = Math.max(value.minProperties || 0, requiredProperties.length);
    let neededExtras = Math.max(0, allProperties.length - min);
    if (allProperties.length === 1 && !requiredProperties.length) {
      min = Math.max(random_default.number(fillProps ? 1 : 0, max), min);
    }
    if (optionalsProbability !== null) {
      if (fixedProbabilities === true) {
        neededExtras = Math.round(min - requiredProperties.length + optionalsProbability * (allProperties.length - min));
      } else {
        neededExtras = random_default.number(min - requiredProperties.length, optionalsProbability * (allProperties.length - min));
      }
    }
    const extraPropertiesRandomOrder = random_default.shuffle(optionalProperties).slice(0, neededExtras);
    const extraProperties = optionalProperties.filter((_item) => {
      return extraPropertiesRandomOrder.indexOf(_item) !== -1;
    });
    const _limit = optionalsProbability !== null || requiredProperties.length === max ? max : random_default.number(0, max);
    const _props = requiredProperties.concat(random_default.shuffle(extraProperties).slice(0, _limit)).slice(0, max);
    const _defns = [];
    const _deps = [];
    if (value.dependencies) {
      Object.keys(value.dependencies).forEach((prop) => {
        const _required = value.dependencies[prop];
        if (_props.indexOf(prop) !== -1) {
          if (Array.isArray(_required)) {
            _required.forEach((sub) => {
              if (_props.indexOf(sub) === -1) {
                _props.push(sub);
              }
            });
          } else if (Array.isArray(_required.oneOf || _required.anyOf)) {
            const values = _required.oneOf || _required.anyOf;
            _deps.push({ prop, values });
          } else {
            _defns.push(_required);
          }
        }
      });
      if (_defns.length) {
        delete value.dependencies;
        return traverseCallback({
          allOf: _defns.concat(value)
        }, path.concat(["properties"]), resolve2, value);
      }
    }
    const skipped = [];
    const missing = [];
    _props.forEach((key) => {
      if (properties[key] && ["{}", "true"].includes(JSON.stringify(properties[key].not))) {
        return;
      }
      for (let i = 0; i < ignoreProperties.length; i += 1) {
        if (ignoreProperties[i] instanceof RegExp && ignoreProperties[i].test(key) || typeof ignoreProperties[i] === "string" && ignoreProperties[i] === key || typeof ignoreProperties[i] === "function" && ignoreProperties[i](properties[key], key)) {
          skipped.push(key);
          return;
        }
      }
      if (additionalProperties === false) {
        if (requiredProperties.indexOf(key) !== -1) {
          props[key] = properties[key];
        }
      }
      if (properties[key]) {
        props[key] = properties[key];
      }
      let found;
      patternPropertyKeys.forEach((_key) => {
        if (key.match(new RegExp(_key))) {
          found = true;
          if (props[key]) {
            utils_default.merge(props[key], patternProperties[_key]);
          } else {
            props[random_default.randexp(key)] = patternProperties[_key];
          }
        }
      });
      if (!found) {
        const subschema = patternProperties[key] || additionalProperties;
        if (subschema && additionalProperties !== false) {
          props[patternProperties[key] ? random_default.randexp(key) : key] = properties[key] || subschema;
        } else {
          missing.push(key);
        }
      }
    });
    let current = Object.keys(props).length + (fillProps ? 0 : skipped.length);
    const hash = (suffix) => random_default.randexp(`_?[_a-f\\d]{1,3}${suffix ? "\\$?" : ""}`);
    function get(from) {
      let one;
      do {
        if (!from.length)
          break;
        one = from.shift();
      } while (props[one]);
      return one;
    }
    let minProps = min;
    if (allowsAdditional && !requiredProperties.length) {
      minProps = Math.max(optionalsProbability === null || additionalProperties ? random_default.number(fillProps ? 1 : 0, max) : 0, min);
    }
    if (!extraProperties.length && !neededExtras && allowsAdditional && fixedProbabilities === true) {
      const limit = random_default.number(0, max);
      for (let i = 0; i <= limit; i += 1) {
        props[words_default(1) + hash(limit[i])] = anyType;
      }
    }
    while (fillProps) {
      if (!(patternPropertyKeys.length || allowsAdditional)) {
        break;
      }
      if (current >= minProps) {
        break;
      }
      if (allowsAdditional) {
        if (reuseProps && propertyKeys.length - current > minProps) {
          let count = 0;
          let key;
          do {
            count += 1;
            if (count > 1e3) {
              break;
            }
            key = get(requiredProperties) || random_default.pick(propertyKeys);
          } while (typeof props[key] !== "undefined");
          if (typeof props[key] === "undefined") {
            props[key] = properties[key];
            current += 1;
          }
        } else if (patternPropertyKeys.length && !additionalProperties) {
          const prop = random_default.pick(patternPropertyKeys);
          const word = random_default.randexp(prop);
          if (!props[word]) {
            props[word] = patternProperties[prop];
            current += 1;
          }
        } else {
          const word = get(requiredProperties) || words_default(1) + hash();
          if (!props[word]) {
            props[word] = additionalProperties || anyType;
            current += 1;
          }
        }
      }
      for (let i = 0; current < min && i < patternPropertyKeys.length; i += 1) {
        const _key = patternPropertyKeys[i];
        const word = random_default.randexp(_key);
        if (!props[word]) {
          props[word] = patternProperties[_key];
          current += 1;
        }
      }
    }
    if (requiredProperties.length === 0 && (!allowsAdditional || optionalsProbability === false)) {
      const maximum = random_default.number(min, max);
      for (; current < maximum; ) {
        const word = get(propertyKeys);
        if (word) {
          props[word] = properties[word];
        }
        current += 1;
      }
    }
    let sortedObj = props;
    if (option_default("sortProperties") !== null) {
      const originalKeys = Object.keys(properties);
      const sortedKeys = Object.keys(props).sort((a, b) => {
        return option_default("sortProperties") ? a.localeCompare(b) : originalKeys.indexOf(b) - originalKeys.indexOf(a);
      });
      sortedObj = sortedKeys.reduce((memo, key) => {
        memo[key] = props[key];
        return memo;
      }, {});
    }
    const result = traverseCallback(sortedObj, path.concat(["properties"]), resolve2, value);
    _deps.forEach((dep) => {
      for (const sub of dep.values) {
        if (utils_default.hasValue(sub.properties[dep.prop], result.value[dep.prop])) {
          Object.keys(sub.properties).forEach((next) => {
            if (next !== dep.prop) {
              utils_default.merge(result.value, traverseCallback(sub.properties, path.concat(["properties"]), resolve2, value).value);
            }
          });
          break;
        }
      }
    });
    return result;
  }
  var anyType, object_default;
  var init_object = __esm({
    "src/lib/types/object.mjs"() {
      init_constants();
      init_random();
      init_words();
      init_utils();
      init_option();
      anyType = { type: constants_default.ALLOWED_TYPES };
      object_default = objectType;
    }
  });

  // src/lib/generators/thunk.mjs
  function produce() {
    const length = random_default.number(1, 5);
    return words_default(length).join(" ");
  }
  function thunkGenerator(min = 0, max = 140) {
    const _min = Math.max(0, min);
    const _max = random_default.number(_min, max);
    let result = produce();
    while (result.length < _min) {
      result += produce();
    }
    if (result.length > _max) {
      result = result.substr(0, _max);
    }
    return result;
  }
  var thunk_default;
  var init_thunk = __esm({
    "src/lib/generators/thunk.mjs"() {
      init_words();
      init_random();
      thunk_default = thunkGenerator;
    }
  });

  // src/lib/generators/ipv4.mjs
  function ipv4Generator() {
    return [0, 0, 0, 0].map(() => {
      return random_default.number(0, 255);
    }).join(".");
  }
  var ipv4_default;
  var init_ipv4 = __esm({
    "src/lib/generators/ipv4.mjs"() {
      init_random();
      ipv4_default = ipv4Generator;
    }
  });

  // src/lib/generators/dateTime.mjs
  function dateTimeGenerator() {
    return random_default.date().toISOString();
  }
  var dateTime_default;
  var init_dateTime = __esm({
    "src/lib/generators/dateTime.mjs"() {
      init_random();
      dateTime_default = dateTimeGenerator;
    }
  });

  // src/lib/generators/date.mjs
  function dateGenerator() {
    return dateTime_default().slice(0, 10);
  }
  var date_default;
  var init_date = __esm({
    "src/lib/generators/date.mjs"() {
      init_dateTime();
      date_default = dateGenerator;
    }
  });

  // src/lib/generators/time.mjs
  function timeGenerator() {
    return dateTime_default().slice(11);
  }
  var time_default;
  var init_time = __esm({
    "src/lib/generators/time.mjs"() {
      init_dateTime();
      time_default = timeGenerator;
    }
  });

  // src/lib/generators/coreFormat.mjs
  function coreFormatGenerator(coreFormat) {
    return random_default.randexp(regexps[coreFormat]).replace(ALLOWED_FORMATS, (match, key) => {
      return random_default.randexp(regexps[key]);
    });
  }
  var FRAGMENT, URI_PATTERN, PARAM_PATTERN, regexps, ALLOWED_FORMATS, coreFormat_default;
  var init_coreFormat = __esm({
    "src/lib/generators/coreFormat.mjs"() {
      init_random();
      FRAGMENT = "[a-zA-Z][a-zA-Z0-9+-.]*";
      URI_PATTERN = `https?://{hostname}(?:${FRAGMENT})+`;
      PARAM_PATTERN = "(?:\\?([a-z]{1,7}(=\\w{1,5})?&){0,3})?";
      regexps = {
        email: "[a-zA-Z\\d][a-zA-Z\\d-]{1,13}[a-zA-Z\\d]@{hostname}",
        hostname: "[a-zA-Z]{1,33}\\.[a-z]{2,4}",
        ipv6: "[a-f\\d]{4}(:[a-f\\d]{4}){7}",
        uri: URI_PATTERN,
        slug: "[a-zA-Z\\d_-]+",
        "uri-reference": `${URI_PATTERN}${PARAM_PATTERN}`,
        "uri-template": URI_PATTERN.replace("(?:", "(?:/\\{[a-z][:a-zA-Z0-9-]*\\}|"),
        "json-pointer": `(/(?:${FRAGMENT.replace("]*", "/]*")}|~[01]))+`,
        uuid: "^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$",
        duration: "^P(?!$)((\\d+Y)?(\\d+M)?(\\d+D)?(T(?=\\d)(\\d+H)?(\\d+M)?(\\d+S)?)?|(\\d+W)?)$"
      };
      regexps.iri = regexps["uri-reference"];
      regexps["iri-reference"] = regexps["uri-reference"];
      regexps["idn-email"] = regexps.email;
      regexps["idn-hostname"] = regexps.hostname;
      ALLOWED_FORMATS = new RegExp(`\\{(${Object.keys(regexps).join("|")})\\}`);
      coreFormat_default = coreFormatGenerator;
    }
  });

  // src/lib/types/string.mjs
  function generateFormat(value, invalid) {
    const callback = format_default(value.format);
    if (typeof callback === "function") {
      return callback(value);
    }
    switch (value.format) {
      case "date-time":
      case "datetime":
        return dateTime_default();
      case "date":
        return date_default();
      case "time":
        return time_default();
      case "ipv4":
        return ipv4_default();
      case "regex":
        return ".+?";
      case "email":
      case "hostname":
      case "ipv6":
      case "uri":
      case "uri-reference":
      case "iri":
      case "iri-reference":
      case "idn-email":
      case "idn-hostname":
      case "json-pointer":
      case "slug":
      case "uri-template":
      case "uuid":
      case "duration":
        return coreFormat_default(value.format);
      default:
        if (typeof callback === "undefined") {
          if (option_default("failOnInvalidFormat")) {
            throw new Error(`unknown registry key ${utils_default.short(value.format)}`);
          } else {
            return invalid();
          }
        }
        throw new Error(`unsupported format '${value.format}'`);
    }
  }
  function stringType(value) {
    const output = utils_default.typecast("string", value, (opts) => {
      if (value.format) {
        return generateFormat(value, () => thunk_default(opts.minLength, opts.maxLength));
      }
      if (value.pattern) {
        return random_default.randexp(value.pattern);
      }
      return thunk_default(opts.minLength, opts.maxLength);
    });
    return output;
  }
  var string_default;
  var init_string = __esm({
    "src/lib/types/string.mjs"() {
      init_thunk();
      init_ipv4();
      init_dateTime();
      init_date();
      init_time();
      init_coreFormat();
      init_option();
      init_format();
      init_random();
      init_utils();
      string_default = stringType;
    }
  });

  // src/lib/types/index.mjs
  var typeMap, types_default;
  var init_types = __esm({
    "src/lib/types/index.mjs"() {
      init_boolean2();
      init_null2();
      init_array();
      init_integer();
      init_number();
      init_object();
      init_string();
      typeMap = {
        boolean: boolean_default2,
        null: null_default2,
        array: array_default,
        integer: integer_default,
        number: number_default,
        object: object_default,
        string: string_default
      };
      types_default = typeMap;
    }
  });

  // src/lib/core/traverse.mjs
  function getMeta({ $comment: comment, title, description }) {
    return Object.entries({ comment, title, description }).filter(([, value]) => value).reduce((memo, [k, v]) => {
      memo[k] = v;
      return memo;
    }, {});
  }
  function traverse(schema, path, resolve2, rootSchema) {
    schema = resolve2(schema, null, path);
    if (schema && (schema.oneOf || schema.anyOf || schema.allOf)) {
      schema = resolve2(schema, null, path);
    }
    if (!schema) {
      throw new Error(`Cannot traverse at '${path.join(".")}', given '${JSON.stringify(rootSchema)}'`);
    }
    const context = {
      ...getMeta(schema),
      schemaPath: path
    };
    if (path[path.length - 1] !== "properties") {
      if (option_default("useExamplesValue") && Array.isArray(schema.examples)) {
        const fixedExamples = schema.examples.concat("default" in schema ? [schema.default] : []);
        return { value: utils_default.typecast(null, schema, () => random_default.pick(fixedExamples)), context };
      }
      if (option_default("useExamplesValue") && schema.example) {
        return { value: utils_default.typecast(null, schema, () => schema.example), context };
      }
      if (option_default("useDefaultValue") && "default" in schema) {
        if (schema.default !== "" || !option_default("replaceEmptyByRandomValue")) {
          return { value: schema.default, context };
        }
      }
      if ("template" in schema) {
        return { value: utils_default.template(schema.template, rootSchema), context };
      }
      if ("const" in schema) {
        return { value: schema.const, context };
      }
    }
    if (schema.not && typeof schema.not === "object") {
      schema = utils_default.notValue(schema.not, utils_default.omitProps(schema, ["not"]));
      if (schema.type && schema.type === "object") {
        const { value, context: innerContext } = traverse(schema, path.concat(["not"]), resolve2, rootSchema);
        return { value: utils_default.clean(value, schema, false), context: { ...context, items: innerContext } };
      }
    }
    if (typeof schema.thunk === "function") {
      const { value, context: innerContext } = traverse(schema.thunk(rootSchema), path, resolve2);
      return { value, context: { ...context, items: innerContext } };
    }
    if (schema.jsonPath) {
      return { value: schema, context };
    }
    let type = schema.type;
    if (Array.isArray(type)) {
      type = random_default.pick(type);
    } else if (typeof type === "undefined") {
      type = infer_default(schema, path) || type;
      if (type) {
        schema.type = type;
      }
    }
    if (typeof schema.generate === "function") {
      const retVal = utils_default.typecast(null, schema, () => schema.generate(rootSchema, path));
      const retType = retVal === null ? "null" : typeof retVal;
      if (retType === type || retType === "number" && type === "integer" || Array.isArray(retVal) && type === "array") {
        return { value: retVal, context };
      }
    }
    if (typeof schema.pattern === "string") {
      return { value: utils_default.typecast("string", schema, () => random_default.randexp(schema.pattern)), context };
    }
    if (Array.isArray(schema.enum)) {
      return { value: utils_default.typecast(null, schema, () => random_default.pick(schema.enum)), context };
    }
    if (typeof type === "string") {
      if (!types_default[type]) {
        if (option_default("failOnInvalidTypes")) {
          throw new error_default(`unknown primitive ${utils_default.short(type)}`, path.concat(["type"]));
        } else {
          const value = option_default("defaultInvalidTypeProduct");
          if (typeof value === "string" && types_default[value]) {
            return { value: types_default[value](schema, path, resolve2, traverse), context };
          }
          return { value, context };
        }
      } else {
        try {
          const innerResult = types_default[type](schema, path, resolve2, traverse);
          if (type === "array") {
            return {
              value: innerResult.map(({ value }) => value),
              context: {
                ...context,
                items: innerResult.map(
                  Array.isArray(schema.items) ? ({ context: c }) => c : ({ context: c }) => ({
                    ...c,
                    schemaPath: c.schemaPath.slice(0, -1)
                  })
                )
              }
            };
          }
          if (type === "object") {
            return innerResult !== null ? { value: innerResult.value, context: { ...context, items: innerResult.context } } : { value: {}, context };
          }
          return { value: innerResult, context };
        } catch (e) {
          if (typeof e.path === "undefined") {
            throw new error_default(e.stack, path);
          }
          throw e;
        }
      }
    }
    let valueCopy = {};
    let contextCopy = { ...context };
    if (Array.isArray(schema)) {
      valueCopy = [];
    }
    const pruneProperties = option_default("pruneProperties") || [];
    Object.keys(schema).forEach((prop) => {
      if (pruneProperties.includes(prop))
        return;
      if (schema[prop] === null)
        return;
      if (typeof schema[prop] === "object" && prop !== "definitions") {
        const { value, context: innerContext } = traverse(schema[prop], path.concat([prop]), resolve2, valueCopy);
        valueCopy[prop] = utils_default.clean(value, schema[prop], false);
        contextCopy[prop] = innerContext;
        if (valueCopy[prop] === null && option_default("omitNulls")) {
          delete valueCopy[prop];
          delete contextCopy[prop];
        }
      } else {
        valueCopy[prop] = schema[prop];
      }
    });
    return { value: valueCopy, context: contextCopy };
  }
  var traverse_default;
  var init_traverse = __esm({
    "src/lib/core/traverse.mjs"() {
      init_utils();
      init_random();
      init_error();
      init_infer();
      init_types();
      init_option();
      traverse_default = traverse;
    }
  });

  // src/lib/core/buildResolveSchema.mjs
  var buildResolveSchema, buildResolveSchema_default;
  var init_buildResolveSchema = __esm({
    "src/lib/core/buildResolveSchema.mjs"() {
      init_option();
      init_random();
      init_utils();
      buildResolveSchema = ({
        refs,
        schema,
        container: container2,
        synchronous,
        refDepthMax,
        refDepthMin
      }) => {
        const recursiveUtil = {};
        const seenRefs = {};
        let depth = 0;
        let lastRef;
        let lastPath;
        recursiveUtil.resolveSchema = (sub, index, rootPath) => {
          if (sub === null || sub === void 0) {
            return null;
          }
          if (typeof sub.generate === "function") {
            return sub;
          }
          const _id = sub.$id || sub.id;
          if (typeof _id === "string") {
            delete sub.id;
            delete sub.$id;
            delete sub.$schema;
          }
          if (typeof sub.$ref === "string") {
            const maxDepth = Math.max(refDepthMin, refDepthMax) - 1;
            if (sub.$ref === "#" || seenRefs[sub.$ref] < 0 || lastRef === sub.$ref && ++depth > maxDepth) {
              if (sub.$ref !== "#" && lastPath && lastPath.length === rootPath.length) {
                return utils_default.getLocalRef(schema, sub.$ref, synchronous && refs);
              }
              delete sub.$ref;
              return sub;
            }
            if (typeof seenRefs[sub.$ref] === "undefined") {
              seenRefs[sub.$ref] = random_default.number(refDepthMin, refDepthMax) - 1;
            }
            lastPath = rootPath;
            lastRef = sub.$ref;
            let ref;
            if (sub.$ref.indexOf("#/") === -1) {
              ref = refs[sub.$ref] || null;
            } else {
              ref = utils_default.getLocalRef(schema, sub.$ref, synchronous && refs) || null;
            }
            let fixed;
            if (typeof ref !== "undefined") {
              if (!ref && option_default("ignoreMissingRefs") !== true) {
                throw new Error(`Reference not found: ${sub.$ref}`);
              }
              seenRefs[sub.$ref] -= 1;
              utils_default.merge(sub, ref || {});
              fixed = synchronous && ref && ref.$ref;
            }
            if (!fixed)
              delete sub.$ref;
            return sub;
          }
          if (Array.isArray(sub.allOf)) {
            const schemas = sub.allOf;
            delete sub.allOf;
            schemas.forEach((subSchema) => {
              const _sub = recursiveUtil.resolveSchema(subSchema, null, rootPath);
              utils_default.merge(sub, typeof _sub.thunk === "function" ? _sub.thunk(sub) : _sub);
              if (Array.isArray(sub.allOf)) {
                recursiveUtil.resolveSchema(sub, index, rootPath);
              }
            });
          }
          if (Array.isArray(sub.oneOf || sub.anyOf) && rootPath[rootPath.length - 2] !== "dependencies") {
            const mix = sub.oneOf || sub.anyOf;
            if (sub.enum && sub.oneOf) {
              sub.enum = sub.enum.filter((x) => utils_default.validate(x, mix));
            }
            return {
              thunk(rootSchema) {
                const copy = utils_default.omitProps(sub, ["anyOf", "oneOf"]);
                const fixed = random_default.pick(mix);
                utils_default.merge(copy, fixed);
                mix.forEach((omit) => {
                  if (omit.required && omit !== fixed) {
                    omit.required.forEach((key) => {
                      const includesKey = copy.required && copy.required.includes(key);
                      if (copy.properties && !includesKey) {
                        delete copy.properties[key];
                      }
                      if (rootSchema && rootSchema.properties) {
                        delete rootSchema.properties[key];
                      }
                    });
                  }
                });
                return copy;
              }
            };
          }
          Object.keys(sub).forEach((prop) => {
            if ((Array.isArray(sub[prop]) || typeof sub[prop] === "object") && !utils_default.isKey(prop)) {
              sub[prop] = recursiveUtil.resolveSchema(sub[prop], prop, rootPath.concat(prop));
            }
          });
          if (rootPath) {
            const lastProp = rootPath[rootPath.length - 1];
            if (lastProp === "properties" || lastProp === "items") {
              return sub;
            }
          }
          return container2.wrap(sub);
        };
        return recursiveUtil;
      };
      buildResolveSchema_default = buildResolveSchema;
    }
  });

  // src/lib/core/run.mjs
  function pick2(data) {
    return Array.isArray(data) ? random_default.pick(data) : data;
  }
  function cycle(data, reverse) {
    if (!Array.isArray(data)) {
      return data;
    }
    const value = reverse ? data.pop() : data.shift();
    if (reverse) {
      data.unshift(value);
    } else {
      data.push(value);
    }
    return value;
  }
  function resolve(obj, data, values, property) {
    if (!obj || typeof obj !== "object") {
      return obj;
    }
    if (!values) {
      values = {};
    }
    if (!data) {
      data = obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((x) => resolve(x, data, values, property));
    }
    if (obj.jsonPath) {
      const { JSONPath } = getDependencies();
      const params = typeof obj.jsonPath !== "object" ? { path: obj.jsonPath } : obj.jsonPath;
      params.group = obj.group || params.group || property;
      params.cycle = obj.cycle || params.cycle || false;
      params.reverse = obj.reverse || params.reverse || false;
      params.count = obj.count || params.count || 1;
      const key = `${params.group}__${params.path}`;
      if (!values[key]) {
        if (params.count > 1) {
          values[key] = JSONPath(params.path, data).slice(0, params.count);
        } else {
          values[key] = JSONPath(params.path, data);
        }
      }
      if (params.cycle || params.reverse) {
        return cycle(values[key], params.reverse);
      }
      return pick2(values[key]);
    }
    Object.keys(obj).forEach((k) => {
      obj[k] = resolve(obj[k], data, values, k);
    });
    return obj;
  }
  function run(refs, schema, container2, synchronous) {
    if (Object.prototype.toString.call(schema) !== "[object Object]") {
      throw new Error(`Invalid input, expecting object but given ${typeof schema}`);
    }
    const refDepthMin = option_default("refDepthMin") || 0;
    const refDepthMax = option_default("refDepthMax") || 3;
    try {
      const { resolveSchema } = buildResolveSchema_default({
        refs,
        schema,
        container: container2,
        synchronous,
        refDepthMin,
        refDepthMax
      });
      const result = traverse_default(utils_default.clone(schema), [], resolveSchema);
      if (option_default("resolveJsonPath")) {
        return {
          value: resolve(result.value),
          context: result.context
        };
      }
      return result;
    } catch (e) {
      if (e.path) {
        throw new Error(`${e.message} in /${e.path.join("/")}`);
      } else {
        throw e;
      }
    }
  }
  var run_default;
  var init_run = __esm({
    "src/lib/core/run.mjs"() {
      init_vendor();
      init_option();
      init_traverse();
      init_random();
      init_utils();
      init_buildResolveSchema();
      run_default = run;
    }
  });

  // src/lib/renderers/js.mjs
  function renderJS(res) {
    return res.value;
  }
  var js_default;
  var init_js = __esm({
    "src/lib/renderers/js.mjs"() {
      js_default = renderJS;
    }
  });

  // node_modules/yaml/dist/PlainValue-ec8e588e.js
  var require_PlainValue_ec8e588e = __commonJS({
    "node_modules/yaml/dist/PlainValue-ec8e588e.js"(exports) {
      "use strict";
      var Char = {
        ANCHOR: "&",
        COMMENT: "#",
        TAG: "!",
        DIRECTIVES_END: "-",
        DOCUMENT_END: "."
      };
      var Type = {
        ALIAS: "ALIAS",
        BLANK_LINE: "BLANK_LINE",
        BLOCK_FOLDED: "BLOCK_FOLDED",
        BLOCK_LITERAL: "BLOCK_LITERAL",
        COMMENT: "COMMENT",
        DIRECTIVE: "DIRECTIVE",
        DOCUMENT: "DOCUMENT",
        FLOW_MAP: "FLOW_MAP",
        FLOW_SEQ: "FLOW_SEQ",
        MAP: "MAP",
        MAP_KEY: "MAP_KEY",
        MAP_VALUE: "MAP_VALUE",
        PLAIN: "PLAIN",
        QUOTE_DOUBLE: "QUOTE_DOUBLE",
        QUOTE_SINGLE: "QUOTE_SINGLE",
        SEQ: "SEQ",
        SEQ_ITEM: "SEQ_ITEM"
      };
      var defaultTagPrefix = "tag:yaml.org,2002:";
      var defaultTags = {
        MAP: "tag:yaml.org,2002:map",
        SEQ: "tag:yaml.org,2002:seq",
        STR: "tag:yaml.org,2002:str"
      };
      function findLineStarts(src) {
        const ls = [0];
        let offset = src.indexOf("\n");
        while (offset !== -1) {
          offset += 1;
          ls.push(offset);
          offset = src.indexOf("\n", offset);
        }
        return ls;
      }
      function getSrcInfo(cst) {
        let lineStarts, src;
        if (typeof cst === "string") {
          lineStarts = findLineStarts(cst);
          src = cst;
        } else {
          if (Array.isArray(cst))
            cst = cst[0];
          if (cst && cst.context) {
            if (!cst.lineStarts)
              cst.lineStarts = findLineStarts(cst.context.src);
            lineStarts = cst.lineStarts;
            src = cst.context.src;
          }
        }
        return {
          lineStarts,
          src
        };
      }
      function getLinePos(offset, cst) {
        if (typeof offset !== "number" || offset < 0)
          return null;
        const {
          lineStarts,
          src
        } = getSrcInfo(cst);
        if (!lineStarts || !src || offset > src.length)
          return null;
        for (let i = 0; i < lineStarts.length; ++i) {
          const start = lineStarts[i];
          if (offset < start) {
            return {
              line: i,
              col: offset - lineStarts[i - 1] + 1
            };
          }
          if (offset === start)
            return {
              line: i + 1,
              col: 1
            };
        }
        const line = lineStarts.length;
        return {
          line,
          col: offset - lineStarts[line - 1] + 1
        };
      }
      function getLine(line, cst) {
        const {
          lineStarts,
          src
        } = getSrcInfo(cst);
        if (!lineStarts || !(line >= 1) || line > lineStarts.length)
          return null;
        const start = lineStarts[line - 1];
        let end = lineStarts[line];
        while (end && end > start && src[end - 1] === "\n")
          --end;
        return src.slice(start, end);
      }
      function getPrettyContext({
        start,
        end
      }, cst, maxWidth = 80) {
        let src = getLine(start.line, cst);
        if (!src)
          return null;
        let {
          col
        } = start;
        if (src.length > maxWidth) {
          if (col <= maxWidth - 10) {
            src = src.substr(0, maxWidth - 1) + "\u2026";
          } else {
            const halfWidth = Math.round(maxWidth / 2);
            if (src.length > col + halfWidth)
              src = src.substr(0, col + halfWidth - 1) + "\u2026";
            col -= src.length - maxWidth;
            src = "\u2026" + src.substr(1 - maxWidth);
          }
        }
        let errLen = 1;
        let errEnd = "";
        if (end) {
          if (end.line === start.line && col + (end.col - start.col) <= maxWidth + 1) {
            errLen = end.col - start.col;
          } else {
            errLen = Math.min(src.length + 1, maxWidth) - col;
            errEnd = "\u2026";
          }
        }
        const offset = col > 1 ? " ".repeat(col - 1) : "";
        const err = "^".repeat(errLen);
        return `${src}
${offset}${err}${errEnd}`;
      }
      var Range = class {
        static copy(orig) {
          return new Range(orig.start, orig.end);
        }
        constructor(start, end) {
          this.start = start;
          this.end = end || start;
        }
        isEmpty() {
          return typeof this.start !== "number" || !this.end || this.end <= this.start;
        }
        setOrigRange(cr, offset) {
          const {
            start,
            end
          } = this;
          if (cr.length === 0 || end <= cr[0]) {
            this.origStart = start;
            this.origEnd = end;
            return offset;
          }
          let i = offset;
          while (i < cr.length) {
            if (cr[i] > start)
              break;
            else
              ++i;
          }
          this.origStart = start + i;
          const nextOffset = i;
          while (i < cr.length) {
            if (cr[i] >= end)
              break;
            else
              ++i;
          }
          this.origEnd = end + i;
          return nextOffset;
        }
      };
      var Node2 = class {
        static addStringTerminator(src, offset, str) {
          if (str[str.length - 1] === "\n")
            return str;
          const next = Node2.endOfWhiteSpace(src, offset);
          return next >= src.length || src[next] === "\n" ? str + "\n" : str;
        }
        static atDocumentBoundary(src, offset, sep) {
          const ch0 = src[offset];
          if (!ch0)
            return true;
          const prev = src[offset - 1];
          if (prev && prev !== "\n")
            return false;
          if (sep) {
            if (ch0 !== sep)
              return false;
          } else {
            if (ch0 !== Char.DIRECTIVES_END && ch0 !== Char.DOCUMENT_END)
              return false;
          }
          const ch1 = src[offset + 1];
          const ch2 = src[offset + 2];
          if (ch1 !== ch0 || ch2 !== ch0)
            return false;
          const ch3 = src[offset + 3];
          return !ch3 || ch3 === "\n" || ch3 === "	" || ch3 === " ";
        }
        static endOfIdentifier(src, offset) {
          let ch = src[offset];
          const isVerbatim = ch === "<";
          const notOk = isVerbatim ? ["\n", "	", " ", ">"] : ["\n", "	", " ", "[", "]", "{", "}", ","];
          while (ch && notOk.indexOf(ch) === -1)
            ch = src[offset += 1];
          if (isVerbatim && ch === ">")
            offset += 1;
          return offset;
        }
        static endOfIndent(src, offset) {
          let ch = src[offset];
          while (ch === " ")
            ch = src[offset += 1];
          return offset;
        }
        static endOfLine(src, offset) {
          let ch = src[offset];
          while (ch && ch !== "\n")
            ch = src[offset += 1];
          return offset;
        }
        static endOfWhiteSpace(src, offset) {
          let ch = src[offset];
          while (ch === "	" || ch === " ")
            ch = src[offset += 1];
          return offset;
        }
        static startOfLine(src, offset) {
          let ch = src[offset - 1];
          if (ch === "\n")
            return offset;
          while (ch && ch !== "\n")
            ch = src[offset -= 1];
          return offset + 1;
        }
        static endOfBlockIndent(src, indent, lineStart) {
          const inEnd = Node2.endOfIndent(src, lineStart);
          if (inEnd > lineStart + indent) {
            return inEnd;
          } else {
            const wsEnd = Node2.endOfWhiteSpace(src, inEnd);
            const ch = src[wsEnd];
            if (!ch || ch === "\n")
              return wsEnd;
          }
          return null;
        }
        static atBlank(src, offset, endAsBlank) {
          const ch = src[offset];
          return ch === "\n" || ch === "	" || ch === " " || endAsBlank && !ch;
        }
        static nextNodeIsIndented(ch, indentDiff, indicatorAsIndent) {
          if (!ch || indentDiff < 0)
            return false;
          if (indentDiff > 0)
            return true;
          return indicatorAsIndent && ch === "-";
        }
        static normalizeOffset(src, offset) {
          const ch = src[offset];
          return !ch ? offset : ch !== "\n" && src[offset - 1] === "\n" ? offset - 1 : Node2.endOfWhiteSpace(src, offset);
        }
        static foldNewline(src, offset, indent) {
          let inCount = 0;
          let error = false;
          let fold = "";
          let ch = src[offset + 1];
          while (ch === " " || ch === "	" || ch === "\n") {
            switch (ch) {
              case "\n":
                inCount = 0;
                offset += 1;
                fold += "\n";
                break;
              case "	":
                if (inCount <= indent)
                  error = true;
                offset = Node2.endOfWhiteSpace(src, offset + 2) - 1;
                break;
              case " ":
                inCount += 1;
                offset += 1;
                break;
            }
            ch = src[offset + 1];
          }
          if (!fold)
            fold = " ";
          if (ch && inCount <= indent)
            error = true;
          return {
            fold,
            offset,
            error
          };
        }
        constructor(type, props, context) {
          Object.defineProperty(this, "context", {
            value: context || null,
            writable: true
          });
          this.error = null;
          this.range = null;
          this.valueRange = null;
          this.props = props || [];
          this.type = type;
          this.value = null;
        }
        getPropValue(idx, key, skipKey) {
          if (!this.context)
            return null;
          const {
            src
          } = this.context;
          const prop = this.props[idx];
          return prop && src[prop.start] === key ? src.slice(prop.start + (skipKey ? 1 : 0), prop.end) : null;
        }
        get anchor() {
          for (let i = 0; i < this.props.length; ++i) {
            const anchor = this.getPropValue(i, Char.ANCHOR, true);
            if (anchor != null)
              return anchor;
          }
          return null;
        }
        get comment() {
          const comments = [];
          for (let i = 0; i < this.props.length; ++i) {
            const comment = this.getPropValue(i, Char.COMMENT, true);
            if (comment != null)
              comments.push(comment);
          }
          return comments.length > 0 ? comments.join("\n") : null;
        }
        commentHasRequiredWhitespace(start) {
          const {
            src
          } = this.context;
          if (this.header && start === this.header.end)
            return false;
          if (!this.valueRange)
            return false;
          const {
            end
          } = this.valueRange;
          return start !== end || Node2.atBlank(src, end - 1);
        }
        get hasComment() {
          if (this.context) {
            const {
              src
            } = this.context;
            for (let i = 0; i < this.props.length; ++i) {
              if (src[this.props[i].start] === Char.COMMENT)
                return true;
            }
          }
          return false;
        }
        get hasProps() {
          if (this.context) {
            const {
              src
            } = this.context;
            for (let i = 0; i < this.props.length; ++i) {
              if (src[this.props[i].start] !== Char.COMMENT)
                return true;
            }
          }
          return false;
        }
        get includesTrailingLines() {
          return false;
        }
        get jsonLike() {
          const jsonLikeTypes = [Type.FLOW_MAP, Type.FLOW_SEQ, Type.QUOTE_DOUBLE, Type.QUOTE_SINGLE];
          return jsonLikeTypes.indexOf(this.type) !== -1;
        }
        get rangeAsLinePos() {
          if (!this.range || !this.context)
            return void 0;
          const start = getLinePos(this.range.start, this.context.root);
          if (!start)
            return void 0;
          const end = getLinePos(this.range.end, this.context.root);
          return {
            start,
            end
          };
        }
        get rawValue() {
          if (!this.valueRange || !this.context)
            return null;
          const {
            start,
            end
          } = this.valueRange;
          return this.context.src.slice(start, end);
        }
        get tag() {
          for (let i = 0; i < this.props.length; ++i) {
            const tag = this.getPropValue(i, Char.TAG, false);
            if (tag != null) {
              if (tag[1] === "<") {
                return {
                  verbatim: tag.slice(2, -1)
                };
              } else {
                const [_, handle, suffix] = tag.match(/^(.*!)([^!]*)$/);
                return {
                  handle,
                  suffix
                };
              }
            }
          }
          return null;
        }
        get valueRangeContainsNewline() {
          if (!this.valueRange || !this.context)
            return false;
          const {
            start,
            end
          } = this.valueRange;
          const {
            src
          } = this.context;
          for (let i = start; i < end; ++i) {
            if (src[i] === "\n")
              return true;
          }
          return false;
        }
        parseComment(start) {
          const {
            src
          } = this.context;
          if (src[start] === Char.COMMENT) {
            const end = Node2.endOfLine(src, start + 1);
            const commentRange = new Range(start, end);
            this.props.push(commentRange);
            return end;
          }
          return start;
        }
        setOrigRanges(cr, offset) {
          if (this.range)
            offset = this.range.setOrigRange(cr, offset);
          if (this.valueRange)
            this.valueRange.setOrigRange(cr, offset);
          this.props.forEach((prop) => prop.setOrigRange(cr, offset));
          return offset;
        }
        toString() {
          const {
            context: {
              src
            },
            range,
            value
          } = this;
          if (value != null)
            return value;
          const str = src.slice(range.start, range.end);
          return Node2.addStringTerminator(src, range.end, str);
        }
      };
      var YAMLError = class extends Error {
        constructor(name, source, message) {
          if (!message || !(source instanceof Node2))
            throw new Error(`Invalid arguments for new ${name}`);
          super();
          this.name = name;
          this.message = message;
          this.source = source;
        }
        makePretty() {
          if (!this.source)
            return;
          this.nodeType = this.source.type;
          const cst = this.source.context && this.source.context.root;
          if (typeof this.offset === "number") {
            this.range = new Range(this.offset, this.offset + 1);
            const start = cst && getLinePos(this.offset, cst);
            if (start) {
              const end = {
                line: start.line,
                col: start.col + 1
              };
              this.linePos = {
                start,
                end
              };
            }
            delete this.offset;
          } else {
            this.range = this.source.range;
            this.linePos = this.source.rangeAsLinePos;
          }
          if (this.linePos) {
            const {
              line,
              col
            } = this.linePos.start;
            this.message += ` at line ${line}, column ${col}`;
            const ctx = cst && getPrettyContext(this.linePos, cst);
            if (ctx)
              this.message += `:

${ctx}
`;
          }
          delete this.source;
        }
      };
      var YAMLReferenceError = class extends YAMLError {
        constructor(source, message) {
          super("YAMLReferenceError", source, message);
        }
      };
      var YAMLSemanticError = class extends YAMLError {
        constructor(source, message) {
          super("YAMLSemanticError", source, message);
        }
      };
      var YAMLSyntaxError = class extends YAMLError {
        constructor(source, message) {
          super("YAMLSyntaxError", source, message);
        }
      };
      var YAMLWarning = class extends YAMLError {
        constructor(source, message) {
          super("YAMLWarning", source, message);
        }
      };
      function _defineProperty(obj, key, value) {
        if (key in obj) {
          Object.defineProperty(obj, key, {
            value,
            enumerable: true,
            configurable: true,
            writable: true
          });
        } else {
          obj[key] = value;
        }
        return obj;
      }
      var PlainValue = class extends Node2 {
        static endOfLine(src, start, inFlow) {
          let ch = src[start];
          let offset = start;
          while (ch && ch !== "\n") {
            if (inFlow && (ch === "[" || ch === "]" || ch === "{" || ch === "}" || ch === ","))
              break;
            const next = src[offset + 1];
            if (ch === ":" && (!next || next === "\n" || next === "	" || next === " " || inFlow && next === ","))
              break;
            if ((ch === " " || ch === "	") && next === "#")
              break;
            offset += 1;
            ch = next;
          }
          return offset;
        }
        get strValue() {
          if (!this.valueRange || !this.context)
            return null;
          let {
            start,
            end
          } = this.valueRange;
          const {
            src
          } = this.context;
          let ch = src[end - 1];
          while (start < end && (ch === "\n" || ch === "	" || ch === " "))
            ch = src[--end - 1];
          let str = "";
          for (let i = start; i < end; ++i) {
            const ch2 = src[i];
            if (ch2 === "\n") {
              const {
                fold,
                offset
              } = Node2.foldNewline(src, i, -1);
              str += fold;
              i = offset;
            } else if (ch2 === " " || ch2 === "	") {
              const wsStart = i;
              let next = src[i + 1];
              while (i < end && (next === " " || next === "	")) {
                i += 1;
                next = src[i + 1];
              }
              if (next !== "\n")
                str += i > wsStart ? src.slice(wsStart, i + 1) : ch2;
            } else {
              str += ch2;
            }
          }
          const ch0 = src[start];
          switch (ch0) {
            case "	": {
              const msg = "Plain value cannot start with a tab character";
              const errors = [new YAMLSemanticError(this, msg)];
              return {
                errors,
                str
              };
            }
            case "@":
            case "`": {
              const msg = `Plain value cannot start with reserved character ${ch0}`;
              const errors = [new YAMLSemanticError(this, msg)];
              return {
                errors,
                str
              };
            }
            default:
              return str;
          }
        }
        parseBlockValue(start) {
          const {
            indent,
            inFlow,
            src
          } = this.context;
          let offset = start;
          let valueEnd = start;
          for (let ch = src[offset]; ch === "\n"; ch = src[offset]) {
            if (Node2.atDocumentBoundary(src, offset + 1))
              break;
            const end = Node2.endOfBlockIndent(src, indent, offset + 1);
            if (end === null || src[end] === "#")
              break;
            if (src[end] === "\n") {
              offset = end;
            } else {
              valueEnd = PlainValue.endOfLine(src, end, inFlow);
              offset = valueEnd;
            }
          }
          if (this.valueRange.isEmpty())
            this.valueRange.start = start;
          this.valueRange.end = valueEnd;
          return valueEnd;
        }
        parse(context, start) {
          this.context = context;
          const {
            inFlow,
            src
          } = context;
          let offset = start;
          const ch = src[offset];
          if (ch && ch !== "#" && ch !== "\n") {
            offset = PlainValue.endOfLine(src, start, inFlow);
          }
          this.valueRange = new Range(start, offset);
          offset = Node2.endOfWhiteSpace(src, offset);
          offset = this.parseComment(offset);
          if (!this.hasComment || this.valueRange.isEmpty()) {
            offset = this.parseBlockValue(offset);
          }
          return offset;
        }
      };
      exports.Char = Char;
      exports.Node = Node2;
      exports.PlainValue = PlainValue;
      exports.Range = Range;
      exports.Type = Type;
      exports.YAMLError = YAMLError;
      exports.YAMLReferenceError = YAMLReferenceError;
      exports.YAMLSemanticError = YAMLSemanticError;
      exports.YAMLSyntaxError = YAMLSyntaxError;
      exports.YAMLWarning = YAMLWarning;
      exports._defineProperty = _defineProperty;
      exports.defaultTagPrefix = defaultTagPrefix;
      exports.defaultTags = defaultTags;
    }
  });

  // node_modules/yaml/dist/resolveSeq-d03cb037.js
  var require_resolveSeq_d03cb037 = __commonJS({
    "node_modules/yaml/dist/resolveSeq-d03cb037.js"(exports) {
      "use strict";
      var PlainValue = require_PlainValue_ec8e588e();
      function addCommentBefore(str, indent, comment) {
        if (!comment)
          return str;
        const cc = comment.replace(/[\s\S]^/gm, `$&${indent}#`);
        return `#${cc}
${indent}${str}`;
      }
      function addComment(str, indent, comment) {
        return !comment ? str : comment.indexOf("\n") === -1 ? `${str} #${comment}` : `${str}
` + comment.replace(/^/gm, `${indent || ""}#`);
      }
      var Node2 = class {
      };
      function toJSON(value, arg, ctx) {
        if (Array.isArray(value))
          return value.map((v, i) => toJSON(v, String(i), ctx));
        if (value && typeof value.toJSON === "function") {
          const anchor = ctx && ctx.anchors && ctx.anchors.get(value);
          if (anchor)
            ctx.onCreate = (res2) => {
              anchor.res = res2;
              delete ctx.onCreate;
            };
          const res = value.toJSON(arg, ctx);
          if (anchor && ctx.onCreate)
            ctx.onCreate(res);
          return res;
        }
        if ((!ctx || !ctx.keep) && typeof value === "bigint")
          return Number(value);
        return value;
      }
      var Scalar2 = class extends Node2 {
        constructor(value) {
          super();
          this.value = value;
        }
        toJSON(arg, ctx) {
          return ctx && ctx.keep ? this.value : toJSON(this.value, arg, ctx);
        }
        toString() {
          return String(this.value);
        }
      };
      function collectionFromPath(schema, path, value) {
        let v = value;
        for (let i = path.length - 1; i >= 0; --i) {
          const k = path[i];
          if (Number.isInteger(k) && k >= 0) {
            const a = [];
            a[k] = v;
            v = a;
          } else {
            const o = {};
            Object.defineProperty(o, k, {
              value: v,
              writable: true,
              enumerable: true,
              configurable: true
            });
            v = o;
          }
        }
        return schema.createNode(v, false);
      }
      var isEmptyPath = (path) => path == null || typeof path === "object" && path[Symbol.iterator]().next().done;
      var Collection2 = class extends Node2 {
        constructor(schema) {
          super();
          PlainValue._defineProperty(this, "items", []);
          this.schema = schema;
        }
        addIn(path, value) {
          if (isEmptyPath(path))
            this.add(value);
          else {
            const [key, ...rest] = path;
            const node = this.get(key, true);
            if (node instanceof Collection2)
              node.addIn(rest, value);
            else if (node === void 0 && this.schema)
              this.set(key, collectionFromPath(this.schema, rest, value));
            else
              throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
          }
        }
        deleteIn([key, ...rest]) {
          if (rest.length === 0)
            return this.delete(key);
          const node = this.get(key, true);
          if (node instanceof Collection2)
            return node.deleteIn(rest);
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
        getIn([key, ...rest], keepScalar) {
          const node = this.get(key, true);
          if (rest.length === 0)
            return !keepScalar && node instanceof Scalar2 ? node.value : node;
          else
            return node instanceof Collection2 ? node.getIn(rest, keepScalar) : void 0;
        }
        hasAllNullValues() {
          return this.items.every((node) => {
            if (!node || node.type !== "PAIR")
              return false;
            const n = node.value;
            return n == null || n instanceof Scalar2 && n.value == null && !n.commentBefore && !n.comment && !n.tag;
          });
        }
        hasIn([key, ...rest]) {
          if (rest.length === 0)
            return this.has(key);
          const node = this.get(key, true);
          return node instanceof Collection2 ? node.hasIn(rest) : false;
        }
        setIn([key, ...rest], value) {
          if (rest.length === 0) {
            this.set(key, value);
          } else {
            const node = this.get(key, true);
            if (node instanceof Collection2)
              node.setIn(rest, value);
            else if (node === void 0 && this.schema)
              this.set(key, collectionFromPath(this.schema, rest, value));
            else
              throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
          }
        }
        toJSON() {
          return null;
        }
        toString(ctx, {
          blockItem,
          flowChars,
          isMap,
          itemIndent
        }, onComment, onChompKeep) {
          const {
            indent,
            indentStep,
            stringify
          } = ctx;
          const inFlow = this.type === PlainValue.Type.FLOW_MAP || this.type === PlainValue.Type.FLOW_SEQ || ctx.inFlow;
          if (inFlow)
            itemIndent += indentStep;
          const allNullValues = isMap && this.hasAllNullValues();
          ctx = Object.assign({}, ctx, {
            allNullValues,
            indent: itemIndent,
            inFlow,
            type: null
          });
          let chompKeep = false;
          let hasItemWithNewLine = false;
          const nodes = this.items.reduce((nodes2, item, i) => {
            let comment;
            if (item) {
              if (!chompKeep && item.spaceBefore)
                nodes2.push({
                  type: "comment",
                  str: ""
                });
              if (item.commentBefore)
                item.commentBefore.match(/^.*$/gm).forEach((line) => {
                  nodes2.push({
                    type: "comment",
                    str: `#${line}`
                  });
                });
              if (item.comment)
                comment = item.comment;
              if (inFlow && (!chompKeep && item.spaceBefore || item.commentBefore || item.comment || item.key && (item.key.commentBefore || item.key.comment) || item.value && (item.value.commentBefore || item.value.comment)))
                hasItemWithNewLine = true;
            }
            chompKeep = false;
            let str2 = stringify(item, ctx, () => comment = null, () => chompKeep = true);
            if (inFlow && !hasItemWithNewLine && str2.includes("\n"))
              hasItemWithNewLine = true;
            if (inFlow && i < this.items.length - 1)
              str2 += ",";
            str2 = addComment(str2, itemIndent, comment);
            if (chompKeep && (comment || inFlow))
              chompKeep = false;
            nodes2.push({
              type: "item",
              str: str2
            });
            return nodes2;
          }, []);
          let str;
          if (nodes.length === 0) {
            str = flowChars.start + flowChars.end;
          } else if (inFlow) {
            const {
              start,
              end
            } = flowChars;
            const strings = nodes.map((n) => n.str);
            if (hasItemWithNewLine || strings.reduce((sum, str2) => sum + str2.length + 2, 2) > Collection2.maxFlowStringSingleLineLength) {
              str = start;
              for (const s of strings) {
                str += s ? `
${indentStep}${indent}${s}` : "\n";
              }
              str += `
${indent}${end}`;
            } else {
              str = `${start} ${strings.join(" ")} ${end}`;
            }
          } else {
            const strings = nodes.map(blockItem);
            str = strings.shift();
            for (const s of strings)
              str += s ? `
${indent}${s}` : "\n";
          }
          if (this.comment) {
            str += "\n" + this.comment.replace(/^/gm, `${indent}#`);
            if (onComment)
              onComment();
          } else if (chompKeep && onChompKeep)
            onChompKeep();
          return str;
        }
      };
      PlainValue._defineProperty(Collection2, "maxFlowStringSingleLineLength", 60);
      function asItemIndex(key) {
        let idx = key instanceof Scalar2 ? key.value : key;
        if (idx && typeof idx === "string")
          idx = Number(idx);
        return Number.isInteger(idx) && idx >= 0 ? idx : null;
      }
      var YAMLSeq2 = class extends Collection2 {
        add(value) {
          this.items.push(value);
        }
        delete(key) {
          const idx = asItemIndex(key);
          if (typeof idx !== "number")
            return false;
          const del = this.items.splice(idx, 1);
          return del.length > 0;
        }
        get(key, keepScalar) {
          const idx = asItemIndex(key);
          if (typeof idx !== "number")
            return void 0;
          const it = this.items[idx];
          return !keepScalar && it instanceof Scalar2 ? it.value : it;
        }
        has(key) {
          const idx = asItemIndex(key);
          return typeof idx === "number" && idx < this.items.length;
        }
        set(key, value) {
          const idx = asItemIndex(key);
          if (typeof idx !== "number")
            throw new Error(`Expected a valid index, not ${key}.`);
          this.items[idx] = value;
        }
        toJSON(_, ctx) {
          const seq = [];
          if (ctx && ctx.onCreate)
            ctx.onCreate(seq);
          let i = 0;
          for (const item of this.items)
            seq.push(toJSON(item, String(i++), ctx));
          return seq;
        }
        toString(ctx, onComment, onChompKeep) {
          if (!ctx)
            return JSON.stringify(this);
          return super.toString(ctx, {
            blockItem: (n) => n.type === "comment" ? n.str : `- ${n.str}`,
            flowChars: {
              start: "[",
              end: "]"
            },
            isMap: false,
            itemIndent: (ctx.indent || "") + "  "
          }, onComment, onChompKeep);
        }
      };
      var stringifyKey = (key, jsKey, ctx) => {
        if (jsKey === null)
          return "";
        if (typeof jsKey !== "object")
          return String(jsKey);
        if (key instanceof Node2 && ctx && ctx.doc)
          return key.toString({
            anchors: /* @__PURE__ */ Object.create(null),
            doc: ctx.doc,
            indent: "",
            indentStep: ctx.indentStep,
            inFlow: true,
            inStringifyKey: true,
            stringify: ctx.stringify
          });
        return JSON.stringify(jsKey);
      };
      var Pair2 = class extends Node2 {
        constructor(key, value = null) {
          super();
          this.key = key;
          this.value = value;
          this.type = Pair2.Type.PAIR;
        }
        get commentBefore() {
          return this.key instanceof Node2 ? this.key.commentBefore : void 0;
        }
        set commentBefore(cb) {
          if (this.key == null)
            this.key = new Scalar2(null);
          if (this.key instanceof Node2)
            this.key.commentBefore = cb;
          else {
            const msg = "Pair.commentBefore is an alias for Pair.key.commentBefore. To set it, the key must be a Node.";
            throw new Error(msg);
          }
        }
        addToJSMap(ctx, map) {
          const key = toJSON(this.key, "", ctx);
          if (map instanceof Map) {
            const value = toJSON(this.value, key, ctx);
            map.set(key, value);
          } else if (map instanceof Set) {
            map.add(key);
          } else {
            const stringKey = stringifyKey(this.key, key, ctx);
            const value = toJSON(this.value, stringKey, ctx);
            if (stringKey in map)
              Object.defineProperty(map, stringKey, {
                value,
                writable: true,
                enumerable: true,
                configurable: true
              });
            else
              map[stringKey] = value;
          }
          return map;
        }
        toJSON(_, ctx) {
          const pair = ctx && ctx.mapAsMap ? /* @__PURE__ */ new Map() : {};
          return this.addToJSMap(ctx, pair);
        }
        toString(ctx, onComment, onChompKeep) {
          if (!ctx || !ctx.doc)
            return JSON.stringify(this);
          const {
            indent: indentSize,
            indentSeq,
            simpleKeys
          } = ctx.doc.options;
          let {
            key,
            value
          } = this;
          let keyComment = key instanceof Node2 && key.comment;
          if (simpleKeys) {
            if (keyComment) {
              throw new Error("With simple keys, key nodes cannot have comments");
            }
            if (key instanceof Collection2) {
              const msg = "With simple keys, collection cannot be used as a key value";
              throw new Error(msg);
            }
          }
          let explicitKey = !simpleKeys && (!key || keyComment || (key instanceof Node2 ? key instanceof Collection2 || key.type === PlainValue.Type.BLOCK_FOLDED || key.type === PlainValue.Type.BLOCK_LITERAL : typeof key === "object"));
          const {
            doc,
            indent,
            indentStep,
            stringify
          } = ctx;
          ctx = Object.assign({}, ctx, {
            implicitKey: !explicitKey,
            indent: indent + indentStep
          });
          let chompKeep = false;
          let str = stringify(key, ctx, () => keyComment = null, () => chompKeep = true);
          str = addComment(str, ctx.indent, keyComment);
          if (!explicitKey && str.length > 1024) {
            if (simpleKeys)
              throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
            explicitKey = true;
          }
          if (ctx.allNullValues && !simpleKeys) {
            if (this.comment) {
              str = addComment(str, ctx.indent, this.comment);
              if (onComment)
                onComment();
            } else if (chompKeep && !keyComment && onChompKeep)
              onChompKeep();
            return ctx.inFlow && !explicitKey ? str : `? ${str}`;
          }
          str = explicitKey ? `? ${str}
${indent}:` : `${str}:`;
          if (this.comment) {
            str = addComment(str, ctx.indent, this.comment);
            if (onComment)
              onComment();
          }
          let vcb = "";
          let valueComment = null;
          if (value instanceof Node2) {
            if (value.spaceBefore)
              vcb = "\n";
            if (value.commentBefore) {
              const cs = value.commentBefore.replace(/^/gm, `${ctx.indent}#`);
              vcb += `
${cs}`;
            }
            valueComment = value.comment;
          } else if (value && typeof value === "object") {
            value = doc.schema.createNode(value, true);
          }
          ctx.implicitKey = false;
          if (!explicitKey && !this.comment && value instanceof Scalar2)
            ctx.indentAtStart = str.length + 1;
          chompKeep = false;
          if (!indentSeq && indentSize >= 2 && !ctx.inFlow && !explicitKey && value instanceof YAMLSeq2 && value.type !== PlainValue.Type.FLOW_SEQ && !value.tag && !doc.anchors.getName(value)) {
            ctx.indent = ctx.indent.substr(2);
          }
          const valueStr = stringify(value, ctx, () => valueComment = null, () => chompKeep = true);
          let ws = " ";
          if (vcb || this.comment) {
            ws = `${vcb}
${ctx.indent}`;
          } else if (!explicitKey && value instanceof Collection2) {
            const flow = valueStr[0] === "[" || valueStr[0] === "{";
            if (!flow || valueStr.includes("\n"))
              ws = `
${ctx.indent}`;
          } else if (valueStr[0] === "\n")
            ws = "";
          if (chompKeep && !valueComment && onChompKeep)
            onChompKeep();
          return addComment(str + ws + valueStr, ctx.indent, valueComment);
        }
      };
      PlainValue._defineProperty(Pair2, "Type", {
        PAIR: "PAIR",
        MERGE_PAIR: "MERGE_PAIR"
      });
      var getAliasCount = (node, anchors) => {
        if (node instanceof Alias2) {
          const anchor = anchors.get(node.source);
          return anchor.count * anchor.aliasCount;
        } else if (node instanceof Collection2) {
          let count = 0;
          for (const item of node.items) {
            const c = getAliasCount(item, anchors);
            if (c > count)
              count = c;
          }
          return count;
        } else if (node instanceof Pair2) {
          const kc = getAliasCount(node.key, anchors);
          const vc = getAliasCount(node.value, anchors);
          return Math.max(kc, vc);
        }
        return 1;
      };
      var Alias2 = class extends Node2 {
        static stringify({
          range,
          source
        }, {
          anchors,
          doc,
          implicitKey,
          inStringifyKey
        }) {
          let anchor = Object.keys(anchors).find((a) => anchors[a] === source);
          if (!anchor && inStringifyKey)
            anchor = doc.anchors.getName(source) || doc.anchors.newName();
          if (anchor)
            return `*${anchor}${implicitKey ? " " : ""}`;
          const msg = doc.anchors.getName(source) ? "Alias node must be after source node" : "Source node not found for alias node";
          throw new Error(`${msg} [${range}]`);
        }
        constructor(source) {
          super();
          this.source = source;
          this.type = PlainValue.Type.ALIAS;
        }
        set tag(t) {
          throw new Error("Alias nodes cannot have tags");
        }
        toJSON(arg, ctx) {
          if (!ctx)
            return toJSON(this.source, arg, ctx);
          const {
            anchors,
            maxAliasCount
          } = ctx;
          const anchor = anchors.get(this.source);
          if (!anchor || anchor.res === void 0) {
            const msg = "This should not happen: Alias anchor was not resolved?";
            if (this.cstNode)
              throw new PlainValue.YAMLReferenceError(this.cstNode, msg);
            else
              throw new ReferenceError(msg);
          }
          if (maxAliasCount >= 0) {
            anchor.count += 1;
            if (anchor.aliasCount === 0)
              anchor.aliasCount = getAliasCount(this.source, anchors);
            if (anchor.count * anchor.aliasCount > maxAliasCount) {
              const msg = "Excessive alias count indicates a resource exhaustion attack";
              if (this.cstNode)
                throw new PlainValue.YAMLReferenceError(this.cstNode, msg);
              else
                throw new ReferenceError(msg);
            }
          }
          return anchor.res;
        }
        toString(ctx) {
          return Alias2.stringify(this, ctx);
        }
      };
      PlainValue._defineProperty(Alias2, "default", true);
      function findPair(items, key) {
        const k = key instanceof Scalar2 ? key.value : key;
        for (const it of items) {
          if (it instanceof Pair2) {
            if (it.key === key || it.key === k)
              return it;
            if (it.key && it.key.value === k)
              return it;
          }
        }
        return void 0;
      }
      var YAMLMap2 = class extends Collection2 {
        add(pair, overwrite) {
          if (!pair)
            pair = new Pair2(pair);
          else if (!(pair instanceof Pair2))
            pair = new Pair2(pair.key || pair, pair.value);
          const prev = findPair(this.items, pair.key);
          const sortEntries = this.schema && this.schema.sortMapEntries;
          if (prev) {
            if (overwrite)
              prev.value = pair.value;
            else
              throw new Error(`Key ${pair.key} already set`);
          } else if (sortEntries) {
            const i = this.items.findIndex((item) => sortEntries(pair, item) < 0);
            if (i === -1)
              this.items.push(pair);
            else
              this.items.splice(i, 0, pair);
          } else {
            this.items.push(pair);
          }
        }
        delete(key) {
          const it = findPair(this.items, key);
          if (!it)
            return false;
          const del = this.items.splice(this.items.indexOf(it), 1);
          return del.length > 0;
        }
        get(key, keepScalar) {
          const it = findPair(this.items, key);
          const node = it && it.value;
          return !keepScalar && node instanceof Scalar2 ? node.value : node;
        }
        has(key) {
          return !!findPair(this.items, key);
        }
        set(key, value) {
          this.add(new Pair2(key, value), true);
        }
        toJSON(_, ctx, Type) {
          const map = Type ? new Type() : ctx && ctx.mapAsMap ? /* @__PURE__ */ new Map() : {};
          if (ctx && ctx.onCreate)
            ctx.onCreate(map);
          for (const item of this.items)
            item.addToJSMap(ctx, map);
          return map;
        }
        toString(ctx, onComment, onChompKeep) {
          if (!ctx)
            return JSON.stringify(this);
          for (const item of this.items) {
            if (!(item instanceof Pair2))
              throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
          }
          return super.toString(ctx, {
            blockItem: (n) => n.str,
            flowChars: {
              start: "{",
              end: "}"
            },
            isMap: true,
            itemIndent: ctx.indent || ""
          }, onComment, onChompKeep);
        }
      };
      var MERGE_KEY = "<<";
      var Merge2 = class extends Pair2 {
        constructor(pair) {
          if (pair instanceof Pair2) {
            let seq = pair.value;
            if (!(seq instanceof YAMLSeq2)) {
              seq = new YAMLSeq2();
              seq.items.push(pair.value);
              seq.range = pair.value.range;
            }
            super(pair.key, seq);
            this.range = pair.range;
          } else {
            super(new Scalar2(MERGE_KEY), new YAMLSeq2());
          }
          this.type = Pair2.Type.MERGE_PAIR;
        }
        addToJSMap(ctx, map) {
          for (const {
            source
          } of this.value.items) {
            if (!(source instanceof YAMLMap2))
              throw new Error("Merge sources must be maps");
            const srcMap = source.toJSON(null, ctx, Map);
            for (const [key, value] of srcMap) {
              if (map instanceof Map) {
                if (!map.has(key))
                  map.set(key, value);
              } else if (map instanceof Set) {
                map.add(key);
              } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
                Object.defineProperty(map, key, {
                  value,
                  writable: true,
                  enumerable: true,
                  configurable: true
                });
              }
            }
          }
          return map;
        }
        toString(ctx, onComment) {
          const seq = this.value;
          if (seq.items.length > 1)
            return super.toString(ctx, onComment);
          this.value = seq.items[0];
          const str = super.toString(ctx, onComment);
          this.value = seq;
          return str;
        }
      };
      var binaryOptions2 = {
        defaultType: PlainValue.Type.BLOCK_LITERAL,
        lineWidth: 76
      };
      var boolOptions2 = {
        trueStr: "true",
        falseStr: "false"
      };
      var intOptions2 = {
        asBigInt: false
      };
      var nullOptions2 = {
        nullStr: "null"
      };
      var strOptions2 = {
        defaultType: PlainValue.Type.PLAIN,
        doubleQuoted: {
          jsonEncoding: false,
          minMultiLineLength: 40
        },
        fold: {
          lineWidth: 80,
          minContentWidth: 20
        }
      };
      function resolveScalar(str, tags, scalarFallback) {
        for (const {
          format,
          test,
          resolve: resolve2
        } of tags) {
          if (test) {
            const match = str.match(test);
            if (match) {
              let res = resolve2.apply(null, match);
              if (!(res instanceof Scalar2))
                res = new Scalar2(res);
              if (format)
                res.format = format;
              return res;
            }
          }
        }
        if (scalarFallback)
          str = scalarFallback(str);
        return new Scalar2(str);
      }
      var FOLD_FLOW = "flow";
      var FOLD_BLOCK = "block";
      var FOLD_QUOTED = "quoted";
      var consumeMoreIndentedLines = (text, i) => {
        let ch = text[i + 1];
        while (ch === " " || ch === "	") {
          do {
            ch = text[i += 1];
          } while (ch && ch !== "\n");
          ch = text[i + 1];
        }
        return i;
      };
      function foldFlowLines(text, indent, mode, {
        indentAtStart,
        lineWidth = 80,
        minContentWidth = 20,
        onFold,
        onOverflow
      }) {
        if (!lineWidth || lineWidth < 0)
          return text;
        const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
        if (text.length <= endStep)
          return text;
        const folds = [];
        const escapedFolds = {};
        let end = lineWidth - indent.length;
        if (typeof indentAtStart === "number") {
          if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
            folds.push(0);
          else
            end = lineWidth - indentAtStart;
        }
        let split = void 0;
        let prev = void 0;
        let overflow = false;
        let i = -1;
        let escStart = -1;
        let escEnd = -1;
        if (mode === FOLD_BLOCK) {
          i = consumeMoreIndentedLines(text, i);
          if (i !== -1)
            end = i + endStep;
        }
        for (let ch; ch = text[i += 1]; ) {
          if (mode === FOLD_QUOTED && ch === "\\") {
            escStart = i;
            switch (text[i + 1]) {
              case "x":
                i += 3;
                break;
              case "u":
                i += 5;
                break;
              case "U":
                i += 9;
                break;
              default:
                i += 1;
            }
            escEnd = i;
          }
          if (ch === "\n") {
            if (mode === FOLD_BLOCK)
              i = consumeMoreIndentedLines(text, i);
            end = i + endStep;
            split = void 0;
          } else {
            if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
              const next = text[i + 1];
              if (next && next !== " " && next !== "\n" && next !== "	")
                split = i;
            }
            if (i >= end) {
              if (split) {
                folds.push(split);
                end = split + endStep;
                split = void 0;
              } else if (mode === FOLD_QUOTED) {
                while (prev === " " || prev === "	") {
                  prev = ch;
                  ch = text[i += 1];
                  overflow = true;
                }
                const j = i > escEnd + 1 ? i - 2 : escStart - 1;
                if (escapedFolds[j])
                  return text;
                folds.push(j);
                escapedFolds[j] = true;
                end = j + endStep;
                split = void 0;
              } else {
                overflow = true;
              }
            }
          }
          prev = ch;
        }
        if (overflow && onOverflow)
          onOverflow();
        if (folds.length === 0)
          return text;
        if (onFold)
          onFold();
        let res = text.slice(0, folds[0]);
        for (let i2 = 0; i2 < folds.length; ++i2) {
          const fold = folds[i2];
          const end2 = folds[i2 + 1] || text.length;
          if (fold === 0)
            res = `
${indent}${text.slice(0, end2)}`;
          else {
            if (mode === FOLD_QUOTED && escapedFolds[fold])
              res += `${text[fold]}\\`;
            res += `
${indent}${text.slice(fold + 1, end2)}`;
          }
        }
        return res;
      }
      var getFoldOptions = ({
        indentAtStart
      }) => indentAtStart ? Object.assign({
        indentAtStart
      }, strOptions2.fold) : strOptions2.fold;
      var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
      function lineLengthOverLimit(str, lineWidth, indentLength) {
        if (!lineWidth || lineWidth < 0)
          return false;
        const limit = lineWidth - indentLength;
        const strLen = str.length;
        if (strLen <= limit)
          return false;
        for (let i = 0, start = 0; i < strLen; ++i) {
          if (str[i] === "\n") {
            if (i - start > limit)
              return true;
            start = i + 1;
            if (strLen - start <= limit)
              return false;
          }
        }
        return true;
      }
      function doubleQuotedString(value, ctx) {
        const {
          implicitKey
        } = ctx;
        const {
          jsonEncoding,
          minMultiLineLength
        } = strOptions2.doubleQuoted;
        const json = JSON.stringify(value);
        if (jsonEncoding)
          return json;
        const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
        let str = "";
        let start = 0;
        for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
          if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
            str += json.slice(start, i) + "\\ ";
            i += 1;
            start = i;
            ch = "\\";
          }
          if (ch === "\\")
            switch (json[i + 1]) {
              case "u":
                {
                  str += json.slice(start, i);
                  const code = json.substr(i + 2, 4);
                  switch (code) {
                    case "0000":
                      str += "\\0";
                      break;
                    case "0007":
                      str += "\\a";
                      break;
                    case "000b":
                      str += "\\v";
                      break;
                    case "001b":
                      str += "\\e";
                      break;
                    case "0085":
                      str += "\\N";
                      break;
                    case "00a0":
                      str += "\\_";
                      break;
                    case "2028":
                      str += "\\L";
                      break;
                    case "2029":
                      str += "\\P";
                      break;
                    default:
                      if (code.substr(0, 2) === "00")
                        str += "\\x" + code.substr(2);
                      else
                        str += json.substr(i, 6);
                  }
                  i += 5;
                  start = i + 1;
                }
                break;
              case "n":
                if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
                  i += 1;
                } else {
                  str += json.slice(start, i) + "\n\n";
                  while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                    str += "\n";
                    i += 2;
                  }
                  str += indent;
                  if (json[i + 2] === " ")
                    str += "\\";
                  i += 1;
                  start = i + 1;
                }
                break;
              default:
                i += 1;
            }
        }
        str = start ? str + json.slice(start) : json;
        return implicitKey ? str : foldFlowLines(str, indent, FOLD_QUOTED, getFoldOptions(ctx));
      }
      function singleQuotedString(value, ctx) {
        if (ctx.implicitKey) {
          if (/\n/.test(value))
            return doubleQuotedString(value, ctx);
        } else {
          if (/[ \t]\n|\n[ \t]/.test(value))
            return doubleQuotedString(value, ctx);
        }
        const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
        const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
        return ctx.implicitKey ? res : foldFlowLines(res, indent, FOLD_FLOW, getFoldOptions(ctx));
      }
      function blockString({
        comment,
        type,
        value
      }, ctx, onComment, onChompKeep) {
        if (/\n[\t ]+$/.test(value) || /^\s*$/.test(value)) {
          return doubleQuotedString(value, ctx);
        }
        const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
        const indentSize = indent ? "2" : "1";
        const literal = type === PlainValue.Type.BLOCK_FOLDED ? false : type === PlainValue.Type.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, strOptions2.fold.lineWidth, indent.length);
        let header = literal ? "|" : ">";
        if (!value)
          return header + "\n";
        let wsStart = "";
        let wsEnd = "";
        value = value.replace(/[\n\t ]*$/, (ws) => {
          const n = ws.indexOf("\n");
          if (n === -1) {
            header += "-";
          } else if (value === ws || n !== ws.length - 1) {
            header += "+";
            if (onChompKeep)
              onChompKeep();
          }
          wsEnd = ws.replace(/\n$/, "");
          return "";
        }).replace(/^[\n ]*/, (ws) => {
          if (ws.indexOf(" ") !== -1)
            header += indentSize;
          const m = ws.match(/ +$/);
          if (m) {
            wsStart = ws.slice(0, -m[0].length);
            return m[0];
          } else {
            wsStart = ws;
            return "";
          }
        });
        if (wsEnd)
          wsEnd = wsEnd.replace(/\n+(?!\n|$)/g, `$&${indent}`);
        if (wsStart)
          wsStart = wsStart.replace(/\n+/g, `$&${indent}`);
        if (comment) {
          header += " #" + comment.replace(/ ?[\r\n]+/g, " ");
          if (onComment)
            onComment();
        }
        if (!value)
          return `${header}${indentSize}
${indent}${wsEnd}`;
        if (literal) {
          value = value.replace(/\n+/g, `$&${indent}`);
          return `${header}
${indent}${wsStart}${value}${wsEnd}`;
        }
        value = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        const body = foldFlowLines(`${wsStart}${value}${wsEnd}`, indent, FOLD_BLOCK, strOptions2.fold);
        return `${header}
${indent}${body}`;
      }
      function plainString(item, ctx, onComment, onChompKeep) {
        const {
          comment,
          type,
          value
        } = item;
        const {
          actualString,
          implicitKey,
          indent,
          inFlow
        } = ctx;
        if (implicitKey && /[\n[\]{},]/.test(value) || inFlow && /[[\]{},]/.test(value)) {
          return doubleQuotedString(value, ctx);
        }
        if (!value || /^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
          return implicitKey || inFlow || value.indexOf("\n") === -1 ? value.indexOf('"') !== -1 && value.indexOf("'") === -1 ? singleQuotedString(value, ctx) : doubleQuotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
        }
        if (!implicitKey && !inFlow && type !== PlainValue.Type.PLAIN && value.indexOf("\n") !== -1) {
          return blockString(item, ctx, onComment, onChompKeep);
        }
        if (indent === "" && containsDocumentMarker(value)) {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        }
        const str = value.replace(/\n+/g, `$&
${indent}`);
        if (actualString) {
          const {
            tags
          } = ctx.doc.schema;
          const resolved = resolveScalar(str, tags, tags.scalarFallback).value;
          if (typeof resolved !== "string")
            return doubleQuotedString(value, ctx);
        }
        const body = implicitKey ? str : foldFlowLines(str, indent, FOLD_FLOW, getFoldOptions(ctx));
        if (comment && !inFlow && (body.indexOf("\n") !== -1 || comment.indexOf("\n") !== -1)) {
          if (onComment)
            onComment();
          return addCommentBefore(body, indent, comment);
        }
        return body;
      }
      function stringifyString(item, ctx, onComment, onChompKeep) {
        const {
          defaultType
        } = strOptions2;
        const {
          implicitKey,
          inFlow
        } = ctx;
        let {
          type,
          value
        } = item;
        if (typeof value !== "string") {
          value = String(value);
          item = Object.assign({}, item, {
            value
          });
        }
        const _stringify = (_type) => {
          switch (_type) {
            case PlainValue.Type.BLOCK_FOLDED:
            case PlainValue.Type.BLOCK_LITERAL:
              return blockString(item, ctx, onComment, onChompKeep);
            case PlainValue.Type.QUOTE_DOUBLE:
              return doubleQuotedString(value, ctx);
            case PlainValue.Type.QUOTE_SINGLE:
              return singleQuotedString(value, ctx);
            case PlainValue.Type.PLAIN:
              return plainString(item, ctx, onComment, onChompKeep);
            default:
              return null;
          }
        };
        if (type !== PlainValue.Type.QUOTE_DOUBLE && /[\x00-\x08\x0b-\x1f\x7f-\x9f]/.test(value)) {
          type = PlainValue.Type.QUOTE_DOUBLE;
        } else if ((implicitKey || inFlow) && (type === PlainValue.Type.BLOCK_FOLDED || type === PlainValue.Type.BLOCK_LITERAL)) {
          type = PlainValue.Type.QUOTE_DOUBLE;
        }
        let res = _stringify(type);
        if (res === null) {
          res = _stringify(defaultType);
          if (res === null)
            throw new Error(`Unsupported default string type ${defaultType}`);
        }
        return res;
      }
      function stringifyNumber({
        format,
        minFractionDigits,
        tag,
        value
      }) {
        if (typeof value === "bigint")
          return String(value);
        if (!isFinite(value))
          return isNaN(value) ? ".nan" : value < 0 ? "-.inf" : ".inf";
        let n = JSON.stringify(value);
        if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^\d/.test(n)) {
          let i = n.indexOf(".");
          if (i < 0) {
            i = n.length;
            n += ".";
          }
          let d = minFractionDigits - (n.length - i - 1);
          while (d-- > 0)
            n += "0";
        }
        return n;
      }
      function checkFlowCollectionEnd(errors, cst) {
        let char, name;
        switch (cst.type) {
          case PlainValue.Type.FLOW_MAP:
            char = "}";
            name = "flow map";
            break;
          case PlainValue.Type.FLOW_SEQ:
            char = "]";
            name = "flow sequence";
            break;
          default:
            errors.push(new PlainValue.YAMLSemanticError(cst, "Not a flow collection!?"));
            return;
        }
        let lastItem;
        for (let i = cst.items.length - 1; i >= 0; --i) {
          const item = cst.items[i];
          if (!item || item.type !== PlainValue.Type.COMMENT) {
            lastItem = item;
            break;
          }
        }
        if (lastItem && lastItem.char !== char) {
          const msg = `Expected ${name} to end with ${char}`;
          let err;
          if (typeof lastItem.offset === "number") {
            err = new PlainValue.YAMLSemanticError(cst, msg);
            err.offset = lastItem.offset + 1;
          } else {
            err = new PlainValue.YAMLSemanticError(lastItem, msg);
            if (lastItem.range && lastItem.range.end)
              err.offset = lastItem.range.end - lastItem.range.start;
          }
          errors.push(err);
        }
      }
      function checkFlowCommentSpace(errors, comment) {
        const prev = comment.context.src[comment.range.start - 1];
        if (prev !== "\n" && prev !== "	" && prev !== " ") {
          const msg = "Comments must be separated from other tokens by white space characters";
          errors.push(new PlainValue.YAMLSemanticError(comment, msg));
        }
      }
      function getLongKeyError(source, key) {
        const sk = String(key);
        const k = sk.substr(0, 8) + "..." + sk.substr(-8);
        return new PlainValue.YAMLSemanticError(source, `The "${k}" key is too long`);
      }
      function resolveComments(collection, comments) {
        for (const {
          afterKey,
          before,
          comment
        } of comments) {
          let item = collection.items[before];
          if (!item) {
            if (comment !== void 0) {
              if (collection.comment)
                collection.comment += "\n" + comment;
              else
                collection.comment = comment;
            }
          } else {
            if (afterKey && item.value)
              item = item.value;
            if (comment === void 0) {
              if (afterKey || !item.commentBefore)
                item.spaceBefore = true;
            } else {
              if (item.commentBefore)
                item.commentBefore += "\n" + comment;
              else
                item.commentBefore = comment;
            }
          }
        }
      }
      function resolveString(doc, node) {
        const res = node.strValue;
        if (!res)
          return "";
        if (typeof res === "string")
          return res;
        res.errors.forEach((error) => {
          if (!error.source)
            error.source = node;
          doc.errors.push(error);
        });
        return res.str;
      }
      function resolveTagHandle(doc, node) {
        const {
          handle,
          suffix
        } = node.tag;
        let prefix = doc.tagPrefixes.find((p) => p.handle === handle);
        if (!prefix) {
          const dtp = doc.getDefaults().tagPrefixes;
          if (dtp)
            prefix = dtp.find((p) => p.handle === handle);
          if (!prefix)
            throw new PlainValue.YAMLSemanticError(node, `The ${handle} tag handle is non-default and was not declared.`);
        }
        if (!suffix)
          throw new PlainValue.YAMLSemanticError(node, `The ${handle} tag has no suffix.`);
        if (handle === "!" && (doc.version || doc.options.version) === "1.0") {
          if (suffix[0] === "^") {
            doc.warnings.push(new PlainValue.YAMLWarning(node, "YAML 1.0 ^ tag expansion is not supported"));
            return suffix;
          }
          if (/[:/]/.test(suffix)) {
            const vocab = suffix.match(/^([a-z0-9-]+)\/(.*)/i);
            return vocab ? `tag:${vocab[1]}.yaml.org,2002:${vocab[2]}` : `tag:${suffix}`;
          }
        }
        return prefix.prefix + decodeURIComponent(suffix);
      }
      function resolveTagName(doc, node) {
        const {
          tag,
          type
        } = node;
        let nonSpecific = false;
        if (tag) {
          const {
            handle,
            suffix,
            verbatim
          } = tag;
          if (verbatim) {
            if (verbatim !== "!" && verbatim !== "!!")
              return verbatim;
            const msg = `Verbatim tags aren't resolved, so ${verbatim} is invalid.`;
            doc.errors.push(new PlainValue.YAMLSemanticError(node, msg));
          } else if (handle === "!" && !suffix) {
            nonSpecific = true;
          } else {
            try {
              return resolveTagHandle(doc, node);
            } catch (error) {
              doc.errors.push(error);
            }
          }
        }
        switch (type) {
          case PlainValue.Type.BLOCK_FOLDED:
          case PlainValue.Type.BLOCK_LITERAL:
          case PlainValue.Type.QUOTE_DOUBLE:
          case PlainValue.Type.QUOTE_SINGLE:
            return PlainValue.defaultTags.STR;
          case PlainValue.Type.FLOW_MAP:
          case PlainValue.Type.MAP:
            return PlainValue.defaultTags.MAP;
          case PlainValue.Type.FLOW_SEQ:
          case PlainValue.Type.SEQ:
            return PlainValue.defaultTags.SEQ;
          case PlainValue.Type.PLAIN:
            return nonSpecific ? PlainValue.defaultTags.STR : null;
          default:
            return null;
        }
      }
      function resolveByTagName(doc, node, tagName) {
        const {
          tags
        } = doc.schema;
        const matchWithTest = [];
        for (const tag of tags) {
          if (tag.tag === tagName) {
            if (tag.test)
              matchWithTest.push(tag);
            else {
              const res = tag.resolve(doc, node);
              return res instanceof Collection2 ? res : new Scalar2(res);
            }
          }
        }
        const str = resolveString(doc, node);
        if (typeof str === "string" && matchWithTest.length > 0)
          return resolveScalar(str, matchWithTest, tags.scalarFallback);
        return null;
      }
      function getFallbackTagName({
        type
      }) {
        switch (type) {
          case PlainValue.Type.FLOW_MAP:
          case PlainValue.Type.MAP:
            return PlainValue.defaultTags.MAP;
          case PlainValue.Type.FLOW_SEQ:
          case PlainValue.Type.SEQ:
            return PlainValue.defaultTags.SEQ;
          default:
            return PlainValue.defaultTags.STR;
        }
      }
      function resolveTag(doc, node, tagName) {
        try {
          const res = resolveByTagName(doc, node, tagName);
          if (res) {
            if (tagName && node.tag)
              res.tag = tagName;
            return res;
          }
        } catch (error) {
          if (!error.source)
            error.source = node;
          doc.errors.push(error);
          return null;
        }
        try {
          const fallback = getFallbackTagName(node);
          if (!fallback)
            throw new Error(`The tag ${tagName} is unavailable`);
          const msg = `The tag ${tagName} is unavailable, falling back to ${fallback}`;
          doc.warnings.push(new PlainValue.YAMLWarning(node, msg));
          const res = resolveByTagName(doc, node, fallback);
          res.tag = tagName;
          return res;
        } catch (error) {
          const refError = new PlainValue.YAMLReferenceError(node, error.message);
          refError.stack = error.stack;
          doc.errors.push(refError);
          return null;
        }
      }
      var isCollectionItem = (node) => {
        if (!node)
          return false;
        const {
          type
        } = node;
        return type === PlainValue.Type.MAP_KEY || type === PlainValue.Type.MAP_VALUE || type === PlainValue.Type.SEQ_ITEM;
      };
      function resolveNodeProps(errors, node) {
        const comments = {
          before: [],
          after: []
        };
        let hasAnchor = false;
        let hasTag = false;
        const props = isCollectionItem(node.context.parent) ? node.context.parent.props.concat(node.props) : node.props;
        for (const {
          start,
          end
        } of props) {
          switch (node.context.src[start]) {
            case PlainValue.Char.COMMENT: {
              if (!node.commentHasRequiredWhitespace(start)) {
                const msg = "Comments must be separated from other tokens by white space characters";
                errors.push(new PlainValue.YAMLSemanticError(node, msg));
              }
              const {
                header,
                valueRange
              } = node;
              const cc = valueRange && (start > valueRange.start || header && start > header.start) ? comments.after : comments.before;
              cc.push(node.context.src.slice(start + 1, end));
              break;
            }
            case PlainValue.Char.ANCHOR:
              if (hasAnchor) {
                const msg = "A node can have at most one anchor";
                errors.push(new PlainValue.YAMLSemanticError(node, msg));
              }
              hasAnchor = true;
              break;
            case PlainValue.Char.TAG:
              if (hasTag) {
                const msg = "A node can have at most one tag";
                errors.push(new PlainValue.YAMLSemanticError(node, msg));
              }
              hasTag = true;
              break;
          }
        }
        return {
          comments,
          hasAnchor,
          hasTag
        };
      }
      function resolveNodeValue(doc, node) {
        const {
          anchors,
          errors,
          schema
        } = doc;
        if (node.type === PlainValue.Type.ALIAS) {
          const name = node.rawValue;
          const src = anchors.getNode(name);
          if (!src) {
            const msg = `Aliased anchor not found: ${name}`;
            errors.push(new PlainValue.YAMLReferenceError(node, msg));
            return null;
          }
          const res = new Alias2(src);
          anchors._cstAliases.push(res);
          return res;
        }
        const tagName = resolveTagName(doc, node);
        if (tagName)
          return resolveTag(doc, node, tagName);
        if (node.type !== PlainValue.Type.PLAIN) {
          const msg = `Failed to resolve ${node.type} node here`;
          errors.push(new PlainValue.YAMLSyntaxError(node, msg));
          return null;
        }
        try {
          const str = resolveString(doc, node);
          return resolveScalar(str, schema.tags, schema.tags.scalarFallback);
        } catch (error) {
          if (!error.source)
            error.source = node;
          errors.push(error);
          return null;
        }
      }
      function resolveNode(doc, node) {
        if (!node)
          return null;
        if (node.error)
          doc.errors.push(node.error);
        const {
          comments,
          hasAnchor,
          hasTag
        } = resolveNodeProps(doc.errors, node);
        if (hasAnchor) {
          const {
            anchors
          } = doc;
          const name = node.anchor;
          const prev = anchors.getNode(name);
          if (prev)
            anchors.map[anchors.newName(name)] = prev;
          anchors.map[name] = node;
        }
        if (node.type === PlainValue.Type.ALIAS && (hasAnchor || hasTag)) {
          const msg = "An alias node must not specify any properties";
          doc.errors.push(new PlainValue.YAMLSemanticError(node, msg));
        }
        const res = resolveNodeValue(doc, node);
        if (res) {
          res.range = [node.range.start, node.range.end];
          if (doc.options.keepCstNodes)
            res.cstNode = node;
          if (doc.options.keepNodeTypes)
            res.type = node.type;
          const cb = comments.before.join("\n");
          if (cb) {
            res.commentBefore = res.commentBefore ? `${res.commentBefore}
${cb}` : cb;
          }
          const ca = comments.after.join("\n");
          if (ca)
            res.comment = res.comment ? `${res.comment}
${ca}` : ca;
        }
        return node.resolved = res;
      }
      function resolveMap(doc, cst) {
        if (cst.type !== PlainValue.Type.MAP && cst.type !== PlainValue.Type.FLOW_MAP) {
          const msg = `A ${cst.type} node cannot be resolved as a mapping`;
          doc.errors.push(new PlainValue.YAMLSyntaxError(cst, msg));
          return null;
        }
        const {
          comments,
          items
        } = cst.type === PlainValue.Type.FLOW_MAP ? resolveFlowMapItems(doc, cst) : resolveBlockMapItems(doc, cst);
        const map = new YAMLMap2();
        map.items = items;
        resolveComments(map, comments);
        let hasCollectionKey = false;
        for (let i = 0; i < items.length; ++i) {
          const {
            key: iKey
          } = items[i];
          if (iKey instanceof Collection2)
            hasCollectionKey = true;
          if (doc.schema.merge && iKey && iKey.value === MERGE_KEY) {
            items[i] = new Merge2(items[i]);
            const sources = items[i].value.items;
            let error = null;
            sources.some((node) => {
              if (node instanceof Alias2) {
                const {
                  type
                } = node.source;
                if (type === PlainValue.Type.MAP || type === PlainValue.Type.FLOW_MAP)
                  return false;
                return error = "Merge nodes aliases can only point to maps";
              }
              return error = "Merge nodes can only have Alias nodes as values";
            });
            if (error)
              doc.errors.push(new PlainValue.YAMLSemanticError(cst, error));
          } else {
            for (let j = i + 1; j < items.length; ++j) {
              const {
                key: jKey
              } = items[j];
              if (iKey === jKey || iKey && jKey && Object.prototype.hasOwnProperty.call(iKey, "value") && iKey.value === jKey.value) {
                const msg = `Map keys must be unique; "${iKey}" is repeated`;
                doc.errors.push(new PlainValue.YAMLSemanticError(cst, msg));
                break;
              }
            }
          }
        }
        if (hasCollectionKey && !doc.options.mapAsMap) {
          const warn = "Keys with collection values will be stringified as YAML due to JS Object restrictions. Use mapAsMap: true to avoid this.";
          doc.warnings.push(new PlainValue.YAMLWarning(cst, warn));
        }
        cst.resolved = map;
        return map;
      }
      var valueHasPairComment = ({
        context: {
          lineStart,
          node,
          src
        },
        props
      }) => {
        if (props.length === 0)
          return false;
        const {
          start
        } = props[0];
        if (node && start > node.valueRange.start)
          return false;
        if (src[start] !== PlainValue.Char.COMMENT)
          return false;
        for (let i = lineStart; i < start; ++i)
          if (src[i] === "\n")
            return false;
        return true;
      };
      function resolvePairComment(item, pair) {
        if (!valueHasPairComment(item))
          return;
        const comment = item.getPropValue(0, PlainValue.Char.COMMENT, true);
        let found = false;
        const cb = pair.value.commentBefore;
        if (cb && cb.startsWith(comment)) {
          pair.value.commentBefore = cb.substr(comment.length + 1);
          found = true;
        } else {
          const cc = pair.value.comment;
          if (!item.node && cc && cc.startsWith(comment)) {
            pair.value.comment = cc.substr(comment.length + 1);
            found = true;
          }
        }
        if (found)
          pair.comment = comment;
      }
      function resolveBlockMapItems(doc, cst) {
        const comments = [];
        const items = [];
        let key = void 0;
        let keyStart = null;
        for (let i = 0; i < cst.items.length; ++i) {
          const item = cst.items[i];
          switch (item.type) {
            case PlainValue.Type.BLANK_LINE:
              comments.push({
                afterKey: !!key,
                before: items.length
              });
              break;
            case PlainValue.Type.COMMENT:
              comments.push({
                afterKey: !!key,
                before: items.length,
                comment: item.comment
              });
              break;
            case PlainValue.Type.MAP_KEY:
              if (key !== void 0)
                items.push(new Pair2(key));
              if (item.error)
                doc.errors.push(item.error);
              key = resolveNode(doc, item.node);
              keyStart = null;
              break;
            case PlainValue.Type.MAP_VALUE:
              {
                if (key === void 0)
                  key = null;
                if (item.error)
                  doc.errors.push(item.error);
                if (!item.context.atLineStart && item.node && item.node.type === PlainValue.Type.MAP && !item.node.context.atLineStart) {
                  const msg = "Nested mappings are not allowed in compact mappings";
                  doc.errors.push(new PlainValue.YAMLSemanticError(item.node, msg));
                }
                let valueNode = item.node;
                if (!valueNode && item.props.length > 0) {
                  valueNode = new PlainValue.PlainValue(PlainValue.Type.PLAIN, []);
                  valueNode.context = {
                    parent: item,
                    src: item.context.src
                  };
                  const pos = item.range.start + 1;
                  valueNode.range = {
                    start: pos,
                    end: pos
                  };
                  valueNode.valueRange = {
                    start: pos,
                    end: pos
                  };
                  if (typeof item.range.origStart === "number") {
                    const origPos = item.range.origStart + 1;
                    valueNode.range.origStart = valueNode.range.origEnd = origPos;
                    valueNode.valueRange.origStart = valueNode.valueRange.origEnd = origPos;
                  }
                }
                const pair = new Pair2(key, resolveNode(doc, valueNode));
                resolvePairComment(item, pair);
                items.push(pair);
                if (key && typeof keyStart === "number") {
                  if (item.range.start > keyStart + 1024)
                    doc.errors.push(getLongKeyError(cst, key));
                }
                key = void 0;
                keyStart = null;
              }
              break;
            default:
              if (key !== void 0)
                items.push(new Pair2(key));
              key = resolveNode(doc, item);
              keyStart = item.range.start;
              if (item.error)
                doc.errors.push(item.error);
              next:
                for (let j = i + 1; ; ++j) {
                  const nextItem = cst.items[j];
                  switch (nextItem && nextItem.type) {
                    case PlainValue.Type.BLANK_LINE:
                    case PlainValue.Type.COMMENT:
                      continue next;
                    case PlainValue.Type.MAP_VALUE:
                      break next;
                    default: {
                      const msg = "Implicit map keys need to be followed by map values";
                      doc.errors.push(new PlainValue.YAMLSemanticError(item, msg));
                      break next;
                    }
                  }
                }
              if (item.valueRangeContainsNewline) {
                const msg = "Implicit map keys need to be on a single line";
                doc.errors.push(new PlainValue.YAMLSemanticError(item, msg));
              }
          }
        }
        if (key !== void 0)
          items.push(new Pair2(key));
        return {
          comments,
          items
        };
      }
      function resolveFlowMapItems(doc, cst) {
        const comments = [];
        const items = [];
        let key = void 0;
        let explicitKey = false;
        let next = "{";
        for (let i = 0; i < cst.items.length; ++i) {
          const item = cst.items[i];
          if (typeof item.char === "string") {
            const {
              char,
              offset
            } = item;
            if (char === "?" && key === void 0 && !explicitKey) {
              explicitKey = true;
              next = ":";
              continue;
            }
            if (char === ":") {
              if (key === void 0)
                key = null;
              if (next === ":") {
                next = ",";
                continue;
              }
            } else {
              if (explicitKey) {
                if (key === void 0 && char !== ",")
                  key = null;
                explicitKey = false;
              }
              if (key !== void 0) {
                items.push(new Pair2(key));
                key = void 0;
                if (char === ",") {
                  next = ":";
                  continue;
                }
              }
            }
            if (char === "}") {
              if (i === cst.items.length - 1)
                continue;
            } else if (char === next) {
              next = ":";
              continue;
            }
            const msg = `Flow map contains an unexpected ${char}`;
            const err = new PlainValue.YAMLSyntaxError(cst, msg);
            err.offset = offset;
            doc.errors.push(err);
          } else if (item.type === PlainValue.Type.BLANK_LINE) {
            comments.push({
              afterKey: !!key,
              before: items.length
            });
          } else if (item.type === PlainValue.Type.COMMENT) {
            checkFlowCommentSpace(doc.errors, item);
            comments.push({
              afterKey: !!key,
              before: items.length,
              comment: item.comment
            });
          } else if (key === void 0) {
            if (next === ",")
              doc.errors.push(new PlainValue.YAMLSemanticError(item, "Separator , missing in flow map"));
            key = resolveNode(doc, item);
          } else {
            if (next !== ",")
              doc.errors.push(new PlainValue.YAMLSemanticError(item, "Indicator : missing in flow map entry"));
            items.push(new Pair2(key, resolveNode(doc, item)));
            key = void 0;
            explicitKey = false;
          }
        }
        checkFlowCollectionEnd(doc.errors, cst);
        if (key !== void 0)
          items.push(new Pair2(key));
        return {
          comments,
          items
        };
      }
      function resolveSeq(doc, cst) {
        if (cst.type !== PlainValue.Type.SEQ && cst.type !== PlainValue.Type.FLOW_SEQ) {
          const msg = `A ${cst.type} node cannot be resolved as a sequence`;
          doc.errors.push(new PlainValue.YAMLSyntaxError(cst, msg));
          return null;
        }
        const {
          comments,
          items
        } = cst.type === PlainValue.Type.FLOW_SEQ ? resolveFlowSeqItems(doc, cst) : resolveBlockSeqItems(doc, cst);
        const seq = new YAMLSeq2();
        seq.items = items;
        resolveComments(seq, comments);
        if (!doc.options.mapAsMap && items.some((it) => it instanceof Pair2 && it.key instanceof Collection2)) {
          const warn = "Keys with collection values will be stringified as YAML due to JS Object restrictions. Use mapAsMap: true to avoid this.";
          doc.warnings.push(new PlainValue.YAMLWarning(cst, warn));
        }
        cst.resolved = seq;
        return seq;
      }
      function resolveBlockSeqItems(doc, cst) {
        const comments = [];
        const items = [];
        for (let i = 0; i < cst.items.length; ++i) {
          const item = cst.items[i];
          switch (item.type) {
            case PlainValue.Type.BLANK_LINE:
              comments.push({
                before: items.length
              });
              break;
            case PlainValue.Type.COMMENT:
              comments.push({
                comment: item.comment,
                before: items.length
              });
              break;
            case PlainValue.Type.SEQ_ITEM:
              if (item.error)
                doc.errors.push(item.error);
              items.push(resolveNode(doc, item.node));
              if (item.hasProps) {
                const msg = "Sequence items cannot have tags or anchors before the - indicator";
                doc.errors.push(new PlainValue.YAMLSemanticError(item, msg));
              }
              break;
            default:
              if (item.error)
                doc.errors.push(item.error);
              doc.errors.push(new PlainValue.YAMLSyntaxError(item, `Unexpected ${item.type} node in sequence`));
          }
        }
        return {
          comments,
          items
        };
      }
      function resolveFlowSeqItems(doc, cst) {
        const comments = [];
        const items = [];
        let explicitKey = false;
        let key = void 0;
        let keyStart = null;
        let next = "[";
        let prevItem = null;
        for (let i = 0; i < cst.items.length; ++i) {
          const item = cst.items[i];
          if (typeof item.char === "string") {
            const {
              char,
              offset
            } = item;
            if (char !== ":" && (explicitKey || key !== void 0)) {
              if (explicitKey && key === void 0)
                key = next ? items.pop() : null;
              items.push(new Pair2(key));
              explicitKey = false;
              key = void 0;
              keyStart = null;
            }
            if (char === next) {
              next = null;
            } else if (!next && char === "?") {
              explicitKey = true;
            } else if (next !== "[" && char === ":" && key === void 0) {
              if (next === ",") {
                key = items.pop();
                if (key instanceof Pair2) {
                  const msg = "Chaining flow sequence pairs is invalid";
                  const err = new PlainValue.YAMLSemanticError(cst, msg);
                  err.offset = offset;
                  doc.errors.push(err);
                }
                if (!explicitKey && typeof keyStart === "number") {
                  const keyEnd = item.range ? item.range.start : item.offset;
                  if (keyEnd > keyStart + 1024)
                    doc.errors.push(getLongKeyError(cst, key));
                  const {
                    src
                  } = prevItem.context;
                  for (let i2 = keyStart; i2 < keyEnd; ++i2)
                    if (src[i2] === "\n") {
                      const msg = "Implicit keys of flow sequence pairs need to be on a single line";
                      doc.errors.push(new PlainValue.YAMLSemanticError(prevItem, msg));
                      break;
                    }
                }
              } else {
                key = null;
              }
              keyStart = null;
              explicitKey = false;
              next = null;
            } else if (next === "[" || char !== "]" || i < cst.items.length - 1) {
              const msg = `Flow sequence contains an unexpected ${char}`;
              const err = new PlainValue.YAMLSyntaxError(cst, msg);
              err.offset = offset;
              doc.errors.push(err);
            }
          } else if (item.type === PlainValue.Type.BLANK_LINE) {
            comments.push({
              before: items.length
            });
          } else if (item.type === PlainValue.Type.COMMENT) {
            checkFlowCommentSpace(doc.errors, item);
            comments.push({
              comment: item.comment,
              before: items.length
            });
          } else {
            if (next) {
              const msg = `Expected a ${next} in flow sequence`;
              doc.errors.push(new PlainValue.YAMLSemanticError(item, msg));
            }
            const value = resolveNode(doc, item);
            if (key === void 0) {
              items.push(value);
              prevItem = item;
            } else {
              items.push(new Pair2(key, value));
              key = void 0;
            }
            keyStart = item.range.start;
            next = ",";
          }
        }
        checkFlowCollectionEnd(doc.errors, cst);
        if (key !== void 0)
          items.push(new Pair2(key));
        return {
          comments,
          items
        };
      }
      exports.Alias = Alias2;
      exports.Collection = Collection2;
      exports.Merge = Merge2;
      exports.Node = Node2;
      exports.Pair = Pair2;
      exports.Scalar = Scalar2;
      exports.YAMLMap = YAMLMap2;
      exports.YAMLSeq = YAMLSeq2;
      exports.addComment = addComment;
      exports.binaryOptions = binaryOptions2;
      exports.boolOptions = boolOptions2;
      exports.findPair = findPair;
      exports.intOptions = intOptions2;
      exports.isEmptyPath = isEmptyPath;
      exports.nullOptions = nullOptions2;
      exports.resolveMap = resolveMap;
      exports.resolveNode = resolveNode;
      exports.resolveSeq = resolveSeq;
      exports.resolveString = resolveString;
      exports.strOptions = strOptions2;
      exports.stringifyNumber = stringifyNumber;
      exports.stringifyString = stringifyString;
      exports.toJSON = toJSON;
    }
  });

  // node_modules/yaml/dist/warnings-1000a372.js
  var require_warnings_1000a372 = __commonJS({
    "node_modules/yaml/dist/warnings-1000a372.js"(exports) {
      "use strict";
      var PlainValue = require_PlainValue_ec8e588e();
      var resolveSeq = require_resolveSeq_d03cb037();
      var binary = {
        identify: (value) => value instanceof Uint8Array,
        default: false,
        tag: "tag:yaml.org,2002:binary",
        resolve: (doc, node) => {
          const src = resolveSeq.resolveString(doc, node);
          if (typeof Buffer === "function") {
            return Buffer.from(src, "base64");
          } else if (typeof atob === "function") {
            const str = atob(src.replace(/[\n\r]/g, ""));
            const buffer = new Uint8Array(str.length);
            for (let i = 0; i < str.length; ++i)
              buffer[i] = str.charCodeAt(i);
            return buffer;
          } else {
            const msg = "This environment does not support reading binary tags; either Buffer or atob is required";
            doc.errors.push(new PlainValue.YAMLReferenceError(node, msg));
            return null;
          }
        },
        options: resolveSeq.binaryOptions,
        stringify: ({
          comment,
          type,
          value
        }, ctx, onComment, onChompKeep) => {
          let src;
          if (typeof Buffer === "function") {
            src = value instanceof Buffer ? value.toString("base64") : Buffer.from(value.buffer).toString("base64");
          } else if (typeof btoa === "function") {
            let s = "";
            for (let i = 0; i < value.length; ++i)
              s += String.fromCharCode(value[i]);
            src = btoa(s);
          } else {
            throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
          }
          if (!type)
            type = resolveSeq.binaryOptions.defaultType;
          if (type === PlainValue.Type.QUOTE_DOUBLE) {
            value = src;
          } else {
            const {
              lineWidth
            } = resolveSeq.binaryOptions;
            const n = Math.ceil(src.length / lineWidth);
            const lines = new Array(n);
            for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
              lines[i] = src.substr(o, lineWidth);
            }
            value = lines.join(type === PlainValue.Type.BLOCK_LITERAL ? "\n" : " ");
          }
          return resolveSeq.stringifyString({
            comment,
            type,
            value
          }, ctx, onComment, onChompKeep);
        }
      };
      function parsePairs(doc, cst) {
        const seq = resolveSeq.resolveSeq(doc, cst);
        for (let i = 0; i < seq.items.length; ++i) {
          let item = seq.items[i];
          if (item instanceof resolveSeq.Pair)
            continue;
          else if (item instanceof resolveSeq.YAMLMap) {
            if (item.items.length > 1) {
              const msg = "Each pair must have its own sequence indicator";
              throw new PlainValue.YAMLSemanticError(cst, msg);
            }
            const pair = item.items[0] || new resolveSeq.Pair();
            if (item.commentBefore)
              pair.commentBefore = pair.commentBefore ? `${item.commentBefore}
${pair.commentBefore}` : item.commentBefore;
            if (item.comment)
              pair.comment = pair.comment ? `${item.comment}
${pair.comment}` : item.comment;
            item = pair;
          }
          seq.items[i] = item instanceof resolveSeq.Pair ? item : new resolveSeq.Pair(item);
        }
        return seq;
      }
      function createPairs(schema, iterable, ctx) {
        const pairs2 = new resolveSeq.YAMLSeq(schema);
        pairs2.tag = "tag:yaml.org,2002:pairs";
        for (const it of iterable) {
          let key, value;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key = it[0];
              value = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key = keys[0];
              value = it[key];
            } else
              throw new TypeError(`Expected { key: value } tuple: ${it}`);
          } else {
            key = it;
          }
          const pair = schema.createPair(key, value, ctx);
          pairs2.items.push(pair);
        }
        return pairs2;
      }
      var pairs = {
        default: false,
        tag: "tag:yaml.org,2002:pairs",
        resolve: parsePairs,
        createNode: createPairs
      };
      var YAMLOMap = class extends resolveSeq.YAMLSeq {
        constructor() {
          super();
          PlainValue._defineProperty(this, "add", resolveSeq.YAMLMap.prototype.add.bind(this));
          PlainValue._defineProperty(this, "delete", resolveSeq.YAMLMap.prototype.delete.bind(this));
          PlainValue._defineProperty(this, "get", resolveSeq.YAMLMap.prototype.get.bind(this));
          PlainValue._defineProperty(this, "has", resolveSeq.YAMLMap.prototype.has.bind(this));
          PlainValue._defineProperty(this, "set", resolveSeq.YAMLMap.prototype.set.bind(this));
          this.tag = YAMLOMap.tag;
        }
        toJSON(_, ctx) {
          const map = /* @__PURE__ */ new Map();
          if (ctx && ctx.onCreate)
            ctx.onCreate(map);
          for (const pair of this.items) {
            let key, value;
            if (pair instanceof resolveSeq.Pair) {
              key = resolveSeq.toJSON(pair.key, "", ctx);
              value = resolveSeq.toJSON(pair.value, key, ctx);
            } else {
              key = resolveSeq.toJSON(pair, "", ctx);
            }
            if (map.has(key))
              throw new Error("Ordered maps must not include duplicate keys");
            map.set(key, value);
          }
          return map;
        }
      };
      PlainValue._defineProperty(YAMLOMap, "tag", "tag:yaml.org,2002:omap");
      function parseOMap(doc, cst) {
        const pairs2 = parsePairs(doc, cst);
        const seenKeys = [];
        for (const {
          key
        } of pairs2.items) {
          if (key instanceof resolveSeq.Scalar) {
            if (seenKeys.includes(key.value)) {
              const msg = "Ordered maps must not include duplicate keys";
              throw new PlainValue.YAMLSemanticError(cst, msg);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs2);
      }
      function createOMap(schema, iterable, ctx) {
        const pairs2 = createPairs(schema, iterable, ctx);
        const omap2 = new YAMLOMap();
        omap2.items = pairs2.items;
        return omap2;
      }
      var omap = {
        identify: (value) => value instanceof Map,
        nodeClass: YAMLOMap,
        default: false,
        tag: "tag:yaml.org,2002:omap",
        resolve: parseOMap,
        createNode: createOMap
      };
      var YAMLSet = class extends resolveSeq.YAMLMap {
        constructor() {
          super();
          this.tag = YAMLSet.tag;
        }
        add(key) {
          const pair = key instanceof resolveSeq.Pair ? key : new resolveSeq.Pair(key);
          const prev = resolveSeq.findPair(this.items, pair.key);
          if (!prev)
            this.items.push(pair);
        }
        get(key, keepPair) {
          const pair = resolveSeq.findPair(this.items, key);
          return !keepPair && pair instanceof resolveSeq.Pair ? pair.key instanceof resolveSeq.Scalar ? pair.key.value : pair.key : pair;
        }
        set(key, value) {
          if (typeof value !== "boolean")
            throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
          const prev = resolveSeq.findPair(this.items, key);
          if (prev && !value) {
            this.items.splice(this.items.indexOf(prev), 1);
          } else if (!prev && value) {
            this.items.push(new resolveSeq.Pair(key));
          }
        }
        toJSON(_, ctx) {
          return super.toJSON(_, ctx, Set);
        }
        toString(ctx, onComment, onChompKeep) {
          if (!ctx)
            return JSON.stringify(this);
          if (this.hasAllNullValues())
            return super.toString(ctx, onComment, onChompKeep);
          else
            throw new Error("Set items must all have null values");
        }
      };
      PlainValue._defineProperty(YAMLSet, "tag", "tag:yaml.org,2002:set");
      function parseSet(doc, cst) {
        const map = resolveSeq.resolveMap(doc, cst);
        if (!map.hasAllNullValues())
          throw new PlainValue.YAMLSemanticError(cst, "Set items must all have null values");
        return Object.assign(new YAMLSet(), map);
      }
      function createSet(schema, iterable, ctx) {
        const set2 = new YAMLSet();
        for (const value of iterable)
          set2.items.push(schema.createPair(value, null, ctx));
        return set2;
      }
      var set = {
        identify: (value) => value instanceof Set,
        nodeClass: YAMLSet,
        default: false,
        tag: "tag:yaml.org,2002:set",
        resolve: parseSet,
        createNode: createSet
      };
      var parseSexagesimal = (sign, parts) => {
        const n = parts.split(":").reduce((n2, p) => n2 * 60 + Number(p), 0);
        return sign === "-" ? -n : n;
      };
      var stringifySexagesimal = ({
        value
      }) => {
        if (isNaN(value) || !isFinite(value))
          return resolveSeq.stringifyNumber(value);
        let sign = "";
        if (value < 0) {
          sign = "-";
          value = Math.abs(value);
        }
        const parts = [value % 60];
        if (value < 60) {
          parts.unshift(0);
        } else {
          value = Math.round((value - parts[0]) / 60);
          parts.unshift(value % 60);
          if (value >= 60) {
            value = Math.round((value - parts[0]) / 60);
            parts.unshift(value);
          }
        }
        return sign + parts.map((n) => n < 10 ? "0" + String(n) : String(n)).join(":").replace(/000000\d*$/, "");
      };
      var intTime = {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:int",
        format: "TIME",
        test: /^([-+]?)([0-9][0-9_]*(?::[0-5]?[0-9])+)$/,
        resolve: (str, sign, parts) => parseSexagesimal(sign, parts.replace(/_/g, "")),
        stringify: stringifySexagesimal
      };
      var floatTime = {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        format: "TIME",
        test: /^([-+]?)([0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*)$/,
        resolve: (str, sign, parts) => parseSexagesimal(sign, parts.replace(/_/g, "")),
        stringify: stringifySexagesimal
      };
      var timestamp = {
        identify: (value) => value instanceof Date,
        default: true,
        tag: "tag:yaml.org,2002:timestamp",
        test: RegExp("^(?:([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?)$"),
        resolve: (str, year, month, day, hour, minute, second, millisec, tz) => {
          if (millisec)
            millisec = (millisec + "00").substr(1, 3);
          let date2 = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec || 0);
          if (tz && tz !== "Z") {
            let d = parseSexagesimal(tz[0], tz.slice(1));
            if (Math.abs(d) < 30)
              d *= 60;
            date2 -= 6e4 * d;
          }
          return new Date(date2);
        },
        stringify: ({
          value
        }) => value.toISOString().replace(/((T00:00)?:00)?\.000Z$/, "")
      };
      function shouldWarn(deprecation) {
        const env = typeof process !== "undefined" && process.env || {};
        if (deprecation) {
          if (typeof YAML_SILENCE_DEPRECATION_WARNINGS !== "undefined")
            return !YAML_SILENCE_DEPRECATION_WARNINGS;
          return !env.YAML_SILENCE_DEPRECATION_WARNINGS;
        }
        if (typeof YAML_SILENCE_WARNINGS !== "undefined")
          return !YAML_SILENCE_WARNINGS;
        return !env.YAML_SILENCE_WARNINGS;
      }
      function warn(warning, type) {
        if (shouldWarn(false)) {
          const emit = typeof process !== "undefined" && process.emitWarning;
          if (emit)
            emit(warning, type);
          else {
            console.warn(type ? `${type}: ${warning}` : warning);
          }
        }
      }
      function warnFileDeprecation(filename) {
        if (shouldWarn(true)) {
          const path = filename.replace(/.*yaml[/\\]/i, "").replace(/\.js$/, "").replace(/\\/g, "/");
          warn(`The endpoint 'yaml/${path}' will be removed in a future release.`, "DeprecationWarning");
        }
      }
      var warned = {};
      function warnOptionDeprecation(name, alternative) {
        if (!warned[name] && shouldWarn(true)) {
          warned[name] = true;
          let msg = `The option '${name}' will be removed in a future release`;
          msg += alternative ? `, use '${alternative}' instead.` : ".";
          warn(msg, "DeprecationWarning");
        }
      }
      exports.binary = binary;
      exports.floatTime = floatTime;
      exports.intTime = intTime;
      exports.omap = omap;
      exports.pairs = pairs;
      exports.set = set;
      exports.timestamp = timestamp;
      exports.warn = warn;
      exports.warnFileDeprecation = warnFileDeprecation;
      exports.warnOptionDeprecation = warnOptionDeprecation;
    }
  });

  // node_modules/yaml/dist/Schema-88e323a7.js
  var require_Schema_88e323a7 = __commonJS({
    "node_modules/yaml/dist/Schema-88e323a7.js"(exports) {
      "use strict";
      var PlainValue = require_PlainValue_ec8e588e();
      var resolveSeq = require_resolveSeq_d03cb037();
      var warnings = require_warnings_1000a372();
      function createMap(schema, obj, ctx) {
        const map2 = new resolveSeq.YAMLMap(schema);
        if (obj instanceof Map) {
          for (const [key, value] of obj)
            map2.items.push(schema.createPair(key, value, ctx));
        } else if (obj && typeof obj === "object") {
          for (const key of Object.keys(obj))
            map2.items.push(schema.createPair(key, obj[key], ctx));
        }
        if (typeof schema.sortMapEntries === "function") {
          map2.items.sort(schema.sortMapEntries);
        }
        return map2;
      }
      var map = {
        createNode: createMap,
        default: true,
        nodeClass: resolveSeq.YAMLMap,
        tag: "tag:yaml.org,2002:map",
        resolve: resolveSeq.resolveMap
      };
      function createSeq(schema, obj, ctx) {
        const seq2 = new resolveSeq.YAMLSeq(schema);
        if (obj && obj[Symbol.iterator]) {
          for (const it of obj) {
            const v = schema.createNode(it, ctx.wrapScalars, null, ctx);
            seq2.items.push(v);
          }
        }
        return seq2;
      }
      var seq = {
        createNode: createSeq,
        default: true,
        nodeClass: resolveSeq.YAMLSeq,
        tag: "tag:yaml.org,2002:seq",
        resolve: resolveSeq.resolveSeq
      };
      var string = {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: resolveSeq.resolveString,
        stringify(item, ctx, onComment, onChompKeep) {
          ctx = Object.assign({
            actualString: true
          }, ctx);
          return resolveSeq.stringifyString(item, ctx, onComment, onChompKeep);
        },
        options: resolveSeq.strOptions
      };
      var failsafe = [map, seq, string];
      var intIdentify$2 = (value) => typeof value === "bigint" || Number.isInteger(value);
      var intResolve$1 = (src, part, radix) => resolveSeq.intOptions.asBigInt ? BigInt(src) : parseInt(part, radix);
      function intStringify$1(node, radix, prefix) {
        const {
          value
        } = node;
        if (intIdentify$2(value) && value >= 0)
          return prefix + value.toString(radix);
        return resolveSeq.stringifyNumber(node);
      }
      var nullObj = {
        identify: (value) => value == null,
        createNode: (schema, value, ctx) => ctx.wrapScalars ? new resolveSeq.Scalar(null) : null,
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^(?:~|[Nn]ull|NULL)?$/,
        resolve: () => null,
        options: resolveSeq.nullOptions,
        stringify: () => resolveSeq.nullOptions.nullStr
      };
      var boolObj = {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
        resolve: (str) => str[0] === "t" || str[0] === "T",
        options: resolveSeq.boolOptions,
        stringify: ({
          value
        }) => value ? resolveSeq.boolOptions.trueStr : resolveSeq.boolOptions.falseStr
      };
      var octObj = {
        identify: (value) => intIdentify$2(value) && value >= 0,
        default: true,
        tag: "tag:yaml.org,2002:int",
        format: "OCT",
        test: /^0o([0-7]+)$/,
        resolve: (str, oct) => intResolve$1(str, oct, 8),
        options: resolveSeq.intOptions,
        stringify: (node) => intStringify$1(node, 8, "0o")
      };
      var intObj = {
        identify: intIdentify$2,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^[-+]?[0-9]+$/,
        resolve: (str) => intResolve$1(str, str, 10),
        options: resolveSeq.intOptions,
        stringify: resolveSeq.stringifyNumber
      };
      var hexObj = {
        identify: (value) => intIdentify$2(value) && value >= 0,
        default: true,
        tag: "tag:yaml.org,2002:int",
        format: "HEX",
        test: /^0x([0-9a-fA-F]+)$/,
        resolve: (str, hex) => intResolve$1(str, hex, 16),
        options: resolveSeq.intOptions,
        stringify: (node) => intStringify$1(node, 16, "0x")
      };
      var nanObj = {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^(?:[-+]?\.inf|(\.nan))$/i,
        resolve: (str, nan) => nan ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
        stringify: resolveSeq.stringifyNumber
      };
      var expObj = {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        format: "EXP",
        test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
        resolve: (str) => parseFloat(str),
        stringify: ({
          value
        }) => Number(value).toExponential()
      };
      var floatObj = {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^[-+]?(?:\.([0-9]+)|[0-9]+\.([0-9]*))$/,
        resolve(str, frac1, frac2) {
          const frac = frac1 || frac2;
          const node = new resolveSeq.Scalar(parseFloat(str));
          if (frac && frac[frac.length - 1] === "0")
            node.minFractionDigits = frac.length;
          return node;
        },
        stringify: resolveSeq.stringifyNumber
      };
      var core = failsafe.concat([nullObj, boolObj, octObj, intObj, hexObj, nanObj, expObj, floatObj]);
      var intIdentify$1 = (value) => typeof value === "bigint" || Number.isInteger(value);
      var stringifyJSON = ({
        value
      }) => JSON.stringify(value);
      var json = [map, seq, {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: resolveSeq.resolveString,
        stringify: stringifyJSON
      }, {
        identify: (value) => value == null,
        createNode: (schema, value, ctx) => ctx.wrapScalars ? new resolveSeq.Scalar(null) : null,
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      }, {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true|false$/,
        resolve: (str) => str === "true",
        stringify: stringifyJSON
      }, {
        identify: intIdentify$1,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str) => resolveSeq.intOptions.asBigInt ? BigInt(str) : parseInt(str, 10),
        stringify: ({
          value
        }) => intIdentify$1(value) ? value.toString() : JSON.stringify(value)
      }, {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str) => parseFloat(str),
        stringify: stringifyJSON
      }];
      json.scalarFallback = (str) => {
        throw new SyntaxError(`Unresolved plain scalar ${JSON.stringify(str)}`);
      };
      var boolStringify = ({
        value
      }) => value ? resolveSeq.boolOptions.trueStr : resolveSeq.boolOptions.falseStr;
      var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
      function intResolve(sign, src, radix) {
        let str = src.replace(/_/g, "");
        if (resolveSeq.intOptions.asBigInt) {
          switch (radix) {
            case 2:
              str = `0b${str}`;
              break;
            case 8:
              str = `0o${str}`;
              break;
            case 16:
              str = `0x${str}`;
              break;
          }
          const n2 = BigInt(str);
          return sign === "-" ? BigInt(-1) * n2 : n2;
        }
        const n = parseInt(str, radix);
        return sign === "-" ? -1 * n : n;
      }
      function intStringify(node, radix, prefix) {
        const {
          value
        } = node;
        if (intIdentify(value)) {
          const str = value.toString(radix);
          return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
        }
        return resolveSeq.stringifyNumber(node);
      }
      var yaml11 = failsafe.concat([{
        identify: (value) => value == null,
        createNode: (schema, value, ctx) => ctx.wrapScalars ? new resolveSeq.Scalar(null) : null,
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^(?:~|[Nn]ull|NULL)?$/,
        resolve: () => null,
        options: resolveSeq.nullOptions,
        stringify: () => resolveSeq.nullOptions.nullStr
      }, {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
        resolve: () => true,
        options: resolveSeq.boolOptions,
        stringify: boolStringify
      }, {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/i,
        resolve: () => false,
        options: resolveSeq.boolOptions,
        stringify: boolStringify
      }, {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        format: "BIN",
        test: /^([-+]?)0b([0-1_]+)$/,
        resolve: (str, sign, bin) => intResolve(sign, bin, 2),
        stringify: (node) => intStringify(node, 2, "0b")
      }, {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        format: "OCT",
        test: /^([-+]?)0([0-7_]+)$/,
        resolve: (str, sign, oct) => intResolve(sign, oct, 8),
        stringify: (node) => intStringify(node, 8, "0")
      }, {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^([-+]?)([0-9][0-9_]*)$/,
        resolve: (str, sign, abs) => intResolve(sign, abs, 10),
        stringify: resolveSeq.stringifyNumber
      }, {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        format: "HEX",
        test: /^([-+]?)0x([0-9a-fA-F_]+)$/,
        resolve: (str, sign, hex) => intResolve(sign, hex, 16),
        stringify: (node) => intStringify(node, 16, "0x")
      }, {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^(?:[-+]?\.inf|(\.nan))$/i,
        resolve: (str, nan) => nan ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
        stringify: resolveSeq.stringifyNumber
      }, {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        format: "EXP",
        test: /^[-+]?([0-9][0-9_]*)?(\.[0-9_]*)?[eE][-+]?[0-9]+$/,
        resolve: (str) => parseFloat(str.replace(/_/g, "")),
        stringify: ({
          value
        }) => Number(value).toExponential()
      }, {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^[-+]?(?:[0-9][0-9_]*)?\.([0-9_]*)$/,
        resolve(str, frac) {
          const node = new resolveSeq.Scalar(parseFloat(str.replace(/_/g, "")));
          if (frac) {
            const f = frac.replace(/_/g, "");
            if (f[f.length - 1] === "0")
              node.minFractionDigits = f.length;
          }
          return node;
        },
        stringify: resolveSeq.stringifyNumber
      }], warnings.binary, warnings.omap, warnings.pairs, warnings.set, warnings.intTime, warnings.floatTime, warnings.timestamp);
      var schemas = {
        core,
        failsafe,
        json,
        yaml11
      };
      var tags = {
        binary: warnings.binary,
        bool: boolObj,
        float: floatObj,
        floatExp: expObj,
        floatNaN: nanObj,
        floatTime: warnings.floatTime,
        int: intObj,
        intHex: hexObj,
        intOct: octObj,
        intTime: warnings.intTime,
        map,
        null: nullObj,
        omap: warnings.omap,
        pairs: warnings.pairs,
        seq,
        set: warnings.set,
        timestamp: warnings.timestamp
      };
      function findTagObject(value, tagName, tags2) {
        if (tagName) {
          const match = tags2.filter((t) => t.tag === tagName);
          const tagObj = match.find((t) => !t.format) || match[0];
          if (!tagObj)
            throw new Error(`Tag ${tagName} not found`);
          return tagObj;
        }
        return tags2.find((t) => (t.identify && t.identify(value) || t.class && value instanceof t.class) && !t.format);
      }
      function createNode(value, tagName, ctx) {
        if (value instanceof resolveSeq.Node)
          return value;
        const {
          defaultPrefix,
          onTagObj,
          prevObjects,
          schema,
          wrapScalars
        } = ctx;
        if (tagName && tagName.startsWith("!!"))
          tagName = defaultPrefix + tagName.slice(2);
        let tagObj = findTagObject(value, tagName, schema.tags);
        if (!tagObj) {
          if (typeof value.toJSON === "function")
            value = value.toJSON();
          if (!value || typeof value !== "object")
            return wrapScalars ? new resolveSeq.Scalar(value) : value;
          tagObj = value instanceof Map ? map : value[Symbol.iterator] ? seq : map;
        }
        if (onTagObj) {
          onTagObj(tagObj);
          delete ctx.onTagObj;
        }
        const obj = {
          value: void 0,
          node: void 0
        };
        if (value && typeof value === "object" && prevObjects) {
          const prev = prevObjects.get(value);
          if (prev) {
            const alias = new resolveSeq.Alias(prev);
            ctx.aliasNodes.push(alias);
            return alias;
          }
          obj.value = value;
          prevObjects.set(value, obj);
        }
        obj.node = tagObj.createNode ? tagObj.createNode(ctx.schema, value, ctx) : wrapScalars ? new resolveSeq.Scalar(value) : value;
        if (tagName && obj.node instanceof resolveSeq.Node)
          obj.node.tag = tagName;
        return obj.node;
      }
      function getSchemaTags(schemas2, knownTags, customTags, schemaId) {
        let tags2 = schemas2[schemaId.replace(/\W/g, "")];
        if (!tags2) {
          const keys = Object.keys(schemas2).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaId}"; use one of ${keys}`);
        }
        if (Array.isArray(customTags)) {
          for (const tag of customTags)
            tags2 = tags2.concat(tag);
        } else if (typeof customTags === "function") {
          tags2 = customTags(tags2.slice());
        }
        for (let i = 0; i < tags2.length; ++i) {
          const tag = tags2[i];
          if (typeof tag === "string") {
            const tagObj = knownTags[tag];
            if (!tagObj) {
              const keys = Object.keys(knownTags).map((key) => JSON.stringify(key)).join(", ");
              throw new Error(`Unknown custom tag "${tag}"; use one of ${keys}`);
            }
            tags2[i] = tagObj;
          }
        }
        return tags2;
      }
      var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
      var Schema2 = class {
        constructor({
          customTags,
          merge: merge2,
          schema,
          sortMapEntries,
          tags: deprecatedCustomTags
        }) {
          this.merge = !!merge2;
          this.name = schema;
          this.sortMapEntries = sortMapEntries === true ? sortMapEntriesByKey : sortMapEntries || null;
          if (!customTags && deprecatedCustomTags)
            warnings.warnOptionDeprecation("tags", "customTags");
          this.tags = getSchemaTags(schemas, tags, customTags || deprecatedCustomTags, schema);
        }
        createNode(value, wrapScalars, tagName, ctx) {
          const baseCtx = {
            defaultPrefix: Schema2.defaultPrefix,
            schema: this,
            wrapScalars
          };
          const createCtx = ctx ? Object.assign(ctx, baseCtx) : baseCtx;
          return createNode(value, tagName, createCtx);
        }
        createPair(key, value, ctx) {
          if (!ctx)
            ctx = {
              wrapScalars: true
            };
          const k = this.createNode(key, ctx.wrapScalars, null, ctx);
          const v = this.createNode(value, ctx.wrapScalars, null, ctx);
          return new resolveSeq.Pair(k, v);
        }
      };
      PlainValue._defineProperty(Schema2, "defaultPrefix", PlainValue.defaultTagPrefix);
      PlainValue._defineProperty(Schema2, "defaultTags", PlainValue.defaultTags);
      exports.Schema = Schema2;
    }
  });

  // node_modules/yaml/dist/types.js
  var require_types2 = __commonJS({
    "node_modules/yaml/dist/types.js"(exports) {
      "use strict";
      var resolveSeq = require_resolveSeq_d03cb037();
      var Schema2 = require_Schema_88e323a7();
      require_PlainValue_ec8e588e();
      require_warnings_1000a372();
      exports.Alias = resolveSeq.Alias;
      exports.Collection = resolveSeq.Collection;
      exports.Merge = resolveSeq.Merge;
      exports.Node = resolveSeq.Node;
      exports.Pair = resolveSeq.Pair;
      exports.Scalar = resolveSeq.Scalar;
      exports.YAMLMap = resolveSeq.YAMLMap;
      exports.YAMLSeq = resolveSeq.YAMLSeq;
      exports.binaryOptions = resolveSeq.binaryOptions;
      exports.boolOptions = resolveSeq.boolOptions;
      exports.intOptions = resolveSeq.intOptions;
      exports.nullOptions = resolveSeq.nullOptions;
      exports.strOptions = resolveSeq.strOptions;
      exports.Schema = Schema2.Schema;
    }
  });

  // node_modules/yaml/types.mjs
  var import_types2, binaryOptions, boolOptions, intOptions, nullOptions, strOptions, Schema, Alias, Collection, Merge, Node, Pair, Scalar, YAMLMap, YAMLSeq;
  var init_types2 = __esm({
    "node_modules/yaml/types.mjs"() {
      import_types2 = __toESM(require_types2(), 1);
      binaryOptions = import_types2.default.binaryOptions;
      boolOptions = import_types2.default.boolOptions;
      intOptions = import_types2.default.intOptions;
      nullOptions = import_types2.default.nullOptions;
      strOptions = import_types2.default.strOptions;
      Schema = import_types2.default.Schema;
      Alias = import_types2.default.Alias;
      Collection = import_types2.default.Collection;
      Merge = import_types2.default.Merge;
      Node = import_types2.default.Node;
      Pair = import_types2.default.Pair;
      Scalar = import_types2.default.Scalar;
      YAMLMap = import_types2.default.YAMLMap;
      YAMLSeq = import_types2.default.YAMLSeq;
    }
  });

  // src/lib/renderers/yaml.mjs
  function getIn(obj, path) {
    return path.reduce((v, k) => k in v ? v[k] : {}, obj);
  }
  function addComments(context, path, commentNode, iterNode = commentNode) {
    const { title, description, comment } = getIn(context, path);
    const lines = [];
    if (option_default("renderTitle") && title) {
      lines.push(` ${title}`, "");
    }
    if (option_default("renderDescription") && description) {
      lines.push(` ${description}`);
    }
    if (option_default("renderComment") && comment) {
      lines.push(` ${comment}`);
    }
    commentNode.commentBefore = lines.join("\n");
    if (iterNode instanceof YAMLMap) {
      iterNode.items.forEach((n) => {
        addComments(context, [...path, "items", n.key.value], n.key, n.value);
      });
    } else if (iterNode instanceof YAMLSeq) {
      iterNode.items.forEach((n, i) => {
        addComments(context, [...path, "items", i], n);
      });
    }
  }
  function renderYAML({ value, context }) {
    const nodes = yaml_default.createNode(value);
    addComments(context, [], nodes);
    const doc = new yaml_default.Document();
    doc.contents = nodes;
    return doc.toString();
  }
  var yaml_default;
  var init_yaml = __esm({
    "src/lib/renderers/yaml.mjs"() {
      init_yaml();
      init_types2();
      init_option();
      yaml_default = renderYAML;
    }
  });

  // src/lib/renderers/index.mjs
  var init_renderers = __esm({
    "src/lib/renderers/index.mjs"() {
      init_js();
      init_yaml();
    }
  });

  // src/lib/index.mjs
  var lib_exports = {};
  __export(lib_exports, {
    JSONSchemaFaker: () => JSONSchemaFaker,
    default: () => lib_default
  });
  function setupKeywords() {
    container.define("autoIncrement", function autoIncrement(value, schema) {
      if (!this.offset) {
        const min = schema.minimum || 1;
        const max = min + constants_default.MAX_NUMBER;
        const offset = value.initialOffset || schema.initialOffset;
        this.offset = offset || random_default.number(min, max);
      }
      if (value === true) {
        return this.offset++;
      }
      return schema;
    });
    container.define("sequentialDate", function sequentialDate(value, schema) {
      if (!this.now) {
        this.now = random_default.date();
      }
      if (value) {
        schema = this.now.toISOString();
        value = value === true ? "days" : value;
        if (["seconds", "minutes", "hours", "days", "weeks", "months", "years"].indexOf(value) === -1) {
          throw new Error(`Unsupported increment by ${utils_default.short(value)}`);
        }
        this.now.setTime(this.now.getTime() + random_default.date(value));
      }
      return schema;
    });
  }
  function getRefs(refs, schema) {
    let $refs = {};
    if (Array.isArray(refs)) {
      refs.forEach((_schema) => {
        $refs[_schema.$id || _schema.id] = _schema;
      });
    } else {
      $refs = refs || {};
    }
    function walk(obj) {
      if (!obj || typeof obj !== "object")
        return;
      if (Array.isArray(obj))
        return obj.forEach(walk);
      const _id = obj.$id || obj.id;
      if (typeof _id === "string" && !$refs[_id]) {
        $refs[_id] = obj;
      }
      Object.keys(obj).forEach((key) => {
        walk(obj[key]);
      });
    }
    walk(refs);
    walk(schema);
    return $refs;
  }
  var container, jsf, JSONSchemaFaker, lib_default;
  var init_lib = __esm({
    "src/lib/index.mjs"() {
      init_vendor();
      init_Container();
      init_format();
      init_option();
      init_constants();
      init_random();
      init_utils();
      init_run();
      init_renderers();
      container = new Container_default();
      jsf = (schema, refs, cwd) => {
        console.debug("[json-schema-faker] calling JSONSchemaFaker() is deprecated, call either .generate() or .resolve()");
        if (cwd) {
          console.debug("[json-schema-faker] local references are only supported by calling .resolve()");
        }
        return jsf.generate(schema, refs);
      };
      jsf.generateWithContext = (schema, refs) => {
        const $refs = getRefs(refs, schema);
        return run_default($refs, schema, container, true);
      };
      jsf.generate = (schema, refs) => js_default(
        jsf.generateWithContext(schema, refs)
      );
      jsf.generateYAML = (schema, refs) => yaml_default(
        jsf.generateWithContext(schema, refs)
      );
      jsf.resolveWithContext = (schema, refs, cwd) => {
        if (typeof refs === "string") {
          cwd = refs;
          refs = {};
        }
        cwd = cwd || (typeof process !== "undefined" ? process.cwd() : "");
        cwd = `${cwd.replace(/\/+$/, "")}/`;
        const $refs = getRefs(refs, schema);
        const fixedRefs = {
          order: 1,
          canRead(file) {
            const key = file.url.replace("/:", ":");
            return $refs[key] || $refs[key.split("/").pop()];
          },
          read(file, callback) {
            try {
              callback(null, this.canRead(file));
            } catch (e) {
              callback(e);
            }
          }
        };
        const { $RefParser } = getDependencies();
        return $RefParser.bundle(cwd, schema, {
          resolve: {
            file: { order: 100 },
            http: { order: 200 },
            fixedRefs
          },
          dereference: {
            circular: "ignore"
          }
        }).then((sub) => run_default($refs, sub, container)).catch((e) => {
          throw new Error(`Error while resolving schema (${e.message})`);
        });
      };
      jsf.resolve = (schema, refs, cwd) => jsf.resolveWithContext(schema, refs, cwd).then(js_default);
      jsf.resolveYAML = (schema, refs, cwd) => jsf.resolveWithContext(schema, refs, cwd).then(yaml_default);
      setupKeywords();
      jsf.format = format_default;
      jsf.option = option_default;
      jsf.random = random_default;
      jsf.extend = (name, cb) => {
        container.extend(name, cb);
        return jsf;
      };
      jsf.define = (name, cb) => {
        container.define(name, cb);
        return jsf;
      };
      jsf.reset = (name) => {
        container.reset(name);
        setupKeywords();
        return jsf;
      };
      jsf.locate = (name) => {
        return container.get(name);
      };
      jsf.VERSION = "0.5.0-rcv.46";
      JSONSchemaFaker = { ...jsf };
      lib_default = jsf;
    }
  });

  // main.iife.js
  var require_main_iife = __commonJS({
    "main.iife.js"(exports, module) {
      var { setDependencies: setDependencies2 } = (init_vendor(), __toCommonJS(vendor_exports));
      var JSONSchemaFaker2 = (init_lib(), __toCommonJS(lib_exports)).default;
      if (typeof window !== "undefined") {
        setDependencies2({
          ...window.JSONPath,
          $RefParser: window.$RefParser
        });
        window.JSONSchemaFaker = JSONSchemaFaker2;
      }
      module.exports = JSONSchemaFaker2;
      module.exports.JSONSchemaFaker = JSONSchemaFaker2;
    }
  });
  return require_main_iife();
})();
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JSONSchemaFaker = factory();
  }
}(typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : globalThis, () => JSONSchemaFaker));


}).call(this)}).call(this,require('_process'),require("buffer").Buffer)
},{"_process":6,"buffer":3}],6:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[1])(1)
});
