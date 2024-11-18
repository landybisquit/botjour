import mongoose from "mongoose";
mongoose.connect("mongodb://127.0.0.1:27017/diary");

const Admin = mongoose.model(
	"Admin",
	new mongoose.Schema({
		name: String,
		invite_code: String,
		empty_id: {
			type: Number,
			autoIncrement: true,
		},
		access_lvl: Number,
	})
);


let tutorSchema = new mongoose.Schema({
	master: [String],
	name: String,
	userID: Number,
	invite_code: String,
	empty_id: {
		type: Number,
		autoIncrement: true,
	},
	lead: [String],
});
const Tutor = mongoose.model("Tutor", tutorSchema);

let userSchema = new mongoose.Schema({
	class: String,
	userID: Number,
	name: String,
	group: [],
	access_lvl: Number,
	tasks: [String],
});
const User = mongoose.model("User", userSchema);

const Task = mongoose.model(
	"Task",
	new mongoose.Schema({
		created_at: {
			type: Date,
			default: Date.now,
		},
		actual: Boolean,
		expire: Date,
		teacher_id: String,
		class_name: String,
		content: {
			text: String,
			data: {},
			data_type: String,
		},
	})
);

export { Admin, Tutor, User, Task };
