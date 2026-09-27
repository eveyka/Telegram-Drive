import type { Env } from './types';
import { upsertBotSubscriber } from './db';

export interface TelegramSendMessageOptions {
  parse_mode?: 'Markdown' | 'HTML';
  reply_markup?: {
    inline_keyboard?: Array<Array<{ text: string; url?: string; callback_data?: string }>>;
  };
}

// Sends a message to a specific Telegram chat/user using Bot API
export async function sendTelegramMessage(
  botToken: string,
  chatId: string | number,
  text: string,
  options?: TelegramSendMessageOptions
): Promise<{ ok: boolean; description?: string }> {
  if (!botToken) {
    return { ok: false, description: 'Bot token not configured' };
  }

  try {
    const payload: Record<string, unknown> = {
      chat_id: String(chatId).trim(),
      text,
      parse_mode: options?.parse_mode || 'Markdown',
      disable_web_page_preview: false,
    };

    if (options?.reply_markup) {
      payload.reply_markup = options.reply_markup;
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { ok: boolean; description?: string };
    return data;
  } catch (err) {
    return {
      ok: false,
      description: err instanceof Error ? err.message : 'Failed to send Telegram message',
    };
  }
}

// Sends an instant Pro Welcome / Confirmation receipt message to the buyer on Telegram
export async function sendProWelcomeMessage(
  botToken: string,
  chatIdOrUserId: string | number,
  customerName?: string | null,
  planType: string = 'Lifetime Pro'
): Promise<{ ok: boolean; description?: string }> {
  const name = customerName || 'Friend';
  const text = `🎉 *Congratulations ${name}! Your TG Drive PRO is ACTIVE!* 💎\n\n` +
    `✨ *Plan:* ${planType.toUpperCase()}\n` +
    `⚡ *Status:* Active & Linked to your Telegram Account\n\n` +
    `*Your Unlocked Benefits:*\n` +
    `• 🚫 *100% Ad-Free Experience*\n` +
    `• 🚀 *Unlimited High-Speed Sync & Transfers*\n` +
    `• 📱 *Auto-Sync Across All Devices* (Windows, Mac, Android, iOS, Web)\n` +
    `• 🛡️ *Priority Cloud Bandwidth*\n\n` +
    `Thank you for supporting TG Drive! Simply open the app and enjoy your Pro benefits automatically. ❤️`;

  return await sendTelegramMessage(botToken, chatIdOrUserId, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🚀 Open TG Drive App', url: 'https://tg-drive.vercel.app' },
          { text: '💬 Support & Community', url: 'https://t.me/TG_Drive_Support' },
        ],
      ],
    },
  });
}

// Handles incoming Telegram Bot updates (e.g. from Webhook: /start, /help, /plans)
export async function handleTelegramBotUpdate(
  update: any,
  env: Env
): Promise<Response> {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return new Response(JSON.stringify({ ok: false, error: 'Bot token missing' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const message = update?.message;
  if (!message || !message.chat) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const chatId = message.chat.id;
  const fromUser = message.from;
  const text = (message.text || '').trim();

  // Automatically record subscriber in DB
  if (fromUser?.id) {
    try {
      await upsertBotSubscriber(env.DB, {
        telegram_user_id: String(fromUser.id),
        chat_id: String(chatId),
        username: fromUser.username || null,
        first_name: fromUser.first_name || null,
      });
    } catch (e) {
      console.error('Error saving bot subscriber:', e);
    }
  }

  // Command handlers
  if (text.startsWith('/start')) {
    const welcomeText =
      `👋 *Welcome to TG Drive Official Bot!* ☁️\n\n` +
      `TG Drive gives you **Unlimited Cloud Storage** powered by Telegram.\n\n` +
      `🔹 *Features:*\n` +
      `• Store unlimited files, videos, documents safely\n` +
      `• Super-fast download & streaming speed\n` +
      `• Instant access from Desktop, Mobile & Web\n` +
      `• Upgrade to *PRO* for 100% Ad-Free unlimited experience\n\n` +
      `Use the buttons below to download the app or explore Pro plans!`;

    await sendTelegramMessage(botToken, chatId, welcomeText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📥 Download App', url: 'https://github.com/eveyka/Telegram-Drive-Public/releases' },
            { text: '💎 Upgrade to PRO', url: 'https://tg-drive.vercel.app/pricing' },
          ],
          [
            { text: '📖 How to Use / Guide', callback_data: 'help_guide' },
            { text: '💬 Support Group', url: 'https://t.me/TG_Drive_Support' },
          ],
        ],
      },
    });
  } else if (text.startsWith('/help') || text.startsWith('/guide')) {
    const helpText =
      `📖 *TG Drive - Quick User Guide:*\n\n` +
      `1️⃣ *Log In:* Open the TG Drive app and sign in with your Telegram account.\n` +
      `2️⃣ *Upload:* Drag & drop any files, photos, or movies to backup securely.\n` +
      `3️⃣ *Streaming:* Stream videos directly without downloading full files!\n` +
      `4️⃣ *Pro Upgrade:* Go to Settings $\\rightarrow$ Upgrade to Pro to remove all ads and get priority speed!`;

    await sendTelegramMessage(botToken, chatId, helpText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Launch Web App', url: 'https://tg-drive.vercel.app' }],
        ],
      },
    });
  } else if (text.startsWith('/pro') || text.startsWith('/plans')) {
    const proText =
      `💎 *TG Drive PRO Plans:*\n\n` +
      `🌟 *Lifetime Pro:* ₹399 (One-time payment, Forever access)\n` +
      `• No Ads ever\n` +
      `• Unlimited devices (Auto-sync with your Telegram ID)\n` +
      `• High-Speed Multi-Threaded Downloads\n\n` +
      `👉 Open the TG Drive app on your device to purchase securely via UPI, GPay, PhonePe, or Card!`;

    await sendTelegramMessage(botToken, chatId, proText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💎 Upgrade to Pro in App', url: 'https://tg-drive.vercel.app' }],
        ],
      },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
