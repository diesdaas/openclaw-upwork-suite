import TelegramBot from "node-telegram-bot-api";
import { Store } from "../db/store";

const token = process.env.TELEGRAM_BOT_TOKEN!;
const chatId = process.env.TELEGRAM_CHAT_ID!;

export async function notifyNewPendingJobs() {
  const store = new Store();
  store.init();

  const bot = new TelegramBot(token);
  const rows = store.listUnnotifiedPendingReview();

  for (const row of rows) {
    const text = [
      `New matching job found`,
      `ID: ${row.upwork_job_id}`,
      `Title: ${row.title ?? "n/a"}`,
      `URL: ${row.url ?? "n/a"}`,
      `Capability fit: ${Number(row.capability_fit).toFixed(2)}`,
      `Delivery risk: ${Number(row.delivery_risk).toFixed(2)}`,
      `Proposal strength: ${Number(row.proposal_strength).toFixed(2)}`,
      ``,
      `Macht dieser Job Sinn für uns?`
    ].join("\n");

    await bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: [[
          { text: "Makes sense + Draft", callback_data: `draft:${row.upwork_job_id}` },
          { text: "Reject", callback_data: `reject:${row.upwork_job_id}` }
        ]]
      }
    });

    store.markNotificationSent(row.upwork_job_id, "pending_review");
  }
}
