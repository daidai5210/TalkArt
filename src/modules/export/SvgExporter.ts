/**
 * @module export/SvgExporter
 * Serializes an SVG DOM element to a file and triggers a browser download.
 *
 * Usage:
 * ```ts
 * const svgEl = document.querySelector('svg')!;
 * exportSVG(svgEl, 'my-drawing');
 * // → downloads "my-drawing.svg"
 * ```
 */

/**
 * Export an SVG element as an .svg file download.
 *
 * Serializes the SVG element (including all child nodes) to an XML string,
 * wraps it in a Blob, creates a temporary download link, and clicks it.
 * The link is removed from the DOM after the download is initiated.
 *
 * @param svgElement - The root <svg> DOM element to export.
 * @param filename - Desired file name without extension. Defaults to "talkart-export".
 */
export function exportSVG(
  svgElement: SVGSVGElement,
  filename: string = 'talkart-export',
): void {
  // Serialize the SVG element to string, including xmlns if missing
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgElement);

  // Ensure the xmlns attribute is present for standalone SVG files
  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace(
      '<svg',
      '<svg xmlns="http://www.w3.org/2000/svg"',
    );
  }

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  triggerDownload(blob, `${filename}.svg`);
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
