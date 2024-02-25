"use strict";

const ApiGateway = require("moleculer-web");

module.exports = {
	name: "api",
	mixins: [ApiGateway],

	settings: {
		port: process.env.PORT || 3000,
		ip: process.env.HOST || "0.0.0.0",
		use: [],

		routes: [
			{
				path: "/auth",
				authentication: false,
				mergeParams: true,
				logging: true,
				bodyParsers: {
					json: {
						strict: false,
						limit: "1MB"
					},
					urlencoded: {
						extended: true,
						limit: "1MB"
					}
				},
				aliases: {
					"POST /register": "auth.register",
					"POST /login": "auth.login",
					"POST /logout": "auth.logout",
					"POST /unregister": "auth.unregister",
				},
			},
			{
				path: "/date",
				authentication: true,
				mergeParams: true,
				logging: true,
				bodyParsers: {
					json: {
						strict: false,
						limit: "1MB"
					},
					urlencoded: {
						extended: true,
						limit: "1MB"
					}
				},
				aliases: {
					"GET /actualDate": "date.actualDate",
				},
			},
		],

		log4XXResponses: false,
		logRequestParams: null,
		logResponseData: null,
		assets: {
			folder: "public",
			options: {}
		}
	},

	methods: {
		parseCookies(cookieString) {
			const cookies = {};

			cookieString && cookieString.split(";").forEach(cookie => {
				const parts = cookie.match(/(.*?)=(.*)$/);
				cookies[parts[1].trim()] = (parts[2] || "").trim();
			});

			return cookies;
		},

		async authenticate(ctx, route, req) {
			const cookies = this.parseCookies(req.headers.cookie);
			const token = cookies["token"];

			if (token) {
				try {
					return await ctx.call("auth.verifyToken", { token });
				} catch (err) {
					throw new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN, err.message);
				}
			} else {
				throw new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_NO_TOKEN);
			}
		}

	}
};
