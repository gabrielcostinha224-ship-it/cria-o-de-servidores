const express = require('express');
const path = require('path');
const { 
    Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, 
    PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder 
} = require('discord.js');

const app = express();
app.use(express.json());

const client = new Client({ intents: [3276799] });

async function iniciarBot(token) {
    client.on('ready', async () => {
        const commands = [
            new SlashCommandBuilder()
                .setName('criar')
                .setDescription('Projeta o seu servidor personalizado')
                .addStringOption(opt => opt.setName('tema').setDescription('Descreva como você quer o servidor').setRequired(true))
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        ].map(c => c.toJSON());

        const rest = new REST({ version: '10' }).setToken(token);
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log(`✅ Arquiteto com Confirmação Online!`);
    });

    client.on('interactionCreate', async (i) => {
        if (i.isChatInputCommand() && i.commandName === 'criar') {
            const tema = i.options.getString('tema');

            const embed = new EmbedBuilder()
                .setTitle("🏗️ Projeto do Servidor")
                .setDescription(`Você quer um servidor de: **${tema}**\n\n**O que eu vou criar:**\n• 5 Categorias estilizadas\n• 12 Canais com emojis\n• Cargos coloridos (Dono, Staff, VIP)\n• Permissões configuradas\n\n**⚠️ Atenção:** Vou apagar os canais atuais para construir o novo.`)
                .setColor("#00ff6a")
                .setFooter({ text: "Deseja iniciar a construção?" });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('sim').setLabel('Sim, pode criar!').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('nao').setLabel('Não, quero mudar').setStyle(ButtonStyle.Danger)
            );

            await i.reply({ embeds: [embed], components: [row], ephemeral: true });
        }

        if (i.isButton()) {
            if (i.customId === 'nao') {
                return i.reply({ content: "❌ **Operação cancelada.** Use `/criar` novamente e descreva o novo tema que você deseja!", ephemeral: true });
            }

            if (i.customId === 'sim') {
                // Pega o tema direto da mensagem anterior (embed)
                const temaOriginal = i.message.embeds[0].description.split('**')[1];
                await i.update({ content: "🚧 **Construindo... Isso pode levar alguns segundos.**", embeds: [], components: [] });

                const guild = i.guild;
                try {
                    // 1. Limpeza Total
                    const channels = await guild.channels.fetch();
                    for (const c of channels.values()) await c.delete().catch(() => {});

                    // 2. Criar Cargos
                    await guild.roles.create({ name: '👑 Direção', color: '#ff0000', permissions: [PermissionFlagsBits.Administrator] });
                    await guild.roles.create({ name: '🛡️ Moderação', color: '#00ccff' });

                    // 3. Criar Estrutura Estilizada
                    const cat1 = await guild.channels.create({ name: '───  📌 INFORMAÇÕES  ───', type: ChannelType.GuildCategory });
                    await guild.channels.create({ name: '📢┃anúncios', parent: cat1.id });
                    await guild.channels.create({ name: '📜┃regras', parent: cat1.id });

                    const cat2 = await guild.channels.create({ name: `───  ✨ ${temaOriginal.toUpperCase()}  ───`, type: ChannelType.GuildCategory });
                    await guild.channels.create({ name: `💬┃chat-geral`, parent: cat2.id });
                    await guild.channels.create({ name: `📦┃produtos`, parent: cat2.id });

                    const cat3 = await guild.channels.create({ name: '───  🎫 SUPORTE  ───', type: ChannelType.GuildCategory });
                    await guild.channels.create({ name: '🎟️┃abrir-ticket', parent: cat3.id });

                    const cat4 = await guild.channels.create({ name: '───  🔊 VOZ  ───', type: ChannelType.GuildCategory });
                    await guild.channels.create({ name: '🗣️┃Geral', type: ChannelType.GuildVoice, parent: cat4.id });

                    console.log("Servidor criado com sucesso!");
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });

    await client.login(token);
}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.post('/ligar-bot', async (req, res) => {
    iniciarBot(req.body.token).catch(() => {});
    res.send({ msg: "OK" });
});

app.listen(process.env.PORT || 3000, '0.0.0.0');
