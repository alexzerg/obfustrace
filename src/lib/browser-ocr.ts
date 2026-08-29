"use client";

export type BrowserOcrProgress = {
  status: string;
  progress: number;
};

export type BrowserOcrResult = {
  provider: "private-browser-ocr";
  text: string;
  confidence: number;
  pageCount: number;
};

async function renderPdfPages(file: File, onProgress: (progress: BrowserOcrProgress) => void) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const canvases: HTMLCanvasElement[] = [];
  const pageLimit = Math.min(pdf.numPages, 3);

  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
    onProgress({ status: `Rendering PDF page ${pageNumber} of ${pageLimit}`, progress: (pageNumber - 1) / pageLimit * 0.2 });
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Browser canvas is unavailable.");
    }
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    canvases.push(canvas);
  }

  return { canvases, pageCount: pdf.numPages };
}

export async function extractWithBrowserOcr(
  file: File,
  onProgress: (progress: BrowserOcrProgress) => void,
): Promise<BrowserOcrResult> {
  onProgress({ status: "Loading private OCR engine", progress: 0.02 });
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (event) => {
      if (typeof event.progress === "number") {
        onProgress({
          status: event.status || "Reading document",
          progress: 0.2 + event.progress * 0.75,
        });
      }
    },
  });

  try {
    const sources: Array<File | HTMLCanvasElement> = [];
    let pageCount = 1;

    if (file.type === "application/pdf") {
      const rendered = await renderPdfPages(file, onProgress);
      sources.push(...rendered.canvases);
      pageCount = rendered.pageCount;
    } else if (file.type.startsWith("image/")) {
      sources.push(file);
    } else {
      throw new Error("Private browser OCR currently supports PDF and image files. Use Nutrient DWS for Office documents.");
    }

    const texts: string[] = [];
    const confidences: number[] = [];
    for (let index = 0; index < sources.length; index += 1) {
      onProgress({
        status: `Reading page ${index + 1} of ${sources.length}`,
        progress: 0.2 + index / Math.max(1, sources.length) * 0.7,
      });
      const result = await worker.recognize(sources[index]);
      texts.push(result.data.text.trim());
      confidences.push(result.data.confidence);
    }

    onProgress({ status: "Preparing human review", progress: 1 });
    return {
      provider: "private-browser-ocr",
      text: texts.filter(Boolean).join("\n\n--- PAGE ---\n\n"),
      confidence: confidences.length
        ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
        : 0,
      pageCount,
    };
  } finally {
    await worker.terminate();
  }
}
