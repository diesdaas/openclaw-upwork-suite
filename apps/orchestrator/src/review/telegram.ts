import TelegramBot from "node-telegram-bot-api";
import { ReviewService } from "./review_service";

const token = process.env.TELEGRAM_BOT_TOKEN!;
const allowedChatId = process.env.TELEGRAM_CHAT_ID!;
const bot = new TelegramBot(token, { polling: true });
const review = new ReviewService("data/state.sqlite");

function ensureAllowed(chatId: number | string) {
  if (String(chatId) !== String(allowedChatId)) throw new Error("Unauthorized chat");
}

async function sendPending(chatId: number) {
  const rows = review.listPending();
  if (!rows.length) return bot.sendMessage(chatId, "No pending jobs.");

  for (const row of rows.slice(0, 10)) {
    await bot.sendMessage(chatId, [
      `Job Review`,
      `ID: ${row.upwork_job_id}`,
      `Title: ${row.title ?? "n/a"}`,
      `URL: ${row.url ?? "n/a"}`,
      `Capability fit: ${Number(row.capability_fit).toFixed(2)}`,
      `Delivery risk: ${Number(row.delivery_risk).toFixed(2)}`,
      `Proposal strength: ${Number(row.proposal_strength).toFixed(2)}`
    ].join("\n"), {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Makes sense + Draft", callback_data: `draft:${row.upwork_job_id}` },
            { text: "Reject", callback_data: `reject:${row.upwork_job_id}` }
          ]
        ]
      }
    });
  }
}

async function sendDraftPreviews(chatId: number) {
  const rows = review.listDrafts();
  if (!rows.length) return bot.sendMessage(chatId, "No new drafts.");

  for (const row of rows) {
    const draft = JSON.parse(row.draft_json);
    await bot.sendMessage(chatId, [
      `Draft ready`,
      `Job ID: ${row.upwork_job_id}`,
      ``,
      `First milestone:`,
      draft.firstMilestone,
      ``,
      `Cover letter preview:`,
      String(draft.coverLetter).slice(0, 900)
    ].join("\n"), {
      reply_markup: {
        inline_keyboard: [[
          { text: "Approve Submit", callback_data: `submit:${row.upwork_job_id}` },
          { text: "Reject", callback_data: `reject:${row.upwork_job_id}` }
        ]]
      }
    });
    review.markDraftNotified(row.upwork_job_id);
  }
}

bot.onText(/\/pending/, async msg => {
  try { ensureAllowed(msg.chat.id); await sendPending(msg.chat.id); }
  catch { await bot.sendMessage(msg.chat.id, "Access denied."); }
});

bot.onText(/\/drafts/, async msg => {
  try { ensureAllowed(msg.chat.id); await sendDraftPreviews(msg.chat.id); }
  catch { await bot.sendMessage(msg.chat.id, "Access denied."); }
});

bot.on("callback_query", async query => {
  const msg = query.message;
  if (!msg) return;

  try {
    ensureAllowed(msg.chat.id);
    const [action, jobId] = String(query.data || "").split(":");
    if (!jobId) return;

    if (action === "draft") review.approveDraft(jobId, "approved via telegram");
    if (action === "reject") review.reject(jobId, "rejected via telegram");
    if (action === "submit") review.approveSubmit(jobId, "submit approved via telegram");

    await bot.answerCallbackQuery(query.id, { text: `${action} -> ${jobId}` });
  } catch {
    await bot.sendMessage(msg.chat.id, "Access denied.");
  }
});

console.log("Telegram review bot started.");
