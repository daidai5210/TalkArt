/**
 * @module export/leafer-exporter
 * Export Leafer canvas to SVG/PNG files.
 */

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export async function exportLeaferSVG(svgContent: string, filename: string): Promise<void> {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, `${filename}.svg`);
}

export async function exportLeaferPNG(dataUrl: string, filename: string): Promise<void> {
  if (dataUrl.startsWith('blob:')) {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    downloadBlob(blob, `${filename}.png`);
    URL.revokeObjectURL(dataUrl);
    return;
  }
  downloadDataUrl(dataUrl, `${filename}.png`);
}
