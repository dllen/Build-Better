/**
 * PowerPoint to PDF Processor
 * 
 * Converts PowerPoint presentations (PPTX) to PDF.
 * Uses Pyodide via a Web Worker with python-pptx and PyMuPDF.
 */

import type {
    ProcessInput,
    ProcessOutput,
    ProgressCallback,
} from '@/types/pdf';
import { PDFErrorCode } from '@/types/pdf';
import { BasePDFProcessor } from '../processor';

/**
 * PowerPoint to PDF options
 */
export interface PPTXToPDFOptions {
    /** Reserved for future options */
}

/**
 * PowerPoint to PDF Processor
 * Converts PowerPoint presentations to PDF using a Web Worker.
 */
export class PPTXToPDFProcessor extends BasePDFProcessor {
    private worker: Worker | null = null;
    private workerReady = false;

    /**
     * Initialize the worker
     */
    private async initWorker(): Promise<void> {
        if (this.worker) return;

        return new Promise((resolve, reject) => {
            try {
                this.worker = new Worker('/workers/pptx-to-pdf.worker.js', { type: 'module' });

                const handleMessage = (event: MessageEvent) => {
                    const { type, error, message } = event.data;

                    if (type === 'init-complete') {
                        this.workerReady = true;
                        resolve();
                    } else if (type === 'status') {
                        this.updateProgress(0, message);
                    } else if (type === 'error') {
                        reject(new Error(error || 'Worker initialization failed'));
                    }
                };

                this.worker.addEventListener('message', handleMessage);
                this.worker.addEventListener('error', (err) => {
                    reject(new Error('Worker connection failed'));
                });

                // Send init message
                this.worker.postMessage({
                    type: 'init',
                    id: 'init-' + Date.now(),
                    data: {}
                });

            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Terminate the worker
     */
    private terminateWorker() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            this.workerReady = false;
        }
    }

    /**
     * Reset processor state
     */
    protected reset(): void {
        super.reset();
    }

    /**
     * Process PowerPoint presentation and convert to PDF
     */
    async process(
        input: ProcessInput,
        onProgress?: ProgressCallback
    ): Promise<ProcessOutput> {
        this.reset();
        this.onProgress = onProgress;

        const { files } = input;

        // Validate we have exactly 1 PowerPoint file
        if (files.length !== 1) {
            return this.createErrorOutput(
                PDFErrorCode.INVALID_OPTIONS,
                'Please provide exactly one PowerPoint presentation.',
                `Received ${files.length} file(s).`
            );
        }

        const file = files[0];

        // Validate file type
        const isPPTX = file.name.toLowerCase().endsWith('.pptx') ||
            file.name.toLowerCase().endsWith('.ppt') ||
            file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
            file.type === 'application/vnd.ms-powerpoint';
        if (!isPPTX) {
            return this.createErrorOutput(
                PDFErrorCode.FILE_TYPE_INVALID,
                'Invalid file type. Please upload a PowerPoint presentation (.pptx or .ppt).',
                `Received: ${file.type || file.name}`
            );
        }

        // Note: .ppt format is not supported by python-pptx
        if (file.name.toLowerCase().endsWith('.ppt')) {
            return this.createErrorOutput(
                PDFErrorCode.FILE_TYPE_INVALID,
                'Legacy .ppt format is not supported. Please convert to .pptx first.',
                'Use Microsoft PowerPoint or LibreOffice to save as .pptx'
            );
        }

        try {
            this.updateProgress(10, 'Initializing converter...');

            try {
                await this.initWorker();
            } catch (err) {
                console.error('Failed to initialize worker:', err);
                return this.createErrorOutput(
                    PDFErrorCode.WORKER_FAILED,
                    'Failed to initialize conversion worker.',
                    err instanceof Error ? err.message : String(err)
                );
            }

            if (this.checkCancelled()) {
                return this.createErrorOutput(
                    PDFErrorCode.PROCESSING_CANCELLED,
                    'Processing was cancelled.'
                );
            }

            this.updateProgress(30, 'Converting PowerPoint to PDF...');

            // Process conversion via worker
            const pdfBlob = await new Promise<Blob>((resolve, reject) => {
                if (!this.worker) {
                    reject(new Error('Worker not initialized'));
                    return;
                }

                const msgId = 'convert-' + Date.now();

                const handleMessage = (event: MessageEvent) => {
                    const { type, id, result, error, message } = event.data;

                    if (type === 'status') {
                        this.updateProgress(this.progress, message);
                        return;
                    }

                    if (id !== msgId) return;

                    if (type === 'convert-complete') {
                        cleanup();
                        resolve(result);
                    } else if (type === 'error') {
                        cleanup();
                        reject(new Error(error || 'Conversion failed'));
                    }
                };

                const handleError = (error: ErrorEvent) => {
                    cleanup();
                    reject(new Error('Worker error: ' + error.message));
                };

                const cleanup = () => {
                    this.worker?.removeEventListener('message', handleMessage);
                    this.worker?.removeEventListener('error', handleError);
                };

                this.worker.addEventListener('message', handleMessage);
                this.worker.addEventListener('error', handleError);

                this.worker.postMessage({
                    type: 'convert',
                    id: msgId,
                    data: {
                        file: file
                    }
                });
            });

            if (this.checkCancelled()) {
                return this.createErrorOutput(
                    PDFErrorCode.PROCESSING_CANCELLED,
                    'Processing was cancelled.'
                );
            }

            this.updateProgress(100, 'Conversion complete!');

            const baseName = file.name.replace(/\.pptx?$/i, '');
            const outputName = `${baseName}.pdf`;

            return this.createSuccessOutput(
                pdfBlob,
                outputName,
                { format: 'pdf' }
            );

        } catch (error) {
            console.error('Conversion error:', error);
            this.terminateWorker();

            return this.createErrorOutput(
                PDFErrorCode.PROCESSING_FAILED,
                'Failed to convert PowerPoint to PDF.',
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }
}

/**
 * Create a new instance of the PowerPoint to PDF processor
 */
export function createPPTXToPDFProcessor(): PPTXToPDFProcessor {
    return new PPTXToPDFProcessor();
}

/**
 * Convert PowerPoint to PDF (convenience function)
 */
export async function pptxToPDF(
    file: File,
    options?: Partial<PPTXToPDFOptions>,
    onProgress?: ProgressCallback
): Promise<ProcessOutput> {
    const processor = createPPTXToPDFProcessor();
    return processor.process(
        {
            files: [file],
            options: options || {},
        },
        onProgress
    );
}
