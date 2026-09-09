const express = require('express');
const server = express();

server.all('/', (req, res) => {
	res.send('Welcome to the Roblox Verification API! This is not a website, but an API.')
})

server.get('/redirect', async ( req, res ) => {
    res.send(`In Testing :)`)
});

function keepAlive(){
    server.listen(3000, ()=>{console.log(new Date(),
					"| server.js |","Server is Ready!")});
}

module.exports = keepAlive;
