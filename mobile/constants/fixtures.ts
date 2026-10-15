/**
 * DEV-ONLY FIXTURE DATA — never shipped behavior.
 *
 * These are used exclusively by data/content.ts as a fallback when
 * USE_FIXTURES=1 (see constants/config.ts) AND a real network request to
 * the live backend fails. They let UI work be verified while the backend
 * (built in parallel, in a separate folder) isn't reachable yet. The real
 * API call always happens first — this is never a substitute for it.
 */
import {
  Category,
  InterviewQuestion,
  Language,
  Lesson,
  TopicDetail,
  TopicSummary,
} from '../types/models';

export const FIXTURE_LANGUAGES: Language[] = [
  {
    id: 'lang-js',
    code: 'javascript',
    name: 'JavaScript',
    description: 'The language of the web.',
    iconName: 'logo-javascript',
    sortOrder: 1,
  },
  {
    id: 'lang-cs',
    code: 'csharp',
    name: 'C#',
    description: 'Modern, object-oriented, type-safe.',
    iconName: 'code-slash',
    sortOrder: 2,
  },
  {
    id: 'lang-py',
    code: 'python',
    name: 'Python',
    description: 'Readable and versatile.',
    iconName: 'logo-python',
    sortOrder: 3,
  },
];

export const FIXTURE_CATEGORIES: Record<string, Category[]> = {
  javascript: [
    { id: 'cat-js-basics', name: 'Basics', slug: 'basics', sortOrder: 1 },
    { id: 'cat-js-async', name: 'Asynchronous JS', slug: 'async', sortOrder: 2 },
  ],
  csharp: [{ id: 'cat-cs-basics', name: 'Fundamentals', slug: 'fundamentals', sortOrder: 1 }],
  python: [{ id: 'cat-py-basics', name: 'Getting Started', slug: 'getting-started', sortOrder: 1 }],
};

export const FIXTURE_TOPICS: Record<string, TopicSummary[]> = {
  'cat-js-basics': [
    {
      id: 'topic-js-vars',
      title: 'Variables & Data Types',
      slug: 'variables-data-types',
      summary: 'let, const, var and the primitive types.',
      difficulty: 'Beginner',
      sortOrder: 1,
    },
    {
      id: 'topic-js-functions',
      title: 'Functions',
      slug: 'functions',
      summary: 'Declarations, expressions, arrow functions and closures.',
      difficulty: 'Intermediate',
      sortOrder: 2,
    },
  ],
  'cat-js-async': [
    {
      id: 'topic-js-promises',
      title: 'Promises & async/await',
      slug: 'promises-async-await',
      summary: 'Handling asynchronous operations cleanly.',
      difficulty: 'Advanced',
      sortOrder: 1,
    },
  ],
  'cat-cs-basics': [
    {
      id: 'topic-cs-types',
      title: 'Types & Variables',
      slug: 'types-variables',
      summary: 'Value types, reference types, and var.',
      difficulty: 'Beginner',
      sortOrder: 1,
    },
  ],
  'cat-py-basics': [
    {
      id: 'topic-py-syntax',
      title: 'Python Syntax Basics',
      slug: 'syntax-basics',
      summary: 'Indentation, variables, and basic I/O.',
      difficulty: 'Beginner',
      sortOrder: 1,
    },
  ],
};

export const FIXTURE_TOPIC_DETAILS: Record<string, TopicDetail> = {
  'topic-js-vars': {
    id: 'topic-js-vars',
    title: 'Variables & Data Types',
    summary: 'let, const, var and the primitive types.',
    difficulty: 'Beginner',
    lessons: [
      { id: 'lesson-js-vars-1', title: 'Declaring Variables', slug: 'declaring-variables', sortOrder: 1 },
      { id: 'lesson-js-vars-2', title: 'Primitive Types', slug: 'primitive-types', sortOrder: 2 },
    ],
    relatedTopics: [{ id: 'topic-js-functions', title: 'Functions' }],
  },
};

export const FIXTURE_LESSONS: Record<string, Lesson> = {
  'lesson-js-vars-1': {
    id: 'lesson-js-vars-1',
    title: 'Declaring Variables',
    contentMarkdown:
      '# Declaring Variables\n\nJavaScript has three ways to declare variables: `var`, `let`, and `const`.\n\n```javascript\nlet count = 1;\nconst name = "CodeAtlas";\nvar legacy = true;\n```\n\nPrefer `const` by default, and `let` when you need to reassign.',
    topicId: 'topic-js-vars',
    prevLessonId: null,
    nextLessonId: 'lesson-js-vars-2',
    codeExamples: [
      {
        id: 'ex-1',
        description: 'Basic declaration',
        code: 'const greeting = "Hello, CodeAtlas!";\nconsole.log(greeting);',
        expectedOutput: 'Hello, CodeAtlas!',
      },
    ],
  },
};

export const FIXTURE_INTERVIEW_QUESTIONS: Record<string, InterviewQuestion[]> = {
  'topic-js-vars': [
    {
      id: 'iq-js-1',
      difficulty: 'Beginner',
      question: 'What is the difference between let and var?',
      answer:
        '`let` is block-scoped and not hoisted in a usable way, while `var` is function-scoped and hoisted with an initial value of `undefined`.',
      scenario: 'A loop variable captured incorrectly inside a setTimeout callback.',
      commonMistakes: 'Using var inside loops expecting a new binding per iteration.',
      followUps: 'What about const? What is the temporal dead zone?',
    },
  ],
};
