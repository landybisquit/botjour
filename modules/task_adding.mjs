import { Mutex } from "async-mutex";
import { Scenes, Markup } from "telegraf";
import mediaGroup from "telegraf-media-group";
import { leaver } from "../index.mjs";

const { BaseScene } = Scenes;

import { Task, User } from "./db_create.mjs";

const mutex = new Mutex();

function addNewTask(ctx) {
	ctx.reply(
		"Отправь текст задания с вложениями, если они есть. " +
			"Для отмены пиши /break."
	);
	ctx.scene.enter("getTaskScene");
}

async function sendPreview(ctx, data) {
	await ctx.reply("Вот твоё задание:")
	switch (data?.type) {
		case "photo":
		case "document":
			await ctx.replyWithMediaGroup(
				data.files
			);
			break;
		default:
			await ctx.reply(data.text);
			break;
	}
	await ctx.reply(
		"Сохранить задание?",
		Markup.inlineKeyboard([
				Markup.button.callback("Сохранить", "apply"),
				Markup.button.callback("Редактировать", "edit")
			]
		)
	)
}

const getTaskScene = new BaseScene("getTaskScene").use(mediaGroup());
getTaskScene.enter();
getTaskScene.on(["message", "media_group"], async (ctx) => {
	if (ctx.message.text == "/break") {
		leaver(ctx);
		return;
	}
	let data = ctx.scene.state.data || {};
	data.text = ctx.message.text ||= "";
	data.files ??= [];
	if (ctx.mediaGroup) {
		if (ctx.mediaGroup[0].photo) {
			ctx.mediaGroup.forEach((element) => {
				data.files.push({
					type: "photo",
					media: `${element.photo.at(-1).file_id}`,
				});
			});
			data.files[0].caption ??= ctx.mediaGroup[0].caption ||= "";
			data.type = "photo";
		} else if (ctx.mediaGroup[0].document) {
			ctx.mediaGroup.forEach((element) => {
				data.files.push({
					type: "document",
					media: `${element.document.file_id}`,
				});
			});
			data.files[0].caption ??= ctx.mediaGroup[0].caption ||= "";
			data.type = "document";
		}
	} else if (ctx.message.photo) {
		data.files.push({
			type: "photo",
			media: `${ctx.message.photo.at(-1).file_id}`,
			caption: ctx.message.photo.at(-1).caption
		});
		data.type = "photo";
	} else if (ctx.message.document) {
			data.files = {
				type: "document",
				media: `${ctx.message.document.file_id}`,
			};
		data.type = "document";
	} else if (data.files.length > 0) {
		data.files[0].caption = data.text
	} else {
		data.type = "text";
	}
	data.files.length = data.files.length > 10 ? 10 : data.files.length;
	await sendPreview(ctx, data);
	ctx.scene.enter("confirmScene", { data: data });
});

const confirmScene = new BaseScene("confirmScene");
confirmScene.enter();
confirmScene.action("apply", async (ctx) => {
	const data = ctx.scene.state.data
	ctx.deleteMessage();
	try {
        await mutex.runExclusive(async () => {
            try {
                const current = await User.findOne({ userID: ctx.from.id });
                const students = await User.find({ class: current.class });
                const newTask = new Task({
                    actual: true,
                    class_name: current.class,
                    content: {
						data: data
					}
                });
                await newTask.save();
                if (students) {
                    await Promise.all(students.map(async (student) => {
                        student.tasks.push(newTask._id);
                        await student.save();
                    }));
                }
                ctx.reply("Данные сохранены. Команды - /help.");
            } catch (error) {
                console.error('Error in transaction:', error);
                throw error;
            }
        });
    } catch (error) {
        console.error('Error in mutex:', error)
		ctx.replyWithHTML(
			`Не удалось завершить сохранение. Ошибка: <code>${error}</code>`
		);
    }
	ctx.scene.leave();
})

confirmScene.action("edit", async (ctx) => {
	await ctx.deleteMessage();
	await ctx.reply("Отправь новое задание с вложениями или текстом. Отмена - /break.");
	ctx.scene.enter("getTaskScene");
})



export { addNewTask, getTaskScene, confirmScene };
