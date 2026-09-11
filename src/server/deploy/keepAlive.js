const express = require("express");
const path = require("path");
const axios = require("axios");

const server = express();

const {
    logUpdateVerify,
    logToRoblox
} = require("../../util/verify-logger.js");


// ======================================================
// CONFIGURATION
// ======================================================

const PORT = process.env.PORT || 3000;

const ROBLOX_AUTHORIZE_URL =
    "https://apis.roblox.com/oauth/v1/authorize";

const ROBLOX_TOKEN_URL =
    "https://apis.roblox.com/oauth/v1/token";

const ROBLOX_USERINFO_URL =
    "https://apis.roblox.com/oauth/v1/userinfo";


// ======================================================
// KEEP ALIVE
// ======================================================

function keepAlive(
    client,
    noblox,
    currentUser,
    admin,
    token,
    applicationid,
    prefix
) {

    // ==================================================
    // SERVE WEBSITE FILES
    // ==================================================

    server.use(
        express.static(
            path.join(__dirname, "public")
        )
    );


    // ==================================================
    // HOME / VERIFICATION PAGE
    // ==================================================

    server.get("/", async (req, res) => {

        const state = req.query.state;


        // ----------------------------------------------
        // NORMAL VISITOR
        // ----------------------------------------------

        if (!state) {

            return res.sendFile(
                path.join(
                    __dirname,
                    "public",
                    "index.html"
                )
            );

        }


        const db =
            admin.database();


        try {

            // ------------------------------------------
            // FIND VERIFICATION SESSION
            // ------------------------------------------

            const snapshot =
                await db
                    .ref(
                        "system/user_verification"
                    )
                    .orderByChild(
                        "statecode"
                    )
                    .equalTo(
                        state
                    )
                    .limitToFirst(1)
                    .get();


            if (!snapshot.exists()) {

                return res
                    .status(400)
                    .send(
                        "Invalid or expired verification session."
                    );

            }


            // ------------------------------------------
            // READ HTML
            // ------------------------------------------

            const fs =
                require("fs");


            let html =
                await fs.promises.readFile(
                    path.join(
                        __dirname,
                        "public",
                        "index.html"
                    ),
                    "utf8"
                );


            // ------------------------------------------
            // INSERT STATE INTO ROBLOX BUTTON
            // ------------------------------------------

            const oauthURL =
                `/oauth/roblox?state=${encodeURIComponent(state)}`;


            html =
                html.replace(
                    'href="/oauth/roblox"',
                    `href="${oauthURL}"`
                );


            return res.send(
                html
            );


        } catch (error) {

            console.error(
                "Home page error:",
                error
            );


            return res
                .status(500)
                .send(
                    "Unable to load verification page."
                );

        }

    });


    // ==================================================
    // START ROBLOX OAUTH
    // ==================================================

    server.get(
        "/oauth/roblox",
        async (req, res) => {

            const state =
                req.query.state;


            // ------------------------------------------
            // CHECK STATE
            // ------------------------------------------

            if (!state) {

                return res
                    .status(400)
                    .send(
                        "Missing verification state."
                    );

            }


            const db =
                admin.database();


            try {

                // --------------------------------------
                // FIND VERIFICATION RECORD
                // --------------------------------------

                const snapshot =
                    await db
                        .ref(
                            "system/user_verification"
                        )
                        .orderByChild(
                            "statecode"
                        )
                        .equalTo(
                            state
                        )
                        .limitToFirst(1)
                        .get();


                if (!snapshot.exists()) {

                    return res
                        .status(400)
                        .send(
                            "Invalid or expired verification session."
                        );

                }


                // --------------------------------------
                // GET RECORD
                // --------------------------------------

                const [
                    key,
                    data
                ] =
                    Object.entries(
                        snapshot.val()
                    )[0];


                // --------------------------------------
                // PREVENT REUSE
                // --------------------------------------

                if (
                    data.verified === true
                ) {

                    return res
                        .status(400)
                        .send(
                            "This verification session has already been completed."
                        );

                }


                // --------------------------------------
                // BUILD ROBLOX AUTH URL
                // --------------------------------------

                const params =
                    new URLSearchParams({

                        client_id:
                            process.env
                                .ROBLOX_OAUTH2_CLIENTID,

                        response_type:
                            "code",

                        redirect_uri:
                            process.env
                                .ROBLOX_OAUTH2_REDIRECT_URI,

                        scope:
                            "openid profile",

                        state:
                            state

                    });


                const authorizationURL =
                    `${ROBLOX_AUTHORIZE_URL}?${params.toString()}`;


                // --------------------------------------
                // REDIRECT TO ROBLOX
                // --------------------------------------

                return res.redirect(
                    authorizationURL
                );


            } catch (error) {

                console.error(
                    "Roblox OAuth start error:",
                    error
                );


                return res
                    .status(500)
                    .send(
                        "Unable to start Roblox authentication."
                    );

            }

        }
    );


    // ==================================================
    // ROBLOX OAUTH CALLBACK
    // ==================================================

    server.get(
        "/redirect",
        async (req, res) => {

            const {
                code,
                state,
                error,
                error_description
            } = req.query;


            // ------------------------------------------
            // ROBLOX OAUTH ERROR
            // ------------------------------------------

            if (error) {

                console.warn(
                    "Roblox OAuth error:",
                    error,
                    error_description || ""
                );


                return res
                    .status(400)
                    .send(
                        "Roblox authentication was cancelled or failed."
                    );

            }


            // ------------------------------------------
            // CHECK PARAMETERS
            // ------------------------------------------

            if (!code || !state) {

                return res
                    .status(400)
                    .send(
                        "Missing OAuth code or state."
                    );

            }


            const db =
                admin.database();


            try {

                // ======================================
                // FIND VERIFICATION RECORD
                // ======================================

                const snapshot =
                    await db
                        .ref(
                            "system/user_verification"
                        )
                        .orderByChild(
                            "statecode"
                        )
                        .equalTo(
                            state
                        )
                        .limitToFirst(1)
                        .get();


                if (!snapshot.exists()) {

                    return res
                        .status(404)
                        .send(
                            "Invalid or expired verification state."
                        );

                }


                // ======================================
                // GET FIREBASE RECORD
                // ======================================

                const [
                    key,
                    data
                ] =
                    Object.entries(
                        snapshot.val()
                    )[0];


                // ======================================
                // CHECK SESSION
                // ======================================

                if (
                    data.verified === true
                ) {

                    return res
                        .status(400)
                        .send(
                            "This verification session has already been completed."
                        );

                }


                // ======================================
                // GET DISCORD USER
                // ======================================

                const user =
                    data.discordID
                        ? await client.users
                            .fetch(
                                data.discordID
                            )
                            .catch(
                                () => null
                            )
                        : null;


                // --------------------------------------
                // DISCORD USER IS REQUIRED FOR THE
                // EXISTING DISCORD NICKNAME/LOG SYSTEM
                // --------------------------------------

                if (!user) {

                    return res
                        .status(404)
                        .send(
                            "Discord user could not be found."
                        );

                }


                // ======================================
                // EXCHANGE CODE FOR ACCESS TOKEN
                // ======================================

                const params =
                    new URLSearchParams();


                params.append(
                    "client_id",
                    process.env
                        .ROBLOX_OAUTH2_CLIENTID
                );


                params.append(
                    "client_secret",
                    process.env
                        .ROBLOX_OAUTH2_SECRET
                );


                params.append(
                    "grant_type",
                    "authorization_code"
                );


                params.append(
                    "code",
                    code
                );


                params.append(
                    "redirect_uri",
                    process.env
                        .ROBLOX_OAUTH2_REDIRECT_URI
                );


                let tokenResponse;


                try {

                    tokenResponse =
                        await axios.post(
                            ROBLOX_TOKEN_URL,
                            params,
                            {
                                headers: {
                                    "Content-Type":
                                        "application/x-www-form-urlencoded"
                                }
                            }
                        );


                } catch (error) {

                    console.error(
                        "Roblox token exchange failed:",
                        error.response?.data ||
                        error.message
                    );


                    return res
                        .status(400)
                        .send(
                            "Failed to authenticate with Roblox."
                        );

                }


                // ======================================
                // GET ACCESS TOKEN
                // ======================================

                const access_token =
                    tokenResponse
                        .data
                        .access_token;


                if (!access_token) {

                    console.error(
                        "No Roblox access token returned:",
                        tokenResponse.data
                    );


                    return res
                        .status(400)
                        .send(
                            "Roblox did not return an access token."
                        );

                }


                // ======================================
                // GET ROBLOX USER INFORMATION
                // ======================================

                const userInfoResponse =
                    await fetch(
                        ROBLOX_USERINFO_URL,
                        {
                            method: "GET",

                            headers: {
                                Authorization:
                                    `Bearer ${access_token}`
                            }
                        }
                    );


                if (!userInfoResponse.ok) {

                    const errorText =
                        await userInfoResponse.text();


                    console.error(
                        "Roblox userinfo failed:",
                        userInfoResponse.status,
                        errorText
                    );


                    return res
                        .status(400)
                        .send(
                            "Failed to retrieve Roblox account information."
                        );

                }


                const userInfo =
                    await userInfoResponse.json();


                // ======================================
                // CHECK ROBLOX ACCOUNT
                // ======================================

                if (!userInfo.sub) {

                    console.error(
                        "Roblox userinfo missing sub:",
                        userInfo
                    );


                    return res
                        .status(400)
                        .send(
                            "Roblox account information was incomplete."
                        );

                }


                // ======================================
                // ROBLOX INFORMATION
                // ======================================

                const robloxID =
                    String(
                        userInfo.sub
                    );


                const robloxUsername =
                    userInfo.preferred_username ||
                    userInfo.name ||
                    "Unknown";


                const robloxDisplayName =
                    userInfo.name ||
                    null;


                const robloxProfile =
                    userInfo.profile ||
                    null;


                // ======================================
                // UPDATE FIREBASE
                // ======================================

                await db
                    .ref(
                        "system/user_verification"
                    )
                    .child(
                        key
                    )
                    .update({

                        verified:
                            true,

                        robloxID:
                            robloxID,

                        robloxUsername:
                            robloxUsername,

                        robloxDisplayName:
                            robloxDisplayName,

                        robloxProfile:
                            robloxProfile,

                        statecode:
                            null,

                        verifiedAt:
                            Date.now()

                    });


                // ======================================
                // LOG TO ROBLOX
                // ======================================
                //
                // THIS IS WHERE logToRoblox GOES.
                //
                // The Roblox account has now been
                // successfully authenticated.
                //
                // Adjust the arguments here if your
                // logToRoblox function uses a different
                // signature.
                // ======================================

                try {

                    await logUpdateVerify(
                        noblox,
                        currentUser,
                        {
                            discordID:
                                user.id,

                            discordUsername:
                                user.username,

                            robloxID:
                                robloxID,

                            robloxUsername:
                                robloxUsername,

                            robloxDisplayName:
                                robloxDisplayName,

                            robloxProfile:
                                robloxProfile
                        }
                    );


                } catch (error) {

                    console.error(
                        "logUpdateVerify failed:",
                        error
                    );

                }


                // ======================================
                // GET DISCORD GUILD
                // ======================================

                const guild =
                    client.guilds.cache.get(
                        data.verificationGuildID
                    );


                let nicknameUpdated =
                    false;


                // ======================================
                // UPDATE DISCORD NICKNAME
                // ======================================

                if (guild) {

                    const member =
                        await guild.members
                            .fetch(
                                user.id
                            )
                            .catch(
                                () => null
                            );


                    if (
                        member &&
                        member.id !== guild.ownerId
                    ) {

                        try {

                            await member.setNickname(
                                robloxUsername
                            );


                            nicknameUpdated =
                                true;


                        } catch (error) {

                            console.warn(
                                "Could not update Discord nickname:",
                                error
                            );

                        }

                    }


                    // ==================================
                    // LOG DISCORD VERIFICATION
                    // ==================================

                    try {

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
                                    robloxUsername,

                                robloxId:
                                    robloxID,

                                nicknameChanged:
                                    nicknameUpdated

                            }
                        );


                    } catch (error) {

                        console.error(
                            "logUpdateVerify failed:",
                            error
                        );

                    }

                }


                // ======================================
                // SUCCESS
                // ======================================

                return res
                    .status(200)
                    .send(`

                        <!DOCTYPE html>

                        <html lang="en">

                        <head>

                            <meta charset="UTF-8">

                            <meta
                                name="viewport"
                                content="width=device-width, initial-scale=1.0"
                            >

                            <title>
                                Verification Successful
                            </title>

                            <style>

                                * {
                                    box-sizing: border-box;
                                }

                                html,
                                body {
                                    margin: 0;
                                    padding: 0;
                                }

                                body {

                                    min-height: 100vh;

                                    background:
                                        #100b09;

                                    color:
                                        white;

                                    font-family:
                                        Arial,
                                        Helvetica,
                                        sans-serif;

                                    display:
                                        flex;

                                    justify-content:
                                        center;

                                    align-items:
                                        center;

                                    text-align:
                                        center;

                                    padding:
                                        20px;
                                }

                                .success {

                                    max-width:
                                        600px;
                                }

                                h1 {

                                    margin-bottom:
                                        10px;
                                }

                                h1 span {

                                    color:
                                        #d47e66;
                                }

                                p {

                                    font-size:
                                        18px;
                                }

                                .username {

                                    font-weight:
                                        bold;
                                }

                            </style>

                        </head>

                        <body>

                            <div class="success">

                                <h1>
                                    Verification
                                    <span>Successful</span>
                                </h1>

                                <p>
                                    Your Roblox account has been
                                    successfully verified.
                                </p>

                                <p class="username">
                                    Roblox:
                                    ${escapeHtml(
                                        robloxUsername
                                    )}
                                </p>

                                <p>
                                    You may close this tab now.
                                </p>

                            </div>

                        </body>

                        </html>

                    `);


            } catch (error) {

                console.error(
                    "Verification error:",
                    error
                );


                return res
                    .status(500)
                    .send(
                        "An error occurred while verifying your account."
                    );

            }

        }
    );


    // ==================================================
    // 404
    // ==================================================

    server.use(
        (req, res) => {

            return res
                .status(404)
                .send(
                    "Page not found."
                );

        }
    );


    // ==================================================
    // START SERVER
    // ==================================================

    server.listen(
        PORT,
        () => {

            console.log(
                new Date(),
                "| server.js |",
                `Server is Ready on port ${PORT}!`
            );

        }
    );

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ======================================================
// EXPORT
// ======================================================

module.exports = keepAlive;