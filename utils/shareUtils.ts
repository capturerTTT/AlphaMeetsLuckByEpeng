import qrcode from 'qrcode-generator';

/**
 * Generate a PNG data-URL QR code for the given short URL.
 *
 * Note: only intended for SHORT urls (homepage, etc). The previous design
 * encoded the entire report into the URL hash and produced URLs that
 * exceeded the QR byte-mode capacity (>2331 bytes), causing qr.make() to
 * throw synchronously and crash SharePageView (the "blank-after-share" bug).
 *
 * Now we always pass the homepage URL — capacity is never an issue.
 */
export function generateQRDataURL(url: string, size = 200): Promise<string> {
  try {
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const cell = Math.floor(size / moduleCount);
    const dim = cell * moduleCount;

    const canvas = document.createElement('canvas');
    canvas.width = dim;
    canvas.height = dim;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.reject(new Error('canvas 2d context unavailable'));

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, dim, dim);
    ctx.fillStyle = '#000000';
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.isDark(r, c)) ctx.fillRect(c * cell, r * cell, cell, cell);
      }
    }

    return Promise.resolve(canvas.toDataURL('image/png'));
  } catch (e) {
    // qr.make() throws synchronously when input exceeds capacity — surface as a rejection
    return Promise.reject(e);
  }
}
