import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:quizes');

const quizes = () => async (ctx: Context) => {
  debug('Triggered "quizes" handler');

  if (!ctx.message || !('text' in ctx.message)) return;

  const text = ctx.message.text.trim().toLowerCase();
  const match = text.match(/^\/pyq([bpc])(?:\s+(\d+))?$/);

  if (!match) return;

  const subjectKey = match[1]; // b, p, or c
  const count = match[2] ? parseInt(match[2], 10) : 1;

  const subjectMap: Record<string, string> = {
    b: 'biology',
    p: 'physics',
    c: 'chemistry'
  };

  const subject = subjectMap[subjectKey];

  try {
    const response = await fetch('https://raw.githubusercontent.com/itzfew/Eduhub-KMR/master/quiz.json');
    const allQuestions = await response.json();

    const subjectQuestions = allQuestions.filter((q: any) => q.subject?.toLowerCase() === subject);

    if (!subjectQuestions.length) {
      await ctx.reply(`No ${subject} questions available yet.`);
      return;
    }

    const shuffled = subjectQuestions.sort(() => 0.5 - Math.random());
    const questionsToSend = shuffled.slice(0, Math.min(count, subjectQuestions.length));

    for (const question of questionsToSend) {
      const options = [
        question.options.A,
        question.options.B,
        question.options.C,
        question.options.D,
      ];
      const correctOptionIndex = ['A', 'B', 'C', 'D'].indexOf(question.correct_option);

      if (question.image) {
        await ctx.replyWithPhoto({ url: question.image });
      }

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
