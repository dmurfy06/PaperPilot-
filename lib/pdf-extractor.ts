'use client';

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  success: boolean;
  error?: string;
}

// Simple PDF text extractor without worker issues
export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
  try {
    // Convert to text using basic PDF parsing
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Extract text from PDF structure
    const text = extractPDFText(uint8Array);
    
    if (!text || text.trim().length === 0) {
      return {
        text: '',
        pageCount: 0,
        success: false,
        error: 'Could not extract text from PDF. Try a different PDF with text content.',
      };
    }

    // Count approximate pages
    const pageCount = Math.max(1, Math.ceil(text.length / 2000));

    return {
      text: text.trim(),
      pageCount,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('PDF extraction error:', errorMessage);
    return {
      text: '',
      pageCount: 0,
      success: false,
      error: `Failed to extract PDF: ${errorMessage}. Please ensure it's a valid PDF.`,
    };
  }
}

// Helper function to extract text from PDF bytes
function extractPDFText(data: Uint8Array): string {
  try {
    const decoder = new TextDecoder('latin1');
    let str = decoder.decode(data);
    
    // Remove PDF headers and metadata
    str = str.replace(/%.*?[\r\n]/g, '');
    
    // Extract text between BT and ET markers (PDF text operators)
    const textRegex = /BT[\s\S]*?ET/g;
    let extractedText = '';
    
    let match;
    while ((match = textRegex.exec(str)) !== null) {
      const section = match[0];
      
      // Look for Tj and TJ operators (text show operators)
      const textOps = /\((.*?)\)\s*T[jd]/g;
      let textMatch;
      while ((textMatch = textOps.exec(section)) !== null) {
        const rawText = textMatch[1];
        // Decode octal sequences
        const decoded = rawText
          .replace(/\\(\d{3})/g, (_, octal) => 
            String.fromCharCode(parseInt(octal, 8))
          )
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')');
        
        extractedText += decoded + ' ';
      }
    }
    
    // Fallback: if no structured text found, extract all printable characters
    if (!extractedText.trim()) {
      extractedText = str
        .split('')
        .filter(char => {
          const code = char.charCodeAt(0);
          return (code >= 32 && code <= 126) || code === 10 || code === 13;
        })
        .join('')
        .replace(/\s+/g, ' ');
    }
    
    return extractedText;
  } catch (error) {
    console.warn('Error in extractPDFText:', error);
    return '';
  }
}
