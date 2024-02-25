"use strict";

require("dotenv").config();

const { Pool } = require("pg");

module.exports = {
	name: "db",

	settings: {
		postgres: {
			host: process.env.POSTGRES_HOST,
			port: process.env.POSTGRES_PORT_HOST,
			database: process.env.POSTGRES_DB,
			user: process.env.POSTGRES_USER,
			password: process.env.POSTGRES_PASSWORD,
		}
	},

	actions: {
		query: {
			params: {
				sql: { type: "string", require: true },
				values: { type: "array", optional: true },
			},
			async handler(ctx) {
				const { sql, values } = ctx.params;
				return this.executeQuery(sql, values);
			}
		},
		findUserByEmail: {
			params: {
				email: { type: "string", require: true },
			},
			async handler(ctx) {
				const { email } = ctx.params;
				const sql = "SELECT * FROM users WHERE email = $1";
				const values = [ email ];
				const result = await this.executeQuery(sql, values);
				return result.length > 0 ? result[0] : null;
			}
		},
		createUser: {
			params: {
				email: { type: "string", require: true },
				password: { type: "string", require: true },
			},
			async handler(ctx) {
				const { email, password } = ctx.params;
				const sql = "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *;";
				const values = [email, password, "Вася"];

				try {
					const result = await this.executeQuery(sql, values);

					return result[0];
				} catch (err) {
					throw new Error("Не удалось создать пользователя: " + err.message);
				}
			}
		},
		deleteUser: {
			params: {
				email: { type: "string", require: true },
			},
			async handler(ctx) {
				const { email } = ctx.params;

				const data = await ctx.call("db.findUserByEmail", { email });

				try {
					if (data !== null) {
						const sql = "DELETE FROM users WHERE email = $1";
						await this.executeQuery(sql, [email]);

						return true;
					} else {
						return false;
					}
				} catch (err) {
					throw new Error(err);
				}
			}
		}
	},

	methods: {
		_connectToDB() {
			this.pool = new Pool(this.settings.postgres);
		},

		async executeQuery(sql, values = []) {
			const client = await this.pool.connect();

			try {
				const res = await client.query(sql, values);
				return res.rows;
			} finally {
				client.release();
			}
		},
	},

	async started() {
		this._connectToDB();
		this.logger.info("Соединение с базой данных установлено.");
	},

	async stopped() {
		await this.pool.end();
		this.logger.info("Соединение с базой данных закрыто.");
	}
};
