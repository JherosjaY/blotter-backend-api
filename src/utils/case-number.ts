/**
 * Generate unique case number in format: BLT-YYYY-XXXXX
 * Example: BLT-2026-00001
 */
export function generateCaseNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 99999) + 1;
    const paddedNumber = random.toString().padStart(5, '0');
    return `BLT-${year}-${paddedNumber}`;
}

/**
 * Validate case number format
 */
export function isValidCaseNumber(caseNumber: string): boolean {
    const pattern = /^BLT-\d{4}-\d{5}$/;
    return pattern.test(caseNumber);
}
