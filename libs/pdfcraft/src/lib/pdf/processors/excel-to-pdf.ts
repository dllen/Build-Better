/**
 * Excel to PDF Processor
 * 
 * Converts Excel spreadsheets (XLSX) to PDF.
 * Uses Pyodide via a Web Worker with openpyxl and PyMuPDF.
 */

import type {
    ProcessInput,
    ProcessOutput,
    ProgressCallback,
} from '@/types/pdf';
import { PDFErrorCode } from '@/types/pdf';
import { BasePDFProcessor } from '../processor';

/**
 * Excel to PDF options
 */
export interface ExcelToPDFOptions {
    /** Reserved for future options */
}

/**
 * Excel to PDF Processor
 * Converts Excel spreadsheets to PDF using a Web Worker.
 */
export class ExcelToPDFProcessor extends BasePDFProcessor {
    private worker: Worker | null = null;
    private workerReady = false;

    /**
     * Initialize the worker
     */
    private async initWorker(): Promise<void> {
        if (this.worker) return;

        return new Promise((resolve, reject) => {
            try {
                this.worker = new Worker('/workers/excel-to-pdf.worker.js', { type: 'module' });

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
     * Process Excel spreadsheet and convert to PDF
     */
    async process(
        input: ProcessInput,
        onProgress?: ProgressCallback
    ): Promise<ProcessOutput> {
        this.reset();
        this.onProgress = onProgress;

        const { files } = input;

        // Validate we have exactly 1 Excel file
        if (files.length !== 1) {
            return this.createErrorOutput(
                PDFErrorCode.INVALID_OPTIONS,
                'Please provide exactly one Excel spreadsheet.',
                `Received ${files.length} file(s).`
            );
        }

        const file = files[0];

        // Validate file type
        const isExcel = file.name.toLowerCase().endsWith('.xlsx') ||
            file.name.toLowerCase().endsWith('.xls') ||
            file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.type === 'application/vnd.ms-excel';
        if (!isExcel) {
            return this.createErrorOutput(
                PDFErrorCode.FILE_TYPE_INVALID,
                'Invalid file type. Please upload an Excel spreadsheet (.xlsx or .xls).',
                `Received: ${file.type || file.name}`
            );
        }

        // Note: .xls format is not supported by openpyxl
        if (file.name.toLowerCase().endsWith('.xls')) {
            return this.createErrorOutput(
                PDFErrorCode.FILE_TYPE_INVALID,
                'Legacy .xls format is not supported. Please convert to .xlsx first.',
                'Use Microsoft Excel or LibreOffice to save as .xlsx'
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

            this.updateProgress(30, 'Converting Excel to PDF...');

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

            const baseName = file.name.replace(/\.xlsx?$/i, '');
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
                'Failed to convert Excel to PDF.',
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }
}

/**
 * Create a new instance of the Excel to PDF processor
 */
export function createExcelToPDFProcessor(): ExcelToPDFProcessor {
    return new ExcelToPDFProcessor();
}

/**
 * Convert Excel to PDF (convenience function)
 */
export async function excelToPDF(
    file: File,
    options?: Partial<ExcelToPDFOptions>,
    onProgress?: ProgressCallback
): Promise<ProcessOutput> {
    const processor = createExcelToPDFProcessor();
    return processor.process(
        {
            files: [file],
            options: options || {},
        },
        onProgress
    );
}
