import { Mutex } from "async-mutex";
import { Scenes, Markup } from "telegraf";
import { leaver } from "../index.mjs";
const { BaseScene } = Scenes;

import { Tutor, User } from "./db_create.mjs";

const mutex = new Mutex();

async function regSwitcher(msg) {
	await msg.reply(
		"Выбери свой статус:",
		Markup.inlineKeyboard([
			Markup.button.callback("Я - ученик", "reg:student"),
			Markup.button.callback("Я - учитель", "reg:teacher"),
		])
	);
}

const roleChoosingScene = new BaseScene("roleChoosingScene");
roleChoosingScene.enter((ctx) => {
	if (ctx.scene.state.flags[1] == "student") {
		ctx.scene.enter("studentDataScene");
	} else {
		ctx.scene.enter("teacherDataScene");
	}
});

const teacherDataScene = new BaseScene("teacherDataScene");
teacherDataScene.enter((ctx) => {
	ctx.reply(
		"Введите код приглашения. Если его нет, обратитесь к администратору. /break - отмена регистрации"
	);
});
teacherDataScene.hears(/.*/, (ctx) => {
	if (ctx.message.text == "/break") {
		leaver(ctx);
		return;
	}
	finallyUserSaving(ctx, "teacher");
	ctx.scene.leave();
});

const studentDataScene = new BaseScene("studentDataScene");
studentDataScene.enter((ctx) => {
	ctx.replyWithHTML(
		"Введите информацию о себе в формате <code>Имя Фамилия, класс, номер подгруппы(опционально)</code>. /break - отмена регистрации"
	);
});
studentDataScene.hears(/.*/, (ctx) => {
	if (ctx.message.text == "/break") {
		leaver(ctx);
		return;
	}
	finallyUserSaving(ctx, "student");
	ctx.scene.leave();
});

async function finallyUserSaving(ctx, type) {
	await mutex.runExclusive(async () => {
		switch (type) {
			case "student":
				try {
					let data = ctx.message.text.split(",");
					data = [
						data[0],
						data[1].replace(/\s/g, "").toUpperCase(),
						data[2]?.replace(/\s/g, "").toUpperCase(),
					];
					data[2] ??= null;
					let newUser = new User({
						userID: ctx.from.id,
						name: data[0],
						class: data[1],
						group: data[2],
					});
					await newUser.save();
					ctx.reply("Данные сохранены");
				} catch (err) {
					ctx.replyWithHTML(
						`Не удалось завершить регистрацию. Ошибка: <code>${err}</code>`
					);
				}
				break;
			case "teacher":
				try {
					let code = ctx.message.text;
					if (!(await Tutor.findOne({ invite_code: code }))) {
						throw new Error(
							"DataError: could not find invite code"
						);
					}
					await Tutor.findOneAndUpdate(
						{ invite_code: code },
						{ $set: { userID: ctx.from.id } },
						{ new: true }
					);
					ctx.reply("Регистрация завершена. Пиши /help для списка команд");
				} catch (err) {
					ctx.replyWithHTML(
						`Не удалось завершить регистрацию. Ошибка: <code>${err}</code>`
					);
				}
		}
	});
}

async function sender(msg) {
	await msg.replyWithHTML(
		`Не удалось завершить регистрацию. Ошибка: <code>${111111}</code>`
	);
}
export default regSwitcher;
export {
	sender,
	regSwitcher,
	roleChoosingScene,
	studentDataScene,
	teacherDataScene,
};
