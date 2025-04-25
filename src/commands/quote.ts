import { Context } from 'telegraf';
import fetch from 'node-fetch';

interface Quote {
  quoteText: string;
  quoteAuthor: string;
}

export const quote = () => async (ctx: Context) => {
  try {
    // Ensure chat exists and has an id
    const chatId = ctx.chat?.id;
    if (!chatId) {
      console.error('Chat ID is missing!');
      return ctx.reply('❌ Failed to fetch chat ID.');
    }

    // Fetch quotes from the external JSON file
    const res = await fetch('https://raw.githubusercontent.com/itzfew/Eduhub-Bot/master/quotes.json');
    if (!res.ok) {
      throw new Error(`Failed to fetch quotes: ${res.statusText}`);
    }

    const quotes: Quote[] = await res.json();

    // Handle case where no quotes are found
    if (!quotes || quotes.length === 0) {
      return ctx.reply('❌ No quotes found.');
    }

    // Randomly pick a quote from the list
    const random = quotes[Math.floor(Math.random() * quotes.length)];
    const message = `_"${random.quoteText}"_\n\n— *${random.quoteAuthor || 'Unknown'}*`;

    // Prepare the share button URL
    const shareButton = {
      text: 'Share this Quote',
      url: `https://t.me/share/url?url=${encodeURIComponent(message)}&text=Check%20out%20this%20quote%20from%20@EduhubKMR_bot`
    };

    // Send the message with the share button
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
    
    // Send an error message if the fetch fails
    const chatId = ctx.chat?.id;
    if (chatId) {
      await ctx.telegram.sendMessage(chatId, '⚠️ Failed to fetch quote. Try again later.');
    }
  }
};
