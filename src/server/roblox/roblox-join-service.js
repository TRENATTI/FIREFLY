require("dotenv").config();

const axios = require("axios");
const admin = require("firebase-admin");


async function RJS(
	client,
	noblox,
	currentUser,
	admin,
	token,
	applicationid,
	prefix
) {

	// ======================================
	// CONFIG
	// ======================================

	if (
		process.env.DEVELOPER_MODE == "true" ||
		process.env.DATABASE_MODE == "true"
	) return;


	const GROUP_ID = 32498529;

	const DISCORD_GUILD_ID =
		"1314823843315187742";

	const DISCORD_CHANNEL_ID =
		"1339624322221998133";


	console.log(
		new Date(),
		"| roblox-join-service.js |",
		"Ready!"
	);


	// ======================================
	// DISCORD
	// ======================================

	const guild = await client.guilds.fetch(
		DISCORD_GUILD_ID
	);

	const channel = await guild.channels.fetch(
		DISCORD_CHANNEL_ID
	);


	// ======================================
	// FIREBASE
	// ======================================

	const db = admin.database();


	// ======================================
	// ROBLOX CSRF
	// ======================================

	let xCsrfToken = "";


	function sleep(ms) {

		return new Promise(resolve => {
			setTimeout(resolve, ms);
		});

	}


	// ======================================
	// ROBLOX GROUP BAN
	// ======================================

	async function banFromGroup(userId) {

		const url =
			`https://groups.roblox.com/v1/groups/${GROUP_ID}/bans/${userId}`;


		try {

			let response = await axios.post(
				url,
				"",
				{
					headers: {

						Cookie:
							`.ROBLOSECURITY=${process.env.RBXCOOKIE}`,

						"x-csrf-token":
							xCsrfToken,

						"Content-Length":
							"0"

					},

					validateStatus:
						() => true
				}
			);


			// ======================================
			// CSRF TOKEN
			// ======================================

			if (
				response.status === 403 &&
				response.headers["x-csrf-token"]
			) {

				xCsrfToken =
					response.headers["x-csrf-token"];


				console.log(
					new Date(),
					"| roblox-join-service.js |",
					"Updated Roblox CSRF token."
				);


				response = await axios.post(
					url,
					"",
					{
						headers: {

							Cookie:
								`.ROBLOSECURITY=${process.env.RBXCOOKIE}`,

							"x-csrf-token":
								xCsrfToken,

							"Content-Length":
								"0"

						},

						validateStatus:
							() => true
					}
				);

			}


			// ======================================
			// RATE LIMIT
			// ======================================

			if (response.status === 429) {

				console.log(
					new Date(),
					"| roblox-join-service.js |",
					"Roblox rate limited ban request. Retrying..."
				);


				await sleep(10000);


				return banFromGroup(userId);

			}


			// ======================================
			// SUCCESS
			// ======================================

			if (
				response.status >= 200 &&
				response.status < 300
			) {

				console.log(
					new Date(),
					"| roblox-join-service.js |",
					"Banned user:",
					userId
				);


				return true;

			}


			// ======================================
			// FAILURE
			// ======================================

			console.log(
				new Date(),
				"| roblox-join-service.js |",
				"Failed to ban user:",
				userId,
				"Status:",
				response.status,
				response.data
			);


			return false;

		} catch (error) {

			console.log(
				new Date(),
				"| roblox-join-service.js |",
				"Group ban error:",
				userId,
				error.response?.status ||
					error.message
			);


			if (error.response?.data) {

				console.log(
					error.response.data
				);

			}


			return false;

		}

	}


	// ======================================
	// LOAD BLACKLIST
	// ======================================

	async function getBlacklist() {

		try {

			const snapshot =
				await db.ref("blacklist").once("value");


			return snapshot.val() || {};

		} catch (error) {

			console.log(
				new Date(),
				"| roblox-join-service.js |",
				"Failed to load blacklist:",
				error
			);


			throw error;

		}

	}


	// ======================================
	// NORMALIZE ROBLOX IDS
	// ======================================

	function getRobloxIds(value) {

		if (!value) {
			return [];
		}


		if (Array.isArray(value)) {

			return value
				.map(id => String(id).trim())
				.filter(Boolean);

		}


		return String(value)
			.split(",")
			.map(id => id.trim())
			.filter(Boolean);

	}


	// ======================================
	// CHECK BLACKLIST
	// ======================================

	async function checkBlacklist(userId) {

		const blacklist =
			await getBlacklist();


		const userBlacklist =
			blacklist.users || {};


		const groupBlacklist =
			blacklist.groups || {};


		const userIdString =
			String(userId);


		// ======================================
		// DIRECT USER BLACKLIST
		// ======================================

		for (
			const key of Object.keys(userBlacklist)
		) {

			const entry =
				userBlacklist[key];


			if (!entry) {
				continue;
			}


			const associatedAccounts =
				entry.associatedAccounts || {};


			const robloxAccounts =
				getRobloxIds(
					associatedAccounts.robloxAccounts
				);


			if (
				robloxAccounts.includes(
					userIdString
				)
			) {

				return {

					matched: true,

					permanent:
						entry.permanent === true,

					reason:
						"Blacklisted Roblox user",

					source:
						key

				};

			}

		}


		// ======================================
		// GROUP BLACKLIST
		// ======================================

		for (
			const key of Object.keys(groupBlacklist)
		) {

			const entry =
				groupBlacklist[key];


			if (!entry) {
				continue;
			}


			const groupId =
				entry.groupId;


			if (!groupId) {
				continue;
			}


			try {

				const rank =
					await noblox.getRankInGroup(
						Number(groupId),
						Number(userId)
					);


				// ======================================
				// NOT IN GROUP
				// ======================================

				if (rank === 0) {
					continue;
				}


				// ======================================
				// RANK-SPECIFIC BLACKLIST
				// ======================================

				if (
					entry.rankId !== undefined &&
					entry.rankId !== null
				) {

					if (
						Number(rank) !==
						Number(entry.rankId)
					) {

						continue;

					}

				}


				// ======================================
				// GROUP MATCH
				// ======================================

				return {

					matched: true,

					permanent:
						entry.permanent === true,

					reason:
						`Blacklisted group: ${key}`,

					source:
						key,

					groupId:
						Number(groupId),

					rank:
						Number(rank),

					rankId:
						entry.rankId !== undefined
							? Number(entry.rankId)
							: null

				};

			} catch (error) {

				console.log(
					new Date(),
					"| roblox-join-service.js |",
					"Failed to check group:",
					groupId,
					"User:",
					userId,
					error.message
				);

			}

		}


		// ======================================
		// NO MATCH
		// ======================================

		return {

			matched: false

		};

	}


	// ======================================
	// JOIN REQUEST HANDLER
	// ======================================

	const evt =
		noblox.onJoinRequestHandle(
			GROUP_ID
		);


	evt.on(
		"data",
		async function(request) {

			console.log(
				Date.now(),
				"| roblox-join-service.js |",
				"Request made..."
			);


			const userId =
				request.requester.userId;


			// ======================================
			// BLACKLIST CHECK
			// ======================================

			let blacklistMatch;


			try {

				blacklistMatch =
					await checkBlacklist(userId);

			} catch (error) {

				// ======================================
				// FAIL CLOSED
				// ======================================
				//
				// If the blacklist cannot be checked,
				// do NOT allow the user into the group.
				//

				console.log(
					new Date(),
					"| roblox-join-service.js |",
					"Blacklist check failed. Denying request:",
					userId
				);


				evt.emit(
					"handle",
					request,
					false
				);


				getUserThumbnail(
					request,
					false
				);


				return;

			}


			// ======================================
			// BLACKLISTED
			// ======================================

			if (blacklistMatch.matched) {

				console.log(
					new Date(),
					"| roblox-join-service.js |",
					"Blacklisted user detected:",
					userId,
					"|",
					blacklistMatch.reason,
					"| Permanent:",
					blacklistMatch.permanent
				);


				// ======================================
				// ALWAYS DENY JOIN REQUEST
				// ======================================

				evt.emit(
					"handle",
					request,
					false
				);


				// ======================================
				// PERMANENT BLACKLIST
				// ======================================
				//
				// Permanent blacklist:
				// deny request AND ban from Vyhalla.
				//

				if (
					blacklistMatch.permanent === true
				) {

					await banFromGroup(
						userId
					);

				}


				// ======================================
				// AUDIT
				// ======================================

				getUserThumbnail(
					request,
					false
				);


				return;

			}


			// ======================================
			// NOT BLACKLISTED
			// ======================================
			//
			// Accept the request.
			//

			evt.emit(
				"handle",
				request,
				true,
				function() {

					console.log(
						new Date(),
						"| roblox-join-service.js |",
						"Accepted!",
						userId
					);


					getUserThumbnail(
						request,
						true
					);

				}
			);

		}
	);


	// ======================================
	// USER THUMBNAIL
	// ======================================

	async function getUserThumbnail(
		request,
		status
	) {

		try {

			const response =
				await axios.get(
					`https://thumbnails.roblox.com/v1/users/avatar?userIds=${request.requester.userId}&size=720x720&format=Png&isCircular=false`
				);


			console.log(
				response.data
			);


			if (
				!response.data.data ||
				response.data.data.length === 0
			) {

				sendWebhookMessage(
					request,
					status,
					false
				);

			} else {

				const thumbnail =
					response.data.data[0].imageUrl;


				sendWebhookMessage(
					request,
					status,
					thumbnail
				);

			}

		} catch (error) {

			console.log(
				new Date(),
				"| roblox-join-service.js |",
				"Thumbnail error:",
				error.message
			);


			sendWebhookMessage(
				request,
				status,
				false
			);

		}

	}


	// ======================================
	// DISCORD AUDIT
	// ======================================

	async function sendWebhookMessage(
		request,
		status,
		thumbnail
	) {

		try {

			const vyhalla =
				await noblox.getGroup(
					GROUP_ID
				);


			const rank =
				await noblox.getRankNameInGroup(
					GROUP_ID,
					request.requester.userId
				);


			// ======================================
			// ACCEPTED
			// ======================================

			if (status === true) {

				const embed = {

					color: 65311,

					fields: [

						{

							name: "Acceptance",

							value:
								`[${request.requester.username}](https://www.roblox.com/users/${request.requester.userId}/profile) [\`\`${request.requester.userId}\`\`] has been accepted into [Vyhalla](https://www.roblox.com/communities/32498529/Vyhalla)! \nCurrent rank: \`\`${rank}\`\`\nTotal members in Vyhalla: \`\`${vyhalla.memberCount}\`\``

						}

					],

					footer: {

						text:
							"Vyhalla Public Audit",

						icon_url:
							"https://trello.com/1/cards/67add144d5afa78d7c598bc7/attachments/67add175357785742dd68e93/download/VAKC_Logo2_NO_GOLD.png"

					},

					timestamp:
						new Date(),

					thumbnail:
						thumbnail
							? {
								url: thumbnail
							}
							: undefined

				};


				await channel.send({
					embeds: [embed]
				});


				return;

			}


			// ======================================
			// REJECTED
			// ======================================

			const embed = {

				color: 16711680,

				fields: [

					{

						name: "Rejection",

						value:
							`[${request.requester.username}](https://www.roblox.com/users/${request.requester.userId}/profile) [\`\`${request.requester.userId}\`\`] has been declined into [Vyhalla](https://www.roblox.com/communities/32498529/Vyhalla)! \nCurrent rank: \`\`${rank}\`\`\nTotal members in Vyhalla: \`\`${vyhalla.memberCount}\`\``

					}

				],

				footer: {

					text:
						"Vyhalla Public Audit",

					icon_url:
						"https://trello.com/1/cards/67add144d5afa78d7c598bc7/attachments/67add175357785742dd68e93/download/VAKC_Logo2_NO_GOLD.png"

				},

				timestamp:
					new Date(),

				thumbnail:
					thumbnail
						? {
							url: thumbnail
						}
						: {
							url:
								"https://trello.com/1/cards/67add144d5afa78d7c598bc7/attachments/67add175357785742dd68e93/download/VAKC_Logo2_NO_GOLD.png"
						}

			};


			await channel.send({
				embeds: [embed]
			});


		} catch (error) {

			console.log(
				new Date(),
				"| roblox-join-service.js |",
				"Audit error:",
				error.message
			);

		}

	}

}


module.exports = RJS;