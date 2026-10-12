/**
 * DocuVault - Document Classifier
 * Keyword-based rule engine for classifying academic documents.
 * Each category has weighted keywords; highest-scoring wins.
 */

const CATEGORIES = {
  CERTIFICATE: {
    label: 'Certificate',
    keywords: [
      'certificate', 'certified', 'certify', 'certification', 'certifies',
      'awarded', 'award', 'achievement', 'this is to certify', 'has successfully',
      'completion certificate', 'presented to', 'congratulations',
    ],
    weight: 1.0,
  },
  MARK_SHEET: {
    label: 'Mark Sheet',
    keywords: [
      'mark sheet', 'marksheet', 'marks', 'semester', 'grade', 'cgpa', 'gpa',
      'sgpa', 'result', 'subject', 'score', 'percentage', 'pass', 'fail',
      'examination result', 'university result', 'academic transcript',
      'transcript', 'aggregate', 'credit', 'total marks',
    ],
    weight: 1.0,
  },
  INTERNSHIP: {
    label: 'Internship',
    keywords: [
      'internship', 'intern', 'internship certificate', 'summer internship',
      'winter internship', 'industrial training', 'industrial attachment',
      'worked as intern', 'duration of internship', 'project trainee',
      'trainee', 'training certificate', 'offered internship',
    ],
    weight: 1.0,
  },
  RESUME: {
    label: 'Resume',
    keywords: [
      'resume', 'curriculum vitae', 'cv', 'work experience', 'experience',
      'skills', 'education', 'objective', 'career objective', 'projects',
      'achievements', 'extracurricular', 'references', 'contact information',
      'professional summary', 'employment history',
    ],
    weight: 1.0,
  },
  ID_DOCUMENT: {
    label: 'ID Document',
    keywords: [
      'identity', 'identification', 'id card', 'aadhar', 'aadhaar', 'pan card',
      'passport', 'voter id', 'driving license', 'government of india',
      'unique identification', 'identity card', 'college id', 'student id',
      'date of birth', 'nationality', 'photo id',
    ],
    weight: 1.0,
  },
  COURSE_COMPLETION: {
    label: 'Course Completion',
    keywords: [
      'course completion', 'completed course', 'course certificate',
      'online course', 'coursera', 'udemy', 'edx', 'nptel', 'swayam',
      'mooc', 'has completed', 'successfully completed the course',
      'learning path', 'program completion', 'workshop',
    ],
    weight: 1.0,
  },
  ACHIEVEMENT: {
    label: 'Achievement',
    keywords: [
      'achievement', 'winner', 'first prize', 'second prize', 'third prize',
      'champion', 'merit', 'distinction', 'honor', 'honour', 'scholarship',
      'best student', 'topper', 'rank', 'competition', 'hackathon',
      'olympiad', 'felicitation',
    ],
    weight: 1.0,
  },
  RECOMMENDATION_LETTER: {
    label: 'Recommendation Letter',
    keywords: [
      'recommendation', 'recommend', 'to whom it may concern', 'letter of recommendation',
      'reference letter', 'i recommend', 'it is my pleasure to recommend',
      'character certificate', 'conduct certificate', 'letter of reference',
      'endorsement',
    ],
    weight: 1.0,
  },
};

/**
 * Score text against a category's keywords.
 * Returns a numeric score.
 */
function scoreCategory(text, categoryKey) {
  const category = CATEGORIES[categoryKey];
  const lowerText = text.toLowerCase();
  let score = 0;

  for (const keyword of category.keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      // Longer, more specific phrases get higher weight
      score += keyword.split(' ').length;
    }
  }

  return score * category.weight;
}

/**
 * Classify extracted text into a document category.
 * Returns { category, confidence, scores }.
 */
function classifyDocument(extractedText) {
  if (!extractedText || extractedText.trim().length < 10) {
    return {
      category: 'OTHER',
      label: 'Other',
      confidence: 0,
      scores: {},
    };
  }

  const scores = {};
  let totalScore = 0;

  for (const key of Object.keys(CATEGORIES)) {
    scores[key] = scoreCategory(extractedText, key);
    totalScore += scores[key];
  }

  // Find best category
  let bestCategory = 'OTHER';
  let bestScore = 0;

  for (const [key, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = key;
    }
  }

  const confidence = totalScore > 0 ? Math.min(bestScore / totalScore, 1.0) : 0;

  // If confidence is too low, fall back to OTHER
  if (confidence < 0.15 || bestScore === 0) {
    return {
      category: 'OTHER',
      label: 'Other',
      confidence: 0,
      scores,
    };
  }

  return {
    category: bestCategory,
    label: CATEGORIES[bestCategory].label,
    confidence: Math.round(confidence * 100) / 100,
    scores,
  };
}

