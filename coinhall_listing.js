import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';

const bootstrap = async () => {
	const client = new TelegramBot('6282135801:AAElFeYk-a74zzTggDvjmPGFP39Ko7GfImQ');
	const bot_metadata = await client.getMe();

	let receivers = [
		236509825,
		804428821,
		344593604
	];

	console.log(`Logged as ${bot_metadata.first_name} | https://t.me/${bot_metadata.username}`);


	const escapeMarkdownV2 = (str) => {
		const specialChars = ['_', '*', '~', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
		let escapedStr = str;
	
		for (let char of specialChars) {
			const regex = new RegExp('\\' + char, 'g');
			escapedStr = escapedStr.replace(regex, '\\' + char);
		}
	
		return escapedStr;
	}

	receivers.forEach(async (receiver) => {

	});

	while (true) {
		console.log(`[${new Date().toLocaleTimeString()}] Fetch trends...`);

 
        await new Promise(resolve => setTimeout(resolve, 5000)); // Пауза на 1 минуту
    }
}

bootstrap();