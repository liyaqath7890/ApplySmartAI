class InterviewPreparationEngine {
  generateInterviewPrep(jobTitle, techStack) {
    const prep = {
      questions: {
        react: [],
        javascript: [],
        nodejs: [],
        manualTesting: [],
        hr: [],
        behavioral: []
      },
      suggestedAnswers: {}
    };

    prep.questions.react = [
      'Explain React hooks and useState.',
      'What is the virtual DOM?',
      'Describe component lifecycle methods.'
    ];

    prep.questions.javascript = [
      'Explain closures in JavaScript.',
      'What is the difference between let, const, and var?',
      'Describe event delegation.'
    ];

    prep.questions.nodejs = [
      'What is Node.js?',
      'Explain event loop.',
      'What are streams in Node.js?'
    ];

    prep.questions.manualTesting = [
      'What is SDLC?',
      'Explain different types of testing.',
      'How do you write a test case?'
    ];

    prep.questions.hr = [
      'Tell me about yourself.',
      'Where do you see yourself in 5 years?',
      'Why should we hire you?'
    ];

    prep.questions.behavioral = [
      'Describe a challenging project you worked on.',
      'Tell me about a time you worked in a team.',
      'How do you handle tight deadlines?'
    ];

    return prep;
  }
}

export default new InterviewPreparationEngine();
