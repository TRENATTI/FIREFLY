// ==========================================
// SYSTEM CACHE
// ==========================================
//
// This cache stores Firebase configuration
// in memory so we don't need to read Firebase
// every time somebody runs /update.
//
// Cache lifetime:
// 60 seconds
//
// Bind/unbind commands invalidate the cache
// immediately, so configuration changes take
// effect without waiting for the cache to expire.
// ==========================================

const CACHE_TTL = 60 * 1000;


// ==========================================
// CACHE STORAGE
// ==========================================

const cache = {
    roleBindings: new Map(),
    logChannels: new Map()
};


// ==========================================
// ROLE BINDING CACHE
// ==========================================

async function getRoleBindings(admin, guildId) {

    const now = Date.now();

    const cached =
        cache.roleBindings.get(guildId);


    // ------------------------------------------
    // RETURN CACHE IF STILL VALID
    // ------------------------------------------

    if (
        cached &&
        now - cached.timestamp < CACHE_TTL
    ) {
        return cached.data;
    }


    // ------------------------------------------
    // LOAD FROM FIREBASE
    // ------------------------------------------

    const db = admin.database();

    const snapshot = await db
        .ref("system")
        .child("role_bindings")
        .child(guildId)
        .get();


    const data =
        snapshot.exists()
            ? snapshot.val()
            : {};


    // ------------------------------------------
    // SAVE TO CACHE
    // ------------------------------------------

    cache.roleBindings.set(
        guildId,
        {
            data: data,
            timestamp: now
        }
    );


    return data;
}


// ==========================================
// INVALIDATE ROLE BINDINGS
// ==========================================

function invalidateRoleBindings(guildId) {

    cache.roleBindings.delete(guildId);

}


// ==========================================
// LOG CHANNEL CACHE
// ==========================================

async function getLogChannel(admin, guildId) {

    const now = Date.now();

    const cached =
        cache.logChannels.get(guildId);


    // ------------------------------------------
    // RETURN CACHE IF STILL VALID
    // ------------------------------------------

    if (
        cached &&
        now - cached.timestamp < CACHE_TTL
    ) {
        return cached.data;
    }


    // ------------------------------------------
    // LOAD FROM FIREBASE
    // ------------------------------------------

    const db = admin.database();

    const snapshot = await db
        .ref("system")
        .child("log_channels")
        .child(guildId)
        .child("updateVerify")
        .get();


    const data =
        snapshot.exists()
            ? snapshot.val()
            : null;


    // ------------------------------------------
    // SAVE TO CACHE
    // ------------------------------------------

    cache.logChannels.set(
        guildId,
        {
            data: data,
            timestamp: now
        }
    );


    return data;
}


// ==========================================
// INVALIDATE LOG CHANNEL
// ==========================================

function invalidateLogChannel(guildId) {

    cache.logChannels.delete(guildId);

}


// ==========================================
// CLEAR EVERYTHING
// ==========================================

function clearCache() {

    cache.roleBindings.clear();
    cache.logChannels.clear();

}


// ==========================================
// EXPORT
// ==========================================

module.exports = {
    getRoleBindings,
    invalidateRoleBindings,

    getLogChannel,
    invalidateLogChannel,

    clearCache
};
