import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:quizes');

const quizes = () => async (ctx: Context) => {
  debug('Triggered "quizes" handler');

  if (!ctx.message || !('text' in ctx.message)) return;

  const text = ctx.message.text.trim().toLowerCase();

  // Match commands like: /pyqb 3, /pyqc 2, /pyqp 5, /pyq 1, etc.
  const match = text.match(/^\/pyq(b|c|p)?\s*([0-9]+)?$/i);
  if (!match) return;

  const subject = match[1]; // 'b' for biology, 'c' for chemistry, 'p' for physics
  const countOrIndex = match[2] ? parseInt(match[2], 10) : 1;

  // Map subjects to full names
  const subjectMap: Record<string, string> = {
    b: 'biology',
    p: 'physics',
    c: 'chemistry',
  };

  let selectedSubject = '';
  if (subject) {
    selectedSubject = subjectMap[subject];
  } else {
    selectedSubject = 'random'; // If no subject, send from random
  }

  try {
    const response = await fetch('https://raw.githubusercontent.com/itzfew/Eduhub-KMR/master/quiz.json');
    const allQuestions = await response.json();

    let subjectQuestions = [];
    if (selectedSubject === 'random') {
      // Random subject: get random questions from all subjects
      subjectQuestions = allQuestions.sort(() => 0.5 - Math.random());
    } else {
      // Filter questions based on the selected subject
      subjectQuestions = allQuestions.filter((q: any) => q.subject?.toLowerCase() === selectedSubject);
    }

    if (!subjectQuestions.length) {
      await ctx.reply(`No ${selectedSubject} questions available yet.`);
      return;
    }

    // Shuffle and pick a random number of questions
    const shuffled = subjectQuestions.sort(() => 0.5 - Math.random());
    const questionsToSend = shuffled.slice(0, Math.min(countOrIndex, subjectQuestions.length));

    for (const question of questionsToSend) {
      const options = [
        question.options.A,
        question.options.B,
        question.options.C,
        question.options.D,
      ];
      const correctOptionIndex = ['A', 'B', 'C', 'D'].indexOf(question.correct_option);

      await ctx.sendPoll(question.question, options, {
        type: 'quiz',
        correct_option_id: correctOptionIndex,
        is_anonymous: false,
        explanation: question.explanation || 'No explanation provided.',
      } as any);
    }

  } catch (err) {
    debug('Error fetching questions:', err);
    await ctx.reply('Oops! Failed to load questions.');
  }
};

export { quizes };
