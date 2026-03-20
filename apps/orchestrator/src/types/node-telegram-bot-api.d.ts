declare module "node-telegram-bot-api" {
  export interface Chat {
    id: number;
    type: string;
    title?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
  }

  export interface Message {
    chat: Chat;
    message_id: number;
    date: number;
    text?: string;
  }

  export interface CallbackQuery {
    id: string;
    from: { id: number; is_bot: boolean; first_name: string; username?: string };
    message?: Message;
    data?: string;
    chat_instance?: string;
  }

  export interface InlineKeyboardButton {
    text: string;
    callback_data?: string;
    url?: string;
  }

  export interface InlineKeyboardMarkup {
    inline_keyboard: InlineKeyboardButton[][];
  }

  export interface SendMessageOptions {
    reply_markup?: InlineKeyboardMarkup;
    parse_mode?: string;
  }

  export interface AnswerCallbackQueryOptions {
    text?: string;
  }

  export default class TelegramBot {
    constructor(token: string, options?: { polling?: boolean; webhook?: boolean });
    sendMessage(chatId: number | string, text: string, options?: SendMessageOptions): Promise<Message>;
    onText(regexp: RegExp, callback: (msg: Message) => void | Promise<void>): void;
    on(event: "callback_query", callback: (query: CallbackQuery) => void | Promise<void>): void;
    answerCallbackQuery(callbackQueryId: string, options?: AnswerCallbackQueryOptions): Promise<boolean>;
    stopPolling(): void;
  }
}
