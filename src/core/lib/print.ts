export type ReceiptPaperSize = '58mm' | '80mm';

export function receiptClassName(paperSize: ReceiptPaperSize): string {
  return `receipt-print receipt-${paperSize}`;
}

export function printReceipt(): void {
  window.print();
}
