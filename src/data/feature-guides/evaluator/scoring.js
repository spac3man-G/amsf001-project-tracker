// Scoring Feature Guide
// Complete how-to documentation for vendor scoring in evaluations

const scoringGuide = {
  id: 'scoring',
  title: 'Evaluation Scoring',
  category: 'evaluator',
  description: 'Score vendors against evaluation requirements. Enter individual scores, add evidence and justification, participate in consensus scoring, and compare vendor performance across categories.',
  
  navigation: {
    path: '/evaluator/:id/scoring',
    sidebar: 'Evaluator → [Evaluation] → Scoring',
    quickAccess: 'Evaluation Dashboard → "Score Vendors" button',
    breadcrumb: 'Home > Evaluator > [Evaluation Name] > Scoring'
  },
  
  howTo: {
    score: {
      title: 'Scoring Vendors Against Requirements',
      steps: [
        'Navigate to the Scoring page for your evaluation',
        'Select the vendor you want to score',
        'Select the category to score (or score all)',
        'For each requirement, click the score cell',
        'Select the score (0-5 or as configured)',
        'Add evidence or justification for your score',
        'Click Save or Tab to the next requirement',
        'Progress indicator shows your completion',
        'Repeat for all requirements and vendors'
      ],
      tips: [
        'Review vendor responses before scoring',
        'Be consistent across vendors',
        'Document reasoning for low or high scores',
        'Take breaks to maintain scoring quality'
      ]
    },
    scoreInterpretation: {
      title: 'Understanding Score Levels',
      steps: [
        'Review the scoring scale before starting',
        'Each score level has a defined meaning',
        'Refer to requirement acceptance criteria',
        'Consider vendor response completeness',
        'Use consistent interpretation across vendors'
      ],
      scoreScale: [
        { score: 0, label: 'Not Met', guidance: 'Requirement not addressed. No evidence of capability.' },
        { score: 1, label: 'Minimally Met', guidance: 'Major gaps. Significant concerns or limitations.' },
        { score: 2, label: 'Partially Met', guidance: 'Some evidence but notable gaps remain.' },
        { score: 3, label: 'Adequately Met', guidance: 'Meets requirement with minor gaps or concerns.' },
        { score: 4, label: 'Fully Met', guidance: 'Completely meets requirement as specified.' },
        { score: 5, label: 'Exceeds', guidance: 'Exceeds requirement with additional value or innovation.' }
      ],
      tips: [
        'Score 3 is "acceptable" - meets the need',
        'Reserve 5 for genuine differentiation',
        'Use 0 only when completely unmet',
        'Half-points available if enabled'
      ]
    },
    addEvidence: {
      title: 'Adding Evidence to Scores',
      steps: [
        'After selecting a score, click "Add Evidence"',
        'Enter text notes explaining your score',
        'Reference specific vendor response sections',
        'Attach screenshots or documents if helpful',
        'Add links to demo recordings or documents',
        'Save the evidence with the score',
        'Evidence is visible in reports and consensus discussions'
      ],
      evidenceTypes: [
        { type: 'Text Notes', description: 'Written justification for the score' },
        { type: 'Vendor Response Reference', description: 'Quote or reference to vendor response' },
        { type: 'Demo Observation', description: 'Notes from vendor demonstration' },
        { type: 'Attachment', description: 'Screenshot, document, or other file' },
        { type: 'External Link', description: 'Link to documentation or recording' }
      ],
      tips: [
        'Evidence helps justify decisions to stakeholders',
        'Required for scores of 0-1 or 5',
        'Good evidence improves consensus discussions',
        'Others can see your evidence if shared'
      ]
    },
    consensus: {
      title: 'Participating in Consensus Scoring',
      steps: [
        'Consensus scoring is scheduled as a workshop',
        'Join the consensus meeting (in-person or virtual)',
        'The facilitator shares the scoring screen',
        'Individual scores are shown anonymously',
        'Team discusses requirements with score variance',
        'Facilitator guides discussion toward consensus',
        'Agreed consensus score is recorded',
        'Evidence and rationale are documented',
        'Consensus score becomes the official score'
      ],
      consensusProcess: [
        { step: 1, action: 'Show individual score distribution' },
        { step: 2, action: 'Identify requirements with high variance' },
        { step: 3, action: 'Discuss perspectives and evidence' },
        { step: 4, action: 'Agree on consensus score' },
        { step: 5, action: 'Document rationale' }
      ],
      tips: [
        'Complete individual scoring before consensus',
        'Be prepared to explain your scores',
        'Focus on evidence, not personalities',
        'Consensus doesn\'t mean everyone agrees - it\'s the group decision'
      ]
    },
    compare: {
      title: 'Comparing Vendor Scores',
      steps: [
        'From Scoring page, click "Compare" tab',
        'Select vendors to compare (up to 4 recommended)',
        'View comparison by: Overall, Category, or Requirement',
        'Scores shown side-by-side with visual indicators',
        'Identify leading vendors and close calls',
        'Drill down into specific categories',
        'Export comparison for reports'
      ],
      comparisonViews: [
        { view: 'Overall Comparison', description: 'Total weighted scores across all categories' },
        { view: 'Category Comparison', description: 'Scores broken down by category' },
        { view: 'Requirement Detail', description: 'Individual requirement scores' },
        { view: 'Radar Chart', description: 'Visual representation of category scores' },
        { view: 'Gap Analysis', description: 'Differences between top vendors' }
      ],
      tips: [
        'Focus on meaningful differences, not small margins',
        'Consider Must Have requirements separately',
        'Use comparison in decision discussions',
        'Close scores may need additional evaluation'
      ]
    },
    view: {
      title: 'Viewing Scoring Progress and Results',
      steps: [
        'Navigate to the Scoring page',
        'Dashboard shows scoring completion status',
        'View by: My Scores, All Evaluators, Consensus',
        'Filter by category or vendor',
        'Progress bars show completion percentage',
        'Click on any cell to see details'
      ],
      scoringViews: [
        { view: 'My Scoring', description: 'Your individual scores only' },
        { view: 'Team Progress', description: 'All evaluator completion status' },
        { view: 'Scores Matrix', description: 'Grid of all requirements × vendors' },
        { view: 'Results Summary', description: 'Calculated totals and rankings' }
      ],
      tips: [
        'Check team progress before scheduling consensus',
        'Results Summary shows preliminary rankings',
        'Final results available after all scoring complete'
      ]
    },
    editScores: {
      title: 'Editing Your Scores',
      steps: [
        'Navigate to the requirement/vendor you want to edit',
        'Click the existing score cell',
        'Change the score value',
        'Update or add evidence',
        'Save the changes',
        'Edit history is tracked for audit'
      ],
      tips: [
        'You can edit individual scores until evaluation is finalized',
        'Consensus scores require facilitator access to change',
        'Major changes should be documented with reason',
        'Consider informing team of significant changes'
      ]
    }
  },
  
  fields: {
    score: {
      name: 'Score',
      label: 'Score',
      required: true,
      type: 'number',
      description: 'The score assigned to this requirement for this vendor',
      validation: 'Must be within configured scale (e.g., 0-5)',
      tips: 'Refer to scoring guidance for each level'
    },
    evidence: {
      name: 'Evidence',
      label: 'Evidence/Justification',
      required: 'For scores 0-1 and 5',
      type: 'textarea',
      description: 'Supporting evidence or reasoning for the score',
      validation: 'Required for extreme scores. Maximum 5000 characters.',
      tips: 'Document why, not just what'
    },
    confidence: {
      name: 'Confidence',
      label: 'Confidence Level',
      required: false,
      type: 'select',
      description: 'How confident you are in this score',
      values: ['High', 'Medium', 'Low'],
      tips: 'Low confidence items may need more investigation'
    },
    notes: {
      name: 'Notes',
      label: 'Notes',
      required: false,
      type: 'textarea',
      description: 'Additional notes or comments',
      validation: 'Maximum 2000 characters.',
      tips: 'Private notes for your reference'
    },
    attachments: {
      name: 'Attachments',
      label: 'Attachments',
      required: false,
      type: 'file',
      description: 'Supporting documents or screenshots',
      tips: 'Attach evidence to support your score'
    }
  },
  
  calculations: {
    title: 'Score Calculations',
    description: 'How final scores are calculated depends on the configured scoring method.',
    methods: [
      {
        method: 'Simple Average',
        formula: 'Total Score = Sum of all scores ÷ Number of requirements',
        example: 'If 50 requirements scored, sum scores and divide by 50',
        notes: 'All requirements have equal weight'
      },
      {
        method: 'Category Weighted',
        formula: 'Total = Σ (Category Average × Category Weight %)',
        example: 'Functional (40%) = 3.5 avg → 1.4 weighted contribution',
        notes: 'Category weights defined in evaluation settings'
      },
      {
        method: 'Requirement Weighted',
        formula: 'Category Score = Σ (Req Score × Req Weight) ÷ Σ Req Weights',
        example: 'Requirement with weight 3 counts 3× more than weight 1',
        notes: 'Combined with category weights for final score'
      },
      {
        method: 'MoSCoW Weighted',
        formula: 'Applied multiplier: Must=4, Should=2, Could=1, Won\'t=0',
        example: 'Must Have requirements count 4× more than Could Have',
        notes: 'Automatically applied based on requirement priority'
      },
      {
        method: 'Multi-Stakeholder',
        formula: 'Total = Σ (Stakeholder Area Score × Area Weight %)',
        example: 'Business (50%) + IT (30%) + Finance (20%)',
        notes: 'Each stakeholder area has independent scoring'
      }
    ],
    normalisation: {
      description: 'Scores are normalised to percentage for easy comparison',
      formula: 'Percentage = (Score ÷ Max Score) × 100',
      example: 'Score 3.5 out of 5 = 70%'
    }
  },
  
  scoringGuidelines: {
    title: 'Scoring Best Practices',
    guidelines: [
      {
        guideline: 'Review Before Scoring',
        description: 'Read vendor response completely before assigning score',
        tips: ['Review response text', 'Check attachments', 'Consider demo observations']
      },
      {
        guideline: 'Be Consistent',
        description: 'Apply same standards across all vendors',
        tips: ['Score same requirement for all vendors together', 'Use acceptance criteria consistently']
      },
      {
        guideline: 'Document Evidence',
        description: 'Justify your scores with specific references',
        tips: ['Quote vendor responses', 'Reference demo observations', 'Note gaps or concerns']
      },
      {
        guideline: 'Avoid Bias',
        description: 'Base scores on facts, not preferences or relationships',
        tips: ['Focus on requirement fit', 'Ignore brand reputation unless relevant', 'Consider all evidence']
      },
      {
        guideline: 'Use Full Scale',
        description: 'Don\'t cluster all scores in the middle',
        tips: ['5 = genuinely exceptional', '0 = genuinely not met', 'Differentiate between vendors']
      }
    ]
  },
  
  permissions: {
    evaluation_admin: {
      role: 'Evaluation Admin',
      canScore: true,
      canViewOthersScores: true,
      canEditOthersScores: false,
      canManageConsensus: true,
      canViewResults: true,
      notes: 'Full access to scoring process and results'
    },
    evaluator: {
      role: 'Evaluator',
      canScore: true,
      canViewOthersScores: 'After consensus only',
      canEditOthersScores: false,
      canManageConsensus: false,
      canViewResults: 'Own scores and final results',
      notes: 'Can score assigned vendors and requirements'
    },
    reviewer: {
      role: 'Reviewer',
      canScore: false,
      canViewOthersScores: true,
      canEditOthersScores: false,
      canManageConsensus: false,
      canViewResults: true,
      notes: 'View all scores but cannot contribute'
    },
    observer: {
      role: 'Observer',
      canScore: false,
      canViewOthersScores: false,
      canEditOthersScores: false,
      canManageConsensus: false,
      canViewResults: 'Summary only',
      notes: 'See high-level results only'
    }
  },
  
  faq: [
    {
      question: 'How is my score weighted in the final result?',
      answer: 'In individual scoring, your score is averaged with other evaluators for each requirement. In multi-stakeholder scoring, scores are weighted by stakeholder area. In consensus scoring, only the agreed consensus score counts.'
    },
    {
      question: 'Can I see how others scored?',
      answer: 'During individual scoring, other scores are hidden to prevent bias. After consensus or when results are finalized, you can see aggregated scores. Specific evaluator identities may be hidden depending on settings.'
    },
    {
      question: 'What if I don\'t know enough to score a requirement?',
      answer: 'You can skip requirements and return later. Mark them as "Low Confidence" if you\'re unsure. Consider requesting more information from the vendor through Q&A.'
    },
    {
      question: 'How do I handle a vendor that didn\'t respond to a requirement?',
      answer: 'Score based on available information. If no information is available, consider scoring 0-1 with evidence noting "No response provided". Document that the vendor failed to address the requirement.'
    },
    {
      question: 'Can I change my score after consensus?',
      answer: 'Consensus scores are the official record and typically cannot be changed individually. If you believe a consensus score is incorrect, raise it with the evaluation admin for discussion.'
    },
    {
      question: 'What\'s the difference between evidence and notes?',
      answer: 'Evidence is the formal justification for your score - it\'s visible to others and included in reports. Notes are personal reminders that only you can see.'
    },
    {
      question: 'How are ties handled in rankings?',
      answer: 'Ties are shown as equal rank. Consider Must Have scores or specific categories as tiebreakers. The final decision may require additional evaluation or discussion.'
    },
    {
      question: 'Why can\'t I score certain requirements?',
      answer: 'You may only have access to score requirements in your assigned stakeholder area, or requirements may not yet be finalized for scoring. Check with the evaluation admin.'
    },
    {
      question: 'What happens to my scores if I leave the evaluation?',
      answer: 'Your scores are preserved as part of the evaluation record. The admin may need to reassign scoring coverage or adjust averages.'
    },
    {
      question: 'How do half-points work?',
      answer: 'If enabled, you can score 0, 0.5, 1, 1.5, etc. This allows finer differentiation. Half-points are particularly useful for requirements where the vendor partially meets criteria.'
    }
  ],
  
  related: ['evaluation-setup', 'requirements', 'vendors', 'workshops', 'evaluator-reports']
};

export default scoringGuide;
