export interface DocumentSections {
    plan: string;
    code: string;
    parameters: string;
    comment: string;
  }

export function extractDocumentSections(text: string): DocumentSections {
  
  const extractSection = (section: string): string => {
    const regex = new RegExp(`<${section}>\\n([\\s\\S]*?)\\n<\/${section}>|<${section}>([\\s\\S]*?)<\/${section}>`);
    const match = text.match(regex);
    return (match?.[1] || match?.[2] || '').trim();
  };

  return {
    plan: extractSection('plan'),
    code: extractSection('code'),
    parameters: extractSection('parameters'),
    comment: extractSection('comment')
  };
}