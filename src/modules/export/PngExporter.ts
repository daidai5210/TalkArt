/**
 * @module export/PngExporter
 * Converts an SVG DOM element to a PNG image and triggers a browser download.
 *
 * Uses the Canvas API to render the SVG to a raster image:
 * 1. Serialize the SVG to a data URL
 * 2. Create an Image from the data URL
 * 3. Draw the Image onto a Canvas
 * 4. Export the Canvas as a PNG Blob
 *
 * Usage:
 * ```ts
 * const svgEl = document.querySelector('svg')!;
 * await exportPNG(svgEl, 'my-drawing');
 * // → downloads "my-drawing.png"
 * ```
 */

/**
 * Export an SVG element as a .png file download.
 *
 * @param svgElement - The root <svg> DOM element to export.
 * @param filename - Desired file name without extension. Defaults to "talkart-export".
 * @param scale - Optional scale factor for higher resolution output. Defaults to 2.
 * @returns Promise that resolves when the download is initiated.
 */
export async function exportPNG(
  svgElement: SVGSVGElement,
  filename: string = 'talkart-export',
  scale: number = 2,
): Promise<void> {
  // Get the SVG dimensions from viewBox or width/height attributes
  const viewBox = svgElement.getAttribute('viewBox');
  let width: number;
  let height: number;

  if (viewBox) {
    const parts = viewBox.split(/\s+/).map(Number);
    width = parts[2] || 800;
    height = parts[3] || 600;
  } else {
    width = svgElement.width.baseVal.value || 800;
    height = svgElement.height.baseVal.value || 600;
  }

  // Create a canvas with scaled dimensions
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法创建 Canvas 上下文');
  }

  // Scale the context for higher resolution
  ctx.scale(scale, scale);

  // Fill with white background (SVGs often have transparent backgrounds)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Serialize the SVG to a data URL
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgElement);

  // Ensure xmlns is present
  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace(
      '<svg',
      '<svg xmlns="http://www.w3.org/2000/svg"',
    );
  }

  // Encode special characters for data URL
  const encodedSvg = encodeURIComponent(svgString)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');

  const dataUrl = `data:image/svg+xml,${encodedSvg}`;

  // Load the SVG as an image
  const image = new Image();
  image.width = width;
  image.height = height;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => {
      ctx.drawImage(image, 0, 0, width, height);
      resolve();
    };
    image.onerror = () => {
      reject(new Error('无法加载 SVG 图像'));
    };
    image.src = dataUrl;
  });

  // Convert canvas to PNG blob and trigger download
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('无法创建 PNG 图像'));
        return;
      }
      triggerDownload(blob, `${filename}.png`);
      resolve();
    }, 'image/png');
  });
}

/**
 * Create a temporary anchor element to trigger a file download.
 *
 * @param blob - The Blob to download.
 * @param filename - The full filename including extension.
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
