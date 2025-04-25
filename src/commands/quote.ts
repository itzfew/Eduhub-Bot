import { Context } from 'telegraf';
import fetch from 'node-fetch';

interface Quote {
  quoteText: string;
  quoteAuthor: string;
}

export const quote = () => async (ctx: Context) => {
  try {
    const chatId = ctx.chat?.id;
    if (!chatId) {
      console.error('Chat ID is missing!');
      return ctx.reply('❌ Failed to fetch chat ID.');
    }

    const res = await fetch('https://raw.githubusercontent.com/itzfew/Eduhub-KMR/master/quotes.json');
    if (!res.ok) {
      throw new Error(`Failed to fetch quotes: ${res.statusText}`);
    }

    const quotes: Quote[] = await res.json();

    if (!quotes || quotes.length === 0) {
      return ctx.reply('❌ No quotes found.');
    }

    const random = quotes[Math.floor(Math.random() * quotes.length)];
    const message = `_"${random.quoteText}"_\n\n— *${random.quoteAuthor || 'Unknown'}*`;

    const shareButton = {
      text: 'Share this Quote',
      url: `https://t.me/share/url?url=${encodeURIComponent(message)}&text=Check%20out%20this%20quote%20from%20@EduhubKMR_bot`
    };

    // Check if the message has already been sent to prevent multiple responses
    if (ctx.replySent) return;

    // Mark reply as sent to prevent it from sending more than once
    ctx.replySent = true;

    await ctx.telegram.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: shareButton.text, url: shareButton.url }],
        ],
      },
    });
  } catch (err) {
    console.error('Failed to fetch quote:', err);

    const chatId = ctx.chat?.id;
    if (chatId && !ctx.replySent) {
      ctx.replySent = true;
      await ctx.telegram.sendMessage(chatId, '⚠️ Failed to fetch quote. Try again later.');
    }
  }
};
