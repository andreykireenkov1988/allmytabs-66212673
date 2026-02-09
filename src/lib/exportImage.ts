import { toPng } from 'html-to-image';

interface ExportOptions {
  filename: string;
  backgroundColor?: string;
  mobileWidth?: number;
}

export async function exportElementAsImage(
  element: HTMLElement,
  options: ExportOptions
): Promise<void> {
  const { filename, backgroundColor = '#ffffff', mobileWidth = 420 } = options;

  // Clone the element off-screen with mobile-friendly width
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = `${mobileWidth}px`;
  clone.style.padding = '16px';
  clone.style.position = 'fixed';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.zIndex = '-1';
  clone.style.backgroundColor = backgroundColor;
  
  document.body.appendChild(clone);

  try {
    const dataUrl = await toPng(clone, {
      quality: 1.0,
      pixelRatio: 2,
      backgroundColor,
    });

    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
  } finally {
    document.body.removeChild(clone);
  }
}
