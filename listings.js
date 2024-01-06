import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';

const bypassCorsHeaders = {
	"Referer": "https://coinhall.org/",
	"Pragma": "no-cache",
	"Origin": "https://coinhall.org",
	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

const logger = (message) => console.log(`[${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}] ${message}`);

const coinhallGetListedPools = () => axios.get('https://api.seer.coinhall.org/api/coinhall/pools?limit=30&offset=0&chains=sei%2Cinjective&verified=false&minimumLiquidity=1000&sortBy=listedTime&sortDir=desc', {
	headers: bypassCorsHeaders
}).then((res) => res.data.pools);

const bootstrap = async () => {
	const client = new TelegramBot('6332351840:AAGPcrEUZE6JPmME_HAulmkiQYeY0ze61Rg');
	
	await client.getMe().then((bot_metadata) => {
		console.log(`Logged as ${bot_metadata.first_name} | https://t.me/${bot_metadata.username}`);

		return bot_metadata;
	})

	const publishChannel = -1002002798956;

	let latestListedPools = await coinhallGetListedPools();

	new Promise(async () => {
		while (true) {
			logger('Get pools');

			const currentListings = await coinhallGetListedPools();
			for (const pool of currentListings) {
				const exists = latestListedPools.find((stored_pool) => stored_pool.id === pool.id);
				if (exists) continue;

				const message = `
${pool.assets[0].symbol} / ${pool.assets[1].symbol}
${pool.assets[0].name} / ${pool.assets[1].name}

DEX: #${pool.dex}
Chain: #${pool.chain}
Liquidity: ${pool.liquidity.toFixed(0)}$
Traders: ${pool.uniqueTraders}

Volume
1h     ${pool.volume1h.toFixed(0)}$
24h   ${pool.volume24h.toFixed(0)}$
7d     ${pool.volume7d.toFixed(0)}$

APR %
1h     ${pool.apr1h.toFixed(0)}%
24h   ${pool.apr24h.toFixed(0)}%
7d     ${pool.apr7d.toFixed(0)}%

[Trade](https://coinhall.org/${pool.chain}/${pool.id})
`;
				
				logger('New pool findeded');
				latestListedPools.push(pool);
				
				await client.sendMessage(publishChannel, message, { parse_mode: 'Markdown' });
				logger('Message sended');
			}

			await new Promise(resolveTimeout => setTimeout(resolveTimeout, 10_000));
		}
	});

}

bootstrap();