/**
 * RTF to PDF Processor
 * 
 * Converts RTF files to PDF documents.
 * Uses Pyodide via a Web Worker with PyMuPDF for rendering.
 */

import type {
    ProcessInput,
    ProcessOutput,
    ProgressCallback,
} from '@/types/pdf';
import { PDFErrorCode } from '@/types/pdf';
import { BasePDFProcessor } from '../processor';

/**
 * RTF to PDF options
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RTFToPDFOptions {
    /** Reserved for future options */
}

/**
 * RTF to PDF Processor
 * Converts RTF files to PDF using a Web Worker.
 */
export class RTFToPDFProcessor extends BasePDFProcessor {
    private worker: Worker | null = null;
    private workerReady = false;

    /**
     * Initialize the worker
     */
    private async initWorker(): Promise<void> {
        if (this.worker) return;

        return new Promise((resolve, reject) => {
            try {
                this.worker = new Worker('/workers/rtf-to-pdf.worker.js', { type: 'module' });

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
                this.worker.addEventListener('error', () => {
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
     * Process RTF and convert to PDF
     */
    async process(
        input: ProcessInput,
        onProgress?: ProgressCallback
    ): Promise<ProcessOutput> {
        this.reset();
        this.onProgress = onProgress;

        const { files } = input;

        // Validate we have exactly 1 RTF file
        if (files.length !== 1) {
            return this.createErrorOutput(
                PDFErrorCode.INVALID_OPTIONS,
                'Please provide exactly one RTF file.',
                `Received ${files.length} file(s).`
            );
        }

        const file = files[0];

        // Validate file type
        const isRTF = file.name.toLowerCase().endsWith('.rtf') ||
            file.type === 'application/rtf' ||
            file.type === 'text/rtf';
        if (!isRTF) {
            return this.createErrorOutput(
                PDFErrorCode.FILE_TYPE_INVALID,
                'Invalid file type. Please upload an RTF file.',
                `Received: ${file.type || file.name}`
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

            this.updateProgress(30, 'Converting RTF to PDF...');

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

            const baseName = file.name.replace(/\.rtf$/i, '');
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
                'Failed to convert RTF to PDF.',
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }
}

/**
 * Create a new instance of the RTF to PDF processor
 */
export function createRTFToPDFProcessor(): RTFToPDFProcessor {
    return new RTFToPDFProcessor();
}

/**
 * Convert RTF to PDF (convenience function)
 */
export async function rtfToPDF(
    file: File,
    options?: Partial<RTFToPDFOptions>,
    onProgress?: ProgressCallback
): Promise<ProcessOutput> {
    const processor = createRTFToPDFProcessor();
    return processor.process(
        {
            files: [file],
            options: options || {},
        },
        onProgress
    );
}
