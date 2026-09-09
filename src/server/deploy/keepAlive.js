const express = require('express');
const server = express();
const axios = require("axios");

const {
    logUpdateVerify
} = require("../../util/verify-logger.js");


function keepAlive(
    client,
    noblox,
    currentUser,
    admin,
    token,
    applicationid,
    prefix
) {

    server.listen(3000, () => {
        console.log(
            new Date(),
            "| server.js |",
            "Server is Ready!"
        );
    });


    server.all('/', (req, res) => {
        res.send(
            'Welcome to the Roblox Verification API! This is not a website, but an API.'
        );
    });


    server.get('/redirect', async (req, res) => {

        const code = req.query.code;
        const state = req.query.state;


        // ==========================================
        // CHECK OAUTH PARAMETERS
        // ==========================================

        if (!code || !state) {
            return res
                .status(400)
                .send(
                    'Missing OAuth code or state.'
                );
        }


        const db = admin.database();


        try {

            // ==========================================
            // FIND VERIFICATION RECORD
            // ==========================================

            const snapshot = await db
                .ref("system/user_verification")
                .orderByChild("statecode")
                .equalTo(state)
                .limitToFirst(1)
                .get();


            if (!snapshot.exists()) {
                return res
                    .status(404)
                    .send(
                        'Invalid or expired verification state.'
                    );
            }


            // ==========================================
            // GET FIREBASE RECORD
            // ==========================================

            const [key, data] =
                Object.entries(snapshot.val())[0];


            // ==========================================
            // GET DISCORD USER
            // ==========================================

            const user = await client.users
                .fetch(data.discordID)
                .catch(() => null);


            if (!user) {
                return res
                    .status(404)
                    .send(
                        'Discord user could not be found.'
                    );
            }


            // ==========================================
            // EXCHANGE OAUTH CODE FOR ACCESS TOKEN
            // ==========================================

            const params = new URLSearchParams();


            params.append(
                "client_id",
                process.env.ROBLOX_OAUTH2_CLIENTID
            );


            params.append(
                "client_secret",
                process.env.ROBLOX_OAUTH2_SECRET
            );


            params.append(
                "grant_type",
                "authorization_code"
            );


            params.append(
                "code",
                code
            );


            const response = await axios.post(
                "https://apis.roblox.com/oauth/v1/token",
                params,
                {
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    }
                }
            );


            if (response.status !== 200) {
                return res
                    .status(400)
                    .send(
                        'Failed to authenticate with Roblox.'
                    );
            }


            const access_token =
                response.data.access_token;


            // ==========================================
            // GET ROBLOX USER INFORMATION
            // ==========================================

            const userInfoResponse = await fetch(
                "https://apis.roblox.com/oauth/v1/userinfo",
                {
                    headers: {
                        Authorization:
                            `Bearer ${access_token}`
                    }
                }
            );


            if (!userInfoResponse.ok) {
                return res
                    .status(400)
                    .send(
                        'Failed to retrieve Roblox account information.'
                    );
            }


            const userInfo =
                await userInfoResponse.json();


            // ==========================================
            // UPDATE FIREBASE VERIFICATION RECORD
            // ==========================================

            await db
                .ref("system/user_verification")
                .child(key)
                .update({
                    verified: true,
                    robloxID: userInfo.sub,
                    robloxUsername:
                        userInfo.preferred_username,
                    statecode: null
                });


            // ==========================================
            // GET DISCORD GUILD
            // ==========================================

            const guild =
                client.guilds.cache.get(
                    data.verificationGuildID
                );


            let nicknameUpdated = false;


            // ==========================================
            // UPDATE DISCORD NICKNAME
            // ==========================================

            if (guild) {

                const member =
                    await guild.members
                        .fetch(user.id)
                        .catch(() => null);


                if (
                    member &&
                    member.id !== guild.ownerId
                ) {

                    try {

                        await member.setNickname(
                            userInfo.preferred_username
                        );

                        nicknameUpdated = true;

                    } catch (error) {

                        console.warn(
                            "Could not update Discord nickname:",
                            error
                        );

                    }

                }


                // ==========================================
                // LOG VERIFICATION
                //
                // This ONLY logs the verification.
                // It does NOT update Discord roles.
                // ==========================================

                await logUpdateVerify(
                    client,
                    admin,
                    {
                        guildId:
                            guild.id,

                        type:
                            "verify",

                        discordUser:
                            user.id,

                        robloxUsername:
                            userInfo.preferred_username,

                        robloxId:
                            userInfo.sub,

                        nicknameChanged:
                            nicknameUpdated
                    }
                );

            }


            // ==========================================
            // SEND SUCCESS RESPONSE
            // ==========================================

            return res
                .status(200)
                .send(
                    'Successfully verified! You may close this tab now.'
                );


        } catch (error) {

            console.error(
                "Verification error:",
                error
            );


            // ==========================================
            // ERROR RESPONSE
            // ==========================================

            return res
                .status(500)
                .send(
                    'An error occurred while verifying your account.'
                );

        }

    });

}


module.exports = keepAlive;
