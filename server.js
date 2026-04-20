const express = require('express');
const path = require('path');
const { 
    Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, 
    PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder 
} = require('discord.js');

const app = express();
app.use(express.json());

const client = new Client({ intents: [3276799] });

// FUNÇÃO PARA REGISTRAR OS COMANDOS
async function registrarComandos(token, clientId) {
    const commands = [
        new SlashCommandBuilder()
            .setName('criar')
            .setDescription('Projeta o seu servidor personalizado')
            .addStringOption(opt => opt.setName('tema').setDescription('Descreva como você quer o servidor').setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    ].map(c => c.toJSON());

    const rest = new REST({ version: '10' }).setToken(token);
    try {
        console.log('🔄 Registrando comandos...');
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
        console.log('✅ Comandos registrados com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }
}

async function iniciarBot(token) {
    client.on('ready', () => {
        console.log(`✅ Arquiteto Online como: ${client.user.tag}`);
    });

    client.on('interactionCreate', async (i) => {
        if (i.isChatInputCommand() && i.commandName === 'criar') {
            const tema = i.options.getString('tema');
            const embed = new EmbedBuilder()
                .setTitle("🏗️ Projeto do Servidor")
                .setDescription(`Você quer um servidor de: **${tema}**\n\n**O que eu vou fazer:**\n• Apagar tudo e criar novos canais\n• Criar categorias estilizadas com emojis\n• Configurar cargos administrativos\n\n**Deseja iniciar a construção?**`)
                .setColor("#00ff6a");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('sim').setLabel('Sim, Criar!').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('nao').setLabel('Não, Cancelar').setStyle(ButtonStyle.Danger)
            );

            await i.reply({ embeds: [embed], components: [row], ephemeral: true });
        }

        if (i.isButton()) {
            if (i.customId === 'nao') return i.update({ content: "❌ Cancelado.", embeds: [], components: [] });

            if (i.customId === 'sim') {
                const temaOriginal = i.message.embeds[0].description.split('**')[1];
                await i.update({ content: "🚧 **Construindo... Por favor, aguarde.**", embeds: [], components: [] });

                try {
                    const guild = i.guild;
                    const channels = await guild.channels.fetch();
                    for (const c of channels.values()) await c.delete().catch(() => {});

                    const cat1 = await guild.channels.create({ name: '───  📌 INFORMAÇÕES  ───', type: ChannelType.GuildCategory });
                    await guild.channels.create({ name: '📢┃anúncios', parent: cat1.id });
                    await guild.channels.create({ name: '📜┃regras', parent: cat1.id });

                    const cat2 = await guild.channels.create({ name: `───  ✨ ${temaOriginal.toUpperCase()}  ───`, type: ChannelType.GuildCategory });
                    await guild.channels.create({ name: `💬┃chat-geral`, parent: cat2.id });
                    await guild.channels.create({ name: `📦┃produtos`, parent: cat2.id });

                    const cat3 = await guild.channels.create({ name: '───  🎫 SUPORTE  ───', type: ChannelType.GuildCategory });
                    await guild.channels.create({ name: '🎟️┃abrir-ticket', parent: cat3.id });

                    await i.followUp({ content: "✅ **Servidor construído com sucesso!**", ephemeral: true });
                } catch (e) {
                    console.log(e);
                }
            }
        }
    });

    await client.login(token);
    // Registra os comandos assim que o bot loga
    await registrarComandos(token, client.user.id);
}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/ligar-bot', async (req, res) => {
    try {
        await iniciarBot(req.body.token);
        res.send({ msg: "OK" });
    } catch (e) {
        res.send({ msg: "ERRO" });
    }
});

app.listen(process.env.PORT || 3000, '0.0.0.0');
