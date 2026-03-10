# fonts/

Arabic fonts for PDF export.

## Current approach

`exportPDF()` uses **html2canvas** to capture the already-rendered `#page-results`
DOM node and embed it as a JPEG image in a paginated jsPDF document.

Because the browser's own text engine renders the capture:
- Arabic glyph shaping (contextual letter forms) is handled automatically
- RTL bidirectional layout is correct
- The Cairo web font loaded via Google Fonts CSS is used

No TTF file needs to be served from this folder for the current implementation.

## Future: native jsPDF text with Cairo font

If direct jsPDF text drawing is needed (e.g. for searchable/copy-able PDFs),
place `Cairo-Regular.ttf` here. The font can be downloaded from:

  https://fonts.google.com/specimen/Cairo → Download family → static/Cairo-Regular.ttf

Then in `exportPDF()`:
  1. `fetch('/fonts/Cairo-Regular.ttf')` → arrayBuffer → base64
  2. `pdf.addFileToVFS('Cairo-Regular.ttf', base64)`
  3. `pdf.addFont('Cairo-Regular.ttf', 'Cairo', 'normal')`
  4. `pdf.setFont('Cairo', 'normal')`
  5. Use `arabic-reshaper` JS lib to convert text to display forms before drawing
