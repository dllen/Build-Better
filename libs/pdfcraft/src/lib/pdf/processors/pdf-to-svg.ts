/**
 * PDF to SVG Processor
 * 
 * Converts PDF pages to SVG (Scalable Vector Graphics) format.
 * Uses pdfjs-dist for rendering PDF pages to canvas, then converts to SVG.
 */

import type {
    ProcessInput,
    ProcessOutput,
    ProgressCallback,
} from '@/types/pdf';
import { PDFErrorCode } from '@/types/pdf';
import { BasePDFProcessor } from '../processor';
import { loadPdfjs } from '../loader';

/**
 * PDF to SVG options
 */
export interface PDFToSVGOptions {
    /** Scale factor for rendering (1 = 72 DPI, 2 = 144 DPI, etc.) */
    scale: number;
    /** Specific pages to convert (empty = all pages) */
    pages: number[];
    /** Background color for transparent PDFs (hex color) */
    backgroundColor: string;
    /** Whether to embed fonts in SVG */
    embedFonts: boolean;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: PDFToSVGOptions = {
    scale: 2, // 144 DPI
    pages: [], // All pages
    backgroundColor: '#ffffff',
    embedFonts: true,
};

/**
 * SVG output result
 */
export interface SVGResult {
    svg: string;
    blob: Blob;
    pageNumber: number;
    width: number;
    height: number;
}

/**
 * PDF to SVG Processor
 * Converts PDF pages to SVG using pdfjs-dist for rendering.
 */
export class PDFToSVGProcessor extends BasePDFProcessor {
    /**
     * Process PDF and convert to SVG
     */
    async process(
        input: ProcessInput,
        onProgress?: ProgressCallback
    ): Promise<ProcessOutput> {
        this.reset();
        this.onProgress = onProgress;

        const { files, options } = input;
        const svgOptions: PDFToSVGOptions = {
            ...DEFAULT_OPTIONS,
            ...(options as Partial<PDFToSVGOptions>),
        };

        // Validate we have exactly 1 PDF file
        if (files.length !== 1) {
            return this.createErrorOutput(
                PDFErrorCode.INVALID_OPTIONS,
                'Please provide exactly one PDF file.',
                `Received ${files.length} file(s).`
            );
        }

        const file = files[0];

        // Validate file type
        if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
            return this.createErrorOutput(
                PDFErrorCode.FILE_TYPE_INVALID,
                'Invalid file type. Please upload a PDF file.',
                `Received: ${file.type || 'unknown'}`
            );
        }

        try {
            this.updateProgress(5, 'Loading PDF library...');

            const pdfjs = await loadPdfjs();

            if (this.checkCancelled()) {
                return this.createErrorOutput(
                    PDFErrorCode.PROCESSING_CANCELLED,
                    'Processing was cancelled.'
                );
            }

            this.updateProgress(10, 'Loading PDF document...');

            // Load the PDF document
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
            const totalPages = pdf.numPages;

            // Determine which pages to convert
            const pagesToConvert = svgOptions.pages.length > 0
                ? svgOptions.pages.filter(p => p >= 1 && p <= totalPages)
                : Array.from({ length: totalPages }, (_, i) => i + 1);

            if (pagesToConvert.length === 0) {
                return this.createErrorOutput(
                    PDFErrorCode.INVALID_PAGE_RANGE,
                    'No valid pages to convert.',
                    `PDF has ${totalPages} pages.`
                );
            }

            this.updateProgress(15, `Converting ${pagesToConvert.length} page(s) to SVG...`);

            const svgResults: SVGResult[] = [];
            const progressPerPage = 80 / pagesToConvert.length;

            for (let i = 0; i < pagesToConvert.length; i++) {
                if (this.checkCancelled()) {
                    return this.createErrorOutput(
                        PDFErrorCode.PROCESSING_CANCELLED,
                        'Processing was cancelled.'
                    );
                }

                const pageNum = pagesToConvert[i];
                const pageProgress = 15 + (i * progressPerPage);

                this.updateProgress(
                    pageProgress,
                    `Converting page ${pageNum} of ${totalPages}...`
                );

                try {
                    const svgResult = await this.renderPageToSVG(
                        pdf,
                        pageNum,
                        svgOptions
                    );
                    svgResults.push(svgResult);
                } catch (error) {
                    return this.createErrorOutput(
                        PDFErrorCode.PROCESSING_FAILED,
                        `Failed to convert page ${pageNum}.`,
                        error instanceof Error ? error.message : 'Unknown error'
                    );
                }
            }

            this.updateProgress(95, 'Finalizing...');

            // Generate output
            const baseName = file.name.replace(/\.pdf$/i, '');
            const blobs = svgResults.map(r => r.blob);

            if (blobs.length === 1) {
                // Single SVG output
                this.updateProgress(100, 'Complete!');
                return this.createSuccessOutput(
                    blobs[0],
                    `${baseName}.svg`,
                    {
                        pageCount: 1,
                        format: 'svg',
                        svgResults: svgResults
                    }
                );
            } else {
                // Multiple SVGs output
                this.updateProgress(100, 'Complete!');
                return this.createSuccessOutput(
                    blobs,
                    `${baseName}_pages.svg`,
                    {
                        pageCount: blobs.length,
                        format: 'svg',
                        svgResults: svgResults
                    }
                );
            }

        } catch (error) {
            return this.createErrorOutput(
                PDFErrorCode.PROCESSING_FAILED,
                'Failed to convert PDF to SVG.',
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }

    /**
     * Render a single PDF page to SVG
     */
    private async renderPageToSVG(
        pdf: Awaited<ReturnType<Awaited<ReturnType<typeof loadPdfjs>>['getDocument']>['promise']>,
        pageNum: number,
        options: PDFToSVGOptions
    ): Promise<SVGResult> {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: options.scale });

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }

        // Fill background
        ctx.fillStyle = options.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render PDF page to canvas
        await page.render({
            canvasContext: ctx,
            viewport: viewport,
        }).promise;

        // Convert canvas to SVG
        const svgString = this.canvasToSVG(canvas, viewport.width, viewport.height);

        // Create blob
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });

        return {
            svg: svgString,
            blob: svgBlob,
            pageNumber: pageNum,
            width: viewport.width,
            height: viewport.height,
        };
    }

    /**
     * Convert canvas to SVG string
     * This creates an SVG with an embedded image from the canvas
     */
    private canvasToSVG(canvas: HTMLCanvasElement, width: number, height: number): string {
        const dataUrl = canvas.toDataURL('image/png');

        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <title>PDF Page</title>
  <image width="${width}" height="${height}" xlink:href="${dataUrl}" />
</svg>`;

        return svg;
    }
}

/**
 * Create a new instance of the PDF to SVG processor
 */
export function createPDFToSVGProcessor(): PDFToSVGProcessor {
    return new PDFToSVGProcessor();
}

/**
 * Convert PDF to SVG (convenience function)
 */
export async function pdfToSVG(
    file: File,
    options?: Partial<PDFToSVGOptions>,
    onProgress?: ProgressCallback
): Promise<ProcessOutput> {
    const processor = createPDFToSVGProcessor();
    return processor.process(
        {
            files: [file],
            options: options || {},
        },
        onProgress
    );
}
