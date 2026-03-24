// Image processing utilities for OLED display
// Includes binary conversion and Floyd-Steinberg dithering

export interface ProcessedImage {
  width: number
  height: number
  pixels: Uint8Array  // 1 = white, 0 = black
  dataArray: Uint8Array  // Byte array for C code export
}

/**
 * Convert image to binary (black/white) using threshold
 */
export function binarizeImage(
  imageData: ImageData,
  threshold: number = 128,
  invert: boolean = false
): Uint8Array {
  const { width, height, data } = imageData
  const result = new Uint8Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      // Convert to grayscale using luminance formula
      const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
      let pixel = gray >= threshold ? 1 : 0
      if (invert) pixel = 1 - pixel
      result[y * width + x] = pixel
    }
  }

  return result
}

/**
 * Apply Floyd-Steinberg dithering for better grayscale representation
 */
export function floydSteinbergDither(
  imageData: ImageData,
  invert: boolean = false
): Uint8Array {
  const { width, height, data } = imageData
  const result = new Uint8Array(width * height)

  // Create grayscale buffer (float for error diffusion)
  const gray = new Float32Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
  }

  // Floyd-Steinberg error diffusion
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const oldPixel = gray[idx]
      const newPixel = oldPixel >= 128 ? 255 : 0
      result[idx] = newPixel > 0 ? 1 : 0
      if (invert) result[idx] = 1 - result[idx]

      const error = oldPixel - newPixel

      // Distribute error to neighboring pixels
      // Right: 7/16
      if (x + 1 < width) {
        gray[idx + 1] += error * 7 / 16
      }
      // Bottom-left: 3/16
      if (y + 1 < height && x - 1 >= 0) {
        gray[idx + width - 1] += error * 3 / 16
      }
      // Bottom: 5/16
      if (y + 1 < height) {
        gray[idx + width] += error * 5 / 16
      }
      // Bottom-right: 1/16
      if (y + 1 < height && x + 1 < width) {
        gray[idx + width + 1] += error * 1 / 16
      }
    }
  }

  return result
}

/**
 * Convert pixel array to byte array for OLED (column-major, LSB first)
 * This is the format used by SSD1306
 */
export function pixelsToOledBytes(
  pixels: Uint8Array,
  width: number,
  height: number,
  format: 'COLUMN' | 'ROW' = 'COLUMN',
  bitOrder: 'LSB' | 'MSB' = 'LSB'
): Uint8Array {
  const pages = Math.ceil(height / 8)
  const result = new Uint8Array(width * pages)

  if (format === 'COLUMN') {
    // Column-major (SSD1306 default)
    for (let page = 0; page < pages; page++) {
      for (let x = 0; x < width; x++) {
        let byte = 0
        for (let bit = 0; bit < 8; bit++) {
          const y = page * 8 + bit
          if (y < height) {
            const pixel = pixels[y * width + x]
            if (bitOrder === 'LSB') {
              if (pixel) byte |= (1 << bit)
            } else {
              if (pixel) byte |= (1 << (7 - bit))
            }
          }
        }
        result[page * width + x] = byte
      }
    }
  } else {
    // Row-major
    for (let page = 0; page < pages; page++) {
      for (let x = 0; x < width; x++) {
        let byte = 0
        for (let bit = 0; bit < 8; bit++) {
          const y = page * 8 + bit
          if (y < height) {
            const pixel = pixels[y * width + x]
            if (bitOrder === 'LSB') {
              if (pixel) byte |= (1 << bit)
            } else {
              if (pixel) byte |= (1 << (7 - bit))
            }
          }
        }
        result[x * pages + page] = byte
      }
    }
  }

  return result
}

/**
 * Generate C array string from byte array
 */
export function bytesToCArray(
  bytes: Uint8Array,
  name: string,
  width: number,
  height: number,
  includeComments: boolean = true
): string {
  const lines: string[] = []

  if (includeComments) {
    lines.push(`/* Image: ${name} */`)
    lines.push(`/* Size: ${width}x${height} pixels */`)
  }

  lines.push(`const uint8_t ${name}[] = {`)

  // Format bytes in rows of 16
  const bytesPerRow = 16
  for (let i = 0; i < bytes.length; i += bytesPerRow) {
    const rowBytes = Array.from(bytes.slice(i, Math.min(i + bytesPerRow, bytes.length)))
    const hexStr = rowBytes.map(b => `0x${b.toString(16).padStart(2, '0').toUpperCase()}`).join(', ')
    const isLast = i + bytesPerRow >= bytes.length
    lines.push(`    ${hexStr}${isLast ? '' : ','}`)
  }

  lines.push('};')
  lines.push(`const uint16_t ${name}_width = ${width};`)
  lines.push(`const uint16_t ${name}_height = ${height};`)

  return lines.join('\n')
}

/**
 * Process image from data URL
 */
export async function processImageFromDataUrl(
  dataUrl: string,
  targetWidth: number,
  targetHeight: number,
  options: {
    threshold?: number
    dithering?: boolean
    invert?: boolean
    format?: 'COLUMN' | 'ROW'
    bitOrder?: 'LSB' | 'MSB'
  } = {}
): Promise<ProcessedImage> {
  const {
    threshold = 128,
    dithering = false,
    invert = false,
    format = 'COLUMN',
    bitOrder = 'LSB'
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // Create canvas and draw scaled image
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // Draw with nearest-neighbor scaling for pixel art
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)

      // Convert to binary
      const pixels = dithering
        ? floydSteinbergDither(imageData, invert)
        : binarizeImage(imageData, threshold, invert)

      // Convert to byte array
      const dataArray = pixelsToOledBytes(pixels, targetWidth, targetHeight, format, bitOrder)

      resolve({
        width: targetWidth,
        height: targetHeight,
        pixels,
        dataArray
      })
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}

/**
 * Resize image maintaining aspect ratio
 */
export function calculateFitSize(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight)
  return {
    width: Math.floor(srcWidth * ratio),
    height: Math.floor(srcHeight * ratio)
  }
}

/**
 * Apply RLE compression to byte array
 */
export function rleCompress(bytes: Uint8Array): Uint8Array {
  const result: number[] = []
  let i = 0

  while (i < bytes.length) {
    const value = bytes[i]
    let count = 1

    // Count consecutive same values (max 127)
    while (i + count < bytes.length && bytes[i + count] === value && count < 127) {
      count++
    }

    if (count >= 3) {
      // RLE encode: 0x80 | count, value
      result.push(0x80 | count, value)
      i += count
    } else {
      // Literal: just the value
      result.push(value)
      i++
    }
  }

  return new Uint8Array(result)
}

/**
 * Generate preview canvas from pixel array
 */
export function renderPixelsToCanvas(
  canvas: HTMLCanvasElement,
  pixels: Uint8Array,
  width: number,
  height: number,
  scale: number = 1,
  onColor: string = '#00ff00',
  offColor: string = '#1a1a1a'
): void {
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = offColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = onColor
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[y * width + x]) {
        ctx.fillRect(x * scale, y * scale, scale, scale)
      }
    }
  }
}
