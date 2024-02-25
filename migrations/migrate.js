require("dotenv").config();

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
	host: process.env.HOST,
	port: process.env.POSTGRES_PORT_HOST,
	database: process.env.POSTGRES_DB,
	user: process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD,
});

const migrate = async () => {
	const migrationKey = process.argv[2];
	if (!migrationKey) {
		console.error("Необходимо указать ключевую часть имени файла миграции.");
		return;
	}

	const migrationDirectory = path.join(__dirname);
	const migrationFiles = fs.readdirSync(migrationDirectory)
		.filter(file => file.includes(migrationKey));

	if (migrationFiles.length === 0) {
		console.error(`Миграция с ключевой частью "${migrationKey}" не найдена.`);
		return;
	}

	for (const file of migrationFiles) {
		const migrationFile = path.join(migrationDirectory, file);
		try {
			const client = await pool.connect();
			const migrationQuery = fs.readFileSync(migrationFile, { encoding: "utf-8" });
			await client.query(migrationQuery);
			console.log(`Миграция ${file} выполнена успешно.`);
		} catch (err) {
			console.error(`Ошибка при выполнении миграции ${file}:`, err.stack);
		} finally {
			await pool.end();
		}
	}
};

migrate();