/**
 * Extract metadata from text using regex patterns.
 * Returns { title, issuer, personName, issueDate, expiryDate, keywords, skills }.
 */
function extractMetadata(extractedText) {
  if (!extractedText) return {};

  const text = extractedText;
  const lower = text.toLowerCase();

  // Extract dates (multiple formats)
  const datePatterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g,
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/g,
    /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}[,\s]+\d{4}/gi,
    /\d{1,2}\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[,\s]+\d{4}/gi,
  ];

  const foundDates = [];
  for (const pattern of datePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      foundDates.push(match[0]);
    }
  }

  // Try to identify issue date vs expiry date
  let issueDate = null;
  let expiryDate = null;

  const expiryKeywords = ['expiry', 'expire', 'expires', 'valid until', 'valid till', 'expiration', 'renewal'];
  const issueKeywords = ['issued', 'issue date', 'date of issue', 'awarded on', 'dated', 'completed on'];

  for (const keyword of expiryKeywords) {
    const idx = lower.indexOf(keyword);
    if (idx !== -1) {
      // Look for a date near this keyword
      const surrounding = text.substring(Math.max(0, idx - 20), idx + 100);
      for (const pattern of datePatterns) {
        pattern.lastIndex = 0;
        const match = pattern.exec(surrounding);
        if (match) {
          expiryDate = match[0];
          break;
        }
      }
    }
  }

  if (foundDates.length > 0 && !issueDate) {
    issueDate = foundDates[0];
  }

  // Extract names - look for common patterns
  let personName = null;
  const namePatterns = [
    /(?:certify\s+that|awarded\s+to|presented\s+to|this\s+is\s+to\s+certify\s+that|congratulate)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i,
    /name\s*[:]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i,
    /student\s+name\s*[:]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) {
      personName = match[1].trim();
      break;
    }
  }

  // Extract issuer - look for organization mentions
  let issuer = null;
  const issuerPatterns = [
    /issued\s+by\s+([A-Z][A-Za-z\s&.,]+(?:University|College|Institute|Company|Technologies|Ltd|Inc|Corp|Academy|School|Foundation|Services)?)/i,
    /([A-Z][A-Za-z\s&.]+(?:University|College|Institute|Company|Technologies|Ltd|Inc|Corp|Academy|Foundation))/,
    /from\s+([A-Z][A-Za-z\s&.,]+(?:University|College|Institute|Technologies|Ltd|Inc))/i,
  ];

  for (const pattern of issuerPatterns) {
    const match = text.match(pattern);
    if (match) {
      issuer = match[1].trim().replace(/\s+/g, ' ');
      if (issuer.length > 100) issuer = issuer.substring(0, 100);
      break;
    }
  }

  // Extract keywords (tech skills)
  const techKeywords = [
    'python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue',
    'node', 'nodejs', 'aws', 'azure', 'gcp', 'cloud', 'docker', 'kubernetes',
    'machine learning', 'deep learning', 'artificial intelligence', 'ai', 'ml',
    'data science', 'sql', 'nosql', 'mongodb', 'mysql', 'postgresql',
    'html', 'css', 'git', 'devops', 'agile', 'scrum', 'linux', 'c++', 'c#',
    'flutter', 'android', 'ios', 'swift', 'kotlin', 'rust', 'golang', 'go',
    'tensorflow', 'pytorch', 'scikit', 'pandas', 'numpy', 'excel', 'power bi',
    'tableau', 'networking', 'cybersecurity', 'blockchain', 'rest', 'graphql',
  ];

  const foundKeywords = [];
  for (const kw of techKeywords) {
    if (lower.includes(kw)) {
      foundKeywords.push(kw.charAt(0).toUpperCase() + kw.slice(1));
    }
  }

  // Extract title - first meaningful line is often the title
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5 && l.length < 150);
  let title = null;
  for (const line of lines) {
    if (
      line.length > 5 &&
      !line.match(/^\d/) &&
      !line.match(/^[a-z]/) &&
      !line.match(/^www\./i) &&
      !line.match(/^\+?\d/)
    ) {
      title = line.replace(/[^a-zA-Z0-9\s,.\-()]/g, '').trim();
      if (title.length > 5 && title.length < 120) break;
      title = null;
    }
  }

  return {
    title: title || null,
    issuer: issuer || null,
    personName: personName || null,
    issueDate: issueDate || null,
    expiryDate: expiryDate || null,
    keywords: foundKeywords.slice(0, 15),
    skills: foundKeywords.slice(0, 10),
  };
}

module.exports = { classifyDocument, extractMetadata, CATEGORIES };
