import type { Library, Resource } from './model.ts';

// Starter links are editable resources, not claimed learning history. Practice starts empty.
const starters: Pick<Resource, 'id' | 'title' | 'creator' | 'format' | 'subject' | 'url' | 'description'>[] = [
  {
    id: 'linear-algebra', title: 'Essence of linear algebra', creator: '3Blue1Brown', format: 'Playlist', subject: 'Mathematics',
    url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr',
    description: 'A visual introduction to vectors, linear transformations, matrices, and eigenvalues.',
  },
  {
    id: 'cs50', title: 'CS50: Introduction to Computer Science', creator: 'Harvard University · David J. Malan', format: 'Course', subject: 'Computer science',
    url: 'https://cs50.harvard.edu/x/',
    description: 'An introduction to computer science, from algorithms and memory to Python and the web.',
  },
  {
    id: 'think-python', title: 'Think Python', creator: 'Allen B. Downey · 3rd edition', format: 'Book', subject: 'Computer science',
    url: 'https://allendowney.github.io/ThinkPython/',
    description: 'Learn to program in Python with explanations, examples, and exercises.',
  },
  {
    id: 'calculus', title: 'Calculus, Volume 1', creator: 'OpenStax', format: 'Textbook', subject: 'Mathematics',
    url: 'https://openstax.org/details/books/calculus-volume-1',
    description: 'Functions, limits, derivatives, and integration, with worked examples and exercises.',
  },
  {
    id: 'elements-of-style', title: 'The Elements of Style', creator: 'William Strunk Jr.', format: 'Book', subject: 'Writing',
    url: 'https://www.gutenberg.org/ebooks/37134',
    description: 'A compact guide to English usage and clear composition. The original edition is available through Project Gutenberg.',
  },
  {
    id: 'mit-calculus', title: 'Single Variable Calculus', creator: 'MIT OpenCourseWare · 18.01SC', format: 'Course', subject: 'Mathematics',
    url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/',
    description: 'A self-study calculus course with lectures, problems, and exams.',
  },
  {
    id: 'biology', title: 'Biology 2e', creator: 'OpenStax', format: 'Textbook', subject: 'Biology',
    url: 'https://openstax.org/details/books/biology-2e',
    description: 'A biology textbook covering cells, genetics, evolution, and ecology.',
  },
  {
    id: 'learning-how-to-learn', title: 'Learning How to Learn', creator: 'Barbara Oakley & Terrence Sejnowski', format: 'Course', subject: 'Learning',
    url: 'https://www.coursera.org/learn/learning-how-to-learn',
    description: 'Explore how attention, memory, and practice shape the way you learn.',
  },
];

export function starterLibrary(): Library {
  const now = new Date().toISOString();
  return {
    version: 1,
    resources: starters.map(resource => ({ ...resource, notes: '', status: 'planned', progress: 0, createdAt: now, updatedAt: now })),
    practice: [],
  };
}
