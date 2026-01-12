/**
 * Word to PDF Processor
 * 
 * Converts Word documents (DOCX) to PDF.
 * Uses Pyodide via a Web Worker with python-docx and PyMuPDF.
 */

import type {
    ProcessInput,
    ProcessOutput,
    ProgressCallback,
} from '@/types/pdf';
import { PDFErrorCode } from '@/types/pdf';
import { BasePDFProcessor } from '../processor';

/**
 * Word to PDF options
 */
export interface WordToPDFOptions {
    /** Reserved for future options */
    [key: string]: never;
}

/**
 * Word to PDF Processor
 * Converts Word documents to PDF using a Web Worker.
 */
export class WordToPDFProcessor extends BasePDFProcessor {
    private worker: Worker | null = null;
    private workerReady = false;

    /**
     * Initialize the worker
     */
    private async initWorker(): Promise<void> {
        if (this.worker) return;

        return new Promise((resolve, reject) => {
            try {
                this.worker = new Worker('/workers/word-to-pdf.worker.js', { type: 'module' });

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
     * Process Word document and convert to PDF
     */
    async process(
        input: ProcessInput,
        onProgress?: ProgressCallback
    ): Promise<ProcessOutput> {
        this.reset();
        this.onProgress = onProgress;

        const { files } = input;

        // Validate we have exactly 1 Word file
        if (files.length !== 1) {
            return this.createErrorOutput(
                PDFErrorCode.INVALID_OPTIONS,
                'Please provide exactly one Word document.',
                `Received ${files.length} file(s).`
            );
        }

        const file = files[0];

        // Validate file type
        const isWord = file.name.toLowerCase().endsWith('.docx') ||
            file.name.toLowerCase().endsWith('.doc') ||
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.type === 'application/msword';
        if (!isWord) {
            return this.createErrorOutput(
                PDFErrorCode.FILE_TYPE_INVALID,
                'Invalid file type. Please upload a Word document (.docx or .doc).',
                `Received: ${file.type || file.name}`
            );
        }

        // Note: .doc format is not supported by python-docx
        if (file.name.toLowerCase().endsWith('.doc')) {
            return this.createErrorOutput(
                PDFErrorCode.FILE_TYPE_INVALID,
                'Legacy .doc format is not supported. Please convert to .docx first.',
                'Use Microsoft Word or LibreOffice to save as .docx'
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

            this.updateProgress(30, 'Converting Word document to PDF...');

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

            const baseName = file.name.replace(/\.docx?$/i, '');
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
                'Failed to convert Word document to PDF.',
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }
}

/**
 * Create a new instance of the Word to PDF processor
 */
export function createWordToPDFProcessor(): WordToPDFProcessor {
    return new WordToPDFProcessor();
}

/**
 * Convert Word to PDF (convenience function)
 */
export async function wordToPDF(
    file: File,
    options?: Partial<WordToPDFOptions>,
    onProgress?: ProgressCallback
): Promise<ProcessOutput> {
    const processor = createWordToPDFProcessor();
    return processor.process(
        {
            files: [file],
            options: options || {},
        },
        onProgress
    );
}
