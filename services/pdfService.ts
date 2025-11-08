
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// The workerSrc needs to be a URL string pointing to the worker script.
// The previous import for `pdf.worker.entry` was incorrect as it's not a standard ES module 
// and the file does not exist on the specified CDN path, causing a loading failure.
// We now point directly to the correct worker script on the CDN.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://aistudiocdn.com/pdfjs-dist@^5.4.394/build/pdf.worker.js';

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const numPages = pdf.numPages;
  let fullText = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText;
}
