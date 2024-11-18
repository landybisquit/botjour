import { Mutex } from "async-mutex";
import { Markup } from "telegraf";

import { Task, User } from "./db_create.mjs";

const mutex = new Mutex();

async function getTasks(ctx) {
    try {
        await mutex.runExclusive(async () => {
            const current = await User.findOne({userID: ctx.from.id})
            const tasks = current.tasks
            
            if (tasks.length === 0) {
                await ctx.reply("У тебя нет невыполненных заданий.");
                return;
            }

            for (const task of tasks) {
                const data = (await Task.findOne({ _id: task })).content.data;

                switch (data?.type) {
                    case "photo":
                    case "document":
                        await ctx.replyWithMediaGroup(data.files);
                        break;
                    default:
                        await ctx.reply(data.text);
                        break;
                }

                await ctx.reply(
                    "Жми, если ты выполнил задание",
                    Markup.inlineKeyboard([
                        Markup.button.callback("Отметить как выполненное", `apply:${task}`)
                    ])
                );
            }
            
        })
    }
    catch (err) {
        ctx.replyWithHTML(
			`Не удалось завершить сохранение. Ошибка: <code>${err}</code>`
		);
    }
};

async function completeTask(ctx, task) {
    try {
        await mutex.runExclusive(async () => {
            let current = await User.findOne({userID: ctx.from.id})
            current.tasks.splice(current.tasks.indexOf(task), 1)
            await current.save();
            ctx.reply("Данные обновлены.")
        })
    }
    catch (err) {
        ctx.replyWithHTML(
            `Не удалось подтвердить. Ошибка: <code>${err}</code>`
        );
    }
}

export { getTasks, completeTask }