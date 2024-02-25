const JwtService = require("jsonwebtoken");
const bcrypt = require("bcrypt");

module.exports = {
	name: "auth",
	dependencies: ["db"],
	actions: {
		register: {
			params: {
				email: { type: "string", require: true },
				password: { type: "string", require: true }
			},
			async handler(ctx) {
				const { email, password } = ctx.params;

				const existingUser = await ctx.call("db.findUserByEmail", { email });
				if (existingUser) {
					throw new Error("Пользователь с этим адресом электронной почты уже существует");
				}

				const saltRounds = 10;
				const hashedPassword = await bcrypt.hash(password, saltRounds);

				await ctx.call("db.createUser", { email, password: hashedPassword });

				return {
					register: true
				};
			}
		},
		login: {
			params: {
				email: { type: "string", require: true },
				password: { type: "string", require: true }
			},
			async handler(ctx) {
				const { email, password } = ctx.params;

				const user = await ctx.call("db.findUserByEmail", { email });

				if (!user) {
					throw new Error("Пользователь не найден.");
				}

				const isMatchPassword = await bcrypt.compare(password, user.password);
				if (!isMatchPassword) {
					throw new Error("Неверные учетные данные.");
				}

				const token = JwtService.sign({ userId: user.id, email: user.email }, process.env.SECRET_KEY, { expiresIn: "30m" });

				ctx.meta.$responseHeaders = {
					"Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=1800`
				};

				return {
					login: true
				};
			}
		},
		logout: {
			async handler(ctx) {
				ctx.meta.$responseHeaders = {
					"Set-Cookie": "token=; HttpOnly; Path=/; Max-Age=0"
				};

				return {
					logout: true
				};
			}
		},
		unregister: {
			params: {
				email: { type: "string", require: true }
			},
			async handler(ctx) {
				const { email } = ctx.params;

				const data = await ctx.call("db.deleteUser", { email });

				return data ? {
					message: "Пользователь успешно удален.",
					unregister: true
				} : {
					message: "Пользователь не найден.",
					unregister: false
				};
			}
		},
		verifyToken: {
			params: {
				token: { type: "string", require: true }
			},
			async handler(ctx) {
				const { token } = ctx.params;

				try {
					return  JwtService.verify(token, process.env.SECRET_KEY);
				} catch (err) {
					throw new Error("Неверный токен.");
				}
			}
		}
	}
};
