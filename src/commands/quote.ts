import { Context } from 'telegraf';
import fetch from 'node-fetch';

interface Quote {
  quoteText: string;
  quoteAuthor: string;
}

export const quote = () => async (ctx: Context) => {
  try {
    const res = await fetch('https://raw.githubusercontent.com/itzfew/Eduhub-KMR/master/quotes.json');
    const quotes: Quote[] = await res.json();

    if (!quotes || quotes.length === 0) {
      return ctx.reply('❌ No quotes found.');
    }

    const random = quotes[Math.floor(Math.random() * quotes.length)];
    const quoteText = `"${random.quoteText}"\n\n— ${random.quoteAuthor || 'Unknown'}`;
    const formattedMessage = `_"${random.quoteText}"_\n\n— *${random.quoteAuthor || 'Unknown'}*`;

    const chatId = ctx.chat?.id;
    if (!chatId) return;

    await ctx.telegram.sendMessage(chatId, formattedMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🔗 Share this quote',
              switch_inline_query: quoteText,
            }
          ]
        ]
      }
    });
  } catch (err) {
    console.error('Failed to fetch quote:', err);
    const chatId = ctx.chat?.id;
    if (chatId) {
      await ctx.telegram.sendMessage(chatId, '⚠️ Failed to fetch quote. Try again later.');
    }
  }
};
