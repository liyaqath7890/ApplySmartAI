/**
 * File Parser Service
 *
 * Extracts plain text from PDF and DOCX files.
 * Returns structured content for resume parsing downstream.
 *
 * Dependencies (already in package.json):
 *   • pdf-parse  — PDF text extraction
 *   • mammoth    — DOCX → plain text (installed: npm install mammoth)
 */

import pdfParse from 'pdf-parse';
import logger from '../utils/logger.js';

/**
 * Parse a file buffer and return extracted text.
 *
 * @param {Buffer} buffer    - Raw file bytes
 * @param {string} mimeType  - MIME type (e.g. 'application/pdf')
 * @param {string} fileName  - Original filename (used for extension fallback)
 * @returns {Promise<{ text: string, pages: number|null, metadata: object }>}
 */
export async function parseFile(buffer, mimeType, fileName = '') {
  const mime = (mimeType || '').toLowerCase();
  const ext = (fileName.split('.').pop() || '').toLowerCase();

  if (mime === 'application/pdf' || ext === 'pdf') {
    return parsePDF(buffer);
  }

  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    return parseDOCX(buffer);
  }

  if (mime === 'application/msword' || ext === 'doc') {
    // .doc (old binary format) — best effort as plain text
    return { text: buffer.toString('utf8', 0, Math.min(buffer.length, 100000)), pages: null, metadata: {} };
  }

  if (mime.startsWith('text/') || ext === 'txt') {
    return { text: buffer.toString('utf8'), pages: null, metadata: {} };
  }

  throw new Error(`Unsupported file type: ${mimeType || ext}`);
}

/**
 * Parse a PDF buffer.
 */
async function parsePDF(buffer) {
  try {
    const data = await pdfParse(buffer, {
      // Suppress pdf-parse's internal test file warnings
      max: 0,
    });

    return {
      text:     (data.text || '').trim(),
      pages:    data.numpages,
      metadata: {
        info:     data.info,
        version:  data.version,
      },
    };
  } catch (err) {
    logger.error(`PDF parsing failed: ${err.message}`);
    throw new Error(`Failed to parse PDF: ${err.message}`);
  }
}

/**
 * Parse a DOCX buffer using mammoth.
 */
async function parseDOCX(buffer) {
  try {
    // Lazy import — mammoth is only needed when a DOCX is actually uploaded
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });

    return {
      text:     (result.value || '').trim(),
      pages:    null, // DOCX doesn't expose page count easily
      metadata: { messages: result.messages },
    };
  } catch (err) {
    logger.error(`DOCX parsing failed: ${err.message}`);
    throw new Error(`Failed to parse DOCX: ${err.message}`);
  }
}

/**
 * Extract structured resume sections from raw text.
 * Lightweight heuristic — not AI. Returns sections for downstream AI processing.
 *
 * @param {string} text
 * @returns {{ sections: object, wordCount: number, skills: string[] }}
 */
export function extractResumeSections(text) {
  if (!text) return { sections: {}, wordCount: 0, skills: [] };

  const sections = {};
  const sectionHeaders = [
    { key: 'summary',       patterns: /summary|objective|profile|about me/i },
    { key: 'experience',    patterns: /experience|work history|employment/i },
    { key: 'education',     patterns: /education|academic|degree|university/i },
    { key: 'skills',        patterns: /skills|technologies|competencies|expertise/i },
    { key: 'projects',      patterns: /projects|portfolio|work samples/i },
    { key: 'certifications',patterns: /certif|license|credential/i },
    { key: 'awards',        patterns: /award|honor|recognition|achievement/i },
    { key: 'contact',       patterns: /contact|phone|email|address|linkedin/i },
  ];

  const lines = text.split('\n');
  let currentSection = 'general';
  sections[currentSection] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let matched = false;
    for (const { key, patterns } of sectionHeaders) {
      if (patterns.test(trimmed) && trimmed.length < 60) {
        currentSection = key;
        sections[currentSection] = sections[currentSection] || [];
        matched = true;
        break;
      }
    }

    if (!matched) {
      sections[currentSection] = sections[currentSection] || [];
      sections[currentSection].push(trimmed);
    }
  }

  // Extract skills from skills section or full text
  const skillsText = (sections.skills || []).join(' ') || text;
  const skills = extractSkillKeywords(skillsText);

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return { sections, wordCount, skills };
}

/**
 * Lightweight skill keyword extraction from text.
 */
function extractSkillKeywords(text) {
  const KNOWN_SKILLS = [
    'JavaScript','TypeScript','Python','Java','Go','Rust','C++','C#','Ruby','PHP','Swift','Kotlin',
    'React','Vue','Angular','Next.js','Node.js','Express','NestJS','FastAPI','Django','Flask',
    'PostgreSQL','MySQL','MongoDB','Redis','Elasticsearch','DynamoDB',
    'AWS','GCP','Azure','Docker','Kubernetes','Terraform','CI/CD','GitHub Actions','Jenkins',
    'GraphQL','REST','gRPC','WebSocket','Kafka','RabbitMQ',
    'Machine Learning','Deep Learning','PyTorch','TensorFlow','scikit-learn','NLP',
    'Agile','Scrum','JIRA','Confluence','Git',
    'HTML','CSS','Tailwind','Bootstrap','SASS',
    'React Native','Flutter','iOS','Android',
  ];

  const lower = text.toLowerCase();
  return KNOWN_SKILLS.filter(s => lower.includes(s.toLowerCase()));
}

export default { parseFile, extractResumeSections };
