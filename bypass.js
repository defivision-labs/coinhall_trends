import axios from 'axios';

axios.get('https://api.seer.coinhall.org/api/coinhall/trending/pools', {
	headers: {
		"Referer": "https://coinhall.org/",
		"Pragma": "no-cache",
		"Origin": "https://coinhall.org",
		"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
	}
}).then((res) => {
	console.log(res.data);
})