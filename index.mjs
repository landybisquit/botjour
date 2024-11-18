import mediaGroup from 'telegraf-media-group';
import { Telegraf, Scenes, session } from "telegraf";
import { Mutex } from "async-mutex";
import dotenv from "dotenv";
import * as reg from "./modules/registration.mjs";
import * as nTask from "./modules/task_adding.mjs"
import * as mTasks from "./modules/task_viewer.mjs"

import { Tutor, User } from "./modules/db_create.mjs";

dotenv.config();
const bot = new Telegraf(process.env.TOKEN);
const mutex = new Mutex();

const stage = new Scenes.Stage();
stage.register(reg.roleChoosingScene, reg.studentDataScene, reg.teacherDataScene, nTask.getTaskScene, nTask.confirmScene);

bot.use(session());
bot.use(stage.middleware());
bot.use(mediaGroup())

bot.on("message", (ctx) => {
	onMessageSwitcher(ctx);
});

bot.action(/.*/, (ctx) => {
	ctx.deleteMessage();
	onActionSwitcher(ctx);
});


function onActionSwitcher(ctx) {
	const flags = ctx.callbackQuery.data.split(":");
	switch (flags[0]) {
		case "reg":
			ctx.scene.enter("roleChoosingScene", { flags: flags });
			break;
		case "task":
			break;
		case "apply":
			mTasks.completeTask(ctx, flags[1])
			break;
	}
}

function onMessageSwitcher(msg) {
	const text = msg.message.text;
	switch (text) {
		case "/newtask":
			nTask.addNewTask(msg);
			break;
		case "/mytasks":
			mTasks.getTasks(msg);
			break;
		case "/start":
			startScript(msg);
			break;
		case "/check":
			reg.sender(msg);
			msg.reply(text);
			break;
		case "/break":
			msg.scene.leave();
			break;
		case "/help":
			msg.reply(
				"Это бот для просмотра домашки. Список команд: \n"+
				"/newtask - добавить новое задание \n"+
				"/mytasks - посмотреть задания \n \n"+
				"/adm - руководители и техподдержка"
			);
			break;
		case "/adm":
			msg.reply(
                "Разработчик: @landybisquitt \n"
            );
            break;
		default:
			msg.reply("Не совсем понял, что от меня хотят. Попробуем снова?");
	}
}

async function startScript(msg) {
	const checkRelease = await mutex.acquire();
	try {
		let id = msg.from.id;
		if (
			(await User.findOne({ userID: id })) ||
			(await Tutor.findOne({ userID: id }))
		) {
			msg.reply("Пишите /help для помощи");
		} else {
			msg.reply("Привет! Это бот для хранения домашки. Давай зарегистрируемся!")
			reg.regSwitcher(msg);
		}
	} catch (err) {
		checkRelease();
		console.error(err);
		await msg.reply(err);
	} finally {
		checkRelease();
	}
}

function leaver(ctx) {
	ctx.scene.leave();
	ctx.reply("Операция отменена")
}

bot.launch().then(() => {
	console.log("Started");
});
export default bot;
export { leaver };
