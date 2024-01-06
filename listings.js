import axios from 'axios';

const bootstrap = async () => {

	new Promise(async () => {
		while (true) {


			await new Promise(resolveTimeout => setTimeout(resolveTimeout, 1000));
		}
	});

}

bootstrap();