import { toPng } from 'html-to-image';

interface ExportOptions {
  filename: string;
}

export async function exportElementAsImage(
  element: HTMLElement,
  options: ExportOptions
): Promise<void> {
  const { filename } = options;

  // Get background color from CSS variables
  const bgRaw = getComputedStyle(document.documentElement)
    .getPropertyValue('--background')
    .trim();
  const backgroundColor = bgRaw ? `hsl(${bgRaw})` : '#ffffff';

  try {
    const dataUrl = await toPng(element, {
      quality: 1.0,
      pixelRatio: 2,
      backgroundColor,
      // Filter out elements that shouldn't be in the export
      filter: (node) => {
        // Skip hidden elements
        if (node instanceof HTMLElement && node.style.display === 'none') {
          return false;
        }
        return true;
      },
    });

    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error exporting image:', error);
    throw error;
  }
}
