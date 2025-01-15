module.exports = {
    name: 'smol girl dinner sandwich',
    aliases: [],
    execute(message) {
        return message.reply(`<@` + message.author.id  + `> my smol subway order.\n\n1. Spicy Italian Meat\n2. Italian Herbs & Cheese Bread\n3. Provolone Cheese\n4. [Toasted]\n5. Lettuce\n6. Banana Peppers\n7. Pickles\n8. Mayo`)
    }
}