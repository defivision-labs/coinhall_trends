import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';

const bypassCorsHeaders = {
	"Referer": "https://coinhall.org/",
	"Pragma": "no-cache",
	"Origin": "https://coinhall.org",
	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

const bootstrap = async () => {
	const client = new TelegramBot('6282135801:AAElFeYk-a74zzTggDvjmPGFP39Ko7GfImQ');
	const bot_metadata = await client.getMe();

	let receivers = [
		236509825,
		804428821,
		344593604
	];
	let previousTrends = [];

	const notifySubscribers = async (message) => {
		if (message) {
			const receivers = [236509825, 804428821, 344593604]; // Ваши получатели
			receivers.forEach(receiver => {
				client.sendMessage(receiver, message, { parse_mode: 'Markdown' })
					.catch(error => console.log(`Message not sent to ${receiver}`));
			});
		}
	};

	const generateTrendsMessage = (newTrends, tokenPairSymbol) => {
		let message = `Pooled: #${tokenPairSymbol}\n`;
	
		// Определяем изменения в позициях и новые токены
		newTrends.forEach((t, index) => {
			if (t.pooled !== tokenPairSymbol) return;

			const previousPosition = previousTrends.findIndex(p => p.id === t.id) + 1;
			if (previousPosition === 0) {
				// Новый токен
				message += `*${index + 1}. ${t.symbol} [NEW!] ✅✅✅*\n`;
			} else if (previousPosition !== index + 1) {
				// Изменение позиции
				const emoji = previousPosition > index + 1 ? '🔥' : '👎';
				message += `${index + 1}. ${t.symbol} - ${emoji} ${previousPosition} -> ${index + 1}\n`;
			} else {
				message += `${index + 1}. ${t.symbol}\n`;
			}
		});
	
		// Проверяем на исчезнувшие токены
		const removedTokens = previousTrends.filter(p => !newTrends.some(t => t.id === p.id));
		if (removedTokens.length > 0) {
			message += '\n' + removedTokens.map(t => `${t.symbol} - removed`).join('\n');
		}
	
		return message;
	};

	console.log(`Logged as ${bot_metadata.first_name} | https://t.me/${bot_metadata.username}`);

	const fetchTrends = async () => {
		try {
			const response = await axios.get('https://api.seer.coinhall.org/api/coinhall/trending/pools', { headers: bypassCorsHeaders });
			return response.data.pools.map((pool) => {
				const pooledToken = ['INJ', 'SEI'].includes(pool.assets[0].symbol) ? pool.assets[0].symbol : pool.assets[1].symbol;
				const token = pool.assets[0].symbol === pooledToken ? pool.assets[1].symbol : pool.assets[0].symbol

				return {
					id: pool.id,
					pooled: pooledToken,
					symbol: `${token} / ${pooledToken}`
				}
			});
			// return response.data.pools.filter((pool) => ![pool.assets[0].symbol, pool.assets[1].symbol].includes('SEI')).map(pool => ({
			// 	id: pool.id,
			// 	symbol: ['INJ'].includes(pool.assets[0].symbol) ? `${pool.assets[1].symbol} / ${pool.assets[0].symbol}` : `${pool.assets[0].symbol} / ${pool.assets[1].symbol}`,
			// }));
		} catch (error) {
			console.error('Error fetching trends', error.message);
			return [];
		}
	};

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
		const trending = await axios.get('https://api.seer.coinhall.org/api/coinhall/trending/pools', { headers: bypassCorsHeaders }).then((res) => res.data.pools)
		const message = `
Actual List:

${trending.map((pool, poolIndex) => {
	const token = pool.assets[0].symbol === 'INJ' ? pool.assets[1] : pool.assets[0];
	return `${poolIndex + 1}. ${token.symbol} - [chart](https://coinhall.org/injective/${pool.id})`
}).join('\n')}
`;

		client.sendMessage(receiver, escapeMarkdownV2(message), { parse_mode: 'MarkdownV2', disable_web_page_preview: true })
			.catch(_ => console.log(`Message not sended about launch to ${receiver}`))
	});


	let latestSeiMsg = '';
	let latestInjMsg = ''
	while (true) {
		console.log(`[${new Date().toLocaleTimeString()}] Fetch trends...`);

        const newTrends = await fetchTrends();
        const messageInj = generateTrendsMessage(newTrends, 'INJ');
		const messageSei = generateTrendsMessage(newTrends, 'SEI');

		if (
			newTrends.length !== 0 &&
			JSON.stringify(newTrends) !== JSON.stringify(previousTrends)
		) {
			if (latestInjMsg !== messageInj) {
				notifySubscribers(messageInj);
				latestInjMsg = messageInj;
			}
			if (latestSeiMsg !== messageSei) {
				notifySubscribers(messageSei);
				latestSeiMsg = messageSei;
			}	
		}

		previousTrends = [ ...newTrends ];
        
        await new Promise(resolve => setTimeout(resolve, 5000)); // Пауза на 1 минуту
    }
}

bootstrap();
