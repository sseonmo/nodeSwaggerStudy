const express = require('express');
const axios = require('axios');
const router = express.Router();

const URL = 'http://localhost:8002/v2';
axios.defaults.headers.origin = 'http://localhost:4000';

const request = async (req, api) => {
	try {
		// 세션에 토근값이 없으면 발급 시도
		if (!req.session.jwt) {
			const tokenResult = await axios.post(`${URL}/token`, {
				clientSecret: process.env.CLIENT_SECRET,
			});

			req.session.jwt = tokenResult.data.token;
		}

		//	api 요청
		return await axios.get(`${URL}${api}`, {
			headers: {authorization: req.session.jwt}
		});

	} catch (err) {
		console.error(err);
		if (err.response.status === 419) {  // 토근 만료
			delete req.session.jwt;
			return request(req, api)
		}
		return err.response;
	}
};


router.get('/mypost', async (req, res, next) => {
	try {
		const result = await request(req, '/posts/my');
		res.json(result.data)
	} catch (err) {
		console.error(err);
		next(err);
	}
});

router.get('/search/:hashtag', async (req, res, next) => {
	try {
		const result = await request(req,`/posts/hashtag/${encodeURIComponent(req.params.hashtag)}`);
		res.json(result.data)
	} catch (e) {
		console.error(e);
		next(e)
	}
});

router.get('/myfollowers', async (req, res, next) => {
	try {
		const result = await request(req,`/myfollowers`);
		res.json(result.data)
	} catch (e) {
		console.error(e);
		next(e)
	}
});

router.get('/', (req, res) => {
	res.render('main', {key: process.env.CLIENT_SECRET})
});


module.exports = router;