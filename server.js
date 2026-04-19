const express = require('express');
const path = require('path');
const { 
    Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, 
    PermissionFlagsBits, ChannelType 
} = require('discord.js');

const app = express();
app.use(express.json());

const client = new Client({ intents: [3276799] });

async function iniciarBot(token) {
    client.on('ready', async () => {
        const commands = [
            new SlashCommandBuilder()
                .setName('criar')
                .setDescription('Cria um servidor personalizado')
                .addStringOption(opt => opt.setName('tema').setDescription('Ex: Loja de Skins, Servidor de RP, Grupo de Estudos...').setRequired(true))
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        ].map(c => c.toJSON());

        const rest = new REST({ version: '10' }).setToken(token);
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log(`✅ Arquiteto Online!`);
    });

    client.on('interactionCreate', async (i) => {
        if (!i.isChatInputCommand()) return;

        if (i.commandName === 'criar') {
            const tema = i.options.getString('tema').toLowerCase();
            await i.reply({ content: `🛠️ **Entendido! Criando um servidor focado em: "${tema}"...**`, ephemeral: true });

            const guild = i.guild;

            try {
                // Limpeza
                const channels = await guild.channels.fetch();
                for (const c of channels.values()) await c.delete().catch(() => {});

                // Lógica de Personalização de Canais baseada no tema
                let canalLoja = "🛒-vendas";
                let canalPrincipal = "💬-chat-geral";
                let categoriaExtra = "📦-PRODUTOS";

                if (tema.includes("rp") || tema.includes("roleplay")) {
                    canalLoja = "💳-donates";
                    canalPrincipal = "📻-radio-cidade";
                    categoriaExtra = "🚔-POLICIA-E-MEDICOS";
                } else if (tema.includes("estudo") || tema.includes("escola")) {
                    canalLoja = "📚-biblioteca";
                    canalPrincipal = "✍️-tirar-duvidas";
                    categoriaExtra = "📖-MATERIAS";
                } else if (tema.includes("game") || tema.includes("jogo")) {
                    canalLoja = "🎮-torneios";
                    canalPrincipal = "🕹️-lobby";
                    categoriaExtra = "🏆-RANKING";
                }

                // 1. Cargos
                const admin = await guild.roles.create({ name: '👑 Direção', color: '#ff0000', permissions: [PermissionFlagsBits.Administrator] });
                const mod = await guild.roles.create({ name: '🛡️ Moderação', color: '#00ccff' });
                const seguidor = await guild.roles.create({ name: '⭐ VIP', color: '#f1c40f' });

                // 2. Categorias e Canais
                const cat1 = await guild.channels.create({ name: '📌 — INFORMAÇÕES', type: ChannelType.GuildCategory });
                await guild.channels.create({ name: '📢-anuncios', parent: cat1.id });
                await guild.channels.create({ name: '📜-regras', parent: cat1.id });

                const cat2 = await guild.channels.create({ name: `✨ — ${tema.toUpperCase()}`, type: ChannelType.GuildCategory });
                await guild.channels.create({ name: canalPrincipal, parent: cat2.id });
                await guild.channels.create({ name: canalLoja, parent: cat2.id });

                const cat3 = await guild.channels.create({ name: categoriaExtra, type: ChannelType.GuildCategory });
                await guild.channels.create({ name: '📂-arquivos', parent: cat3.id });
                await guild.channels.create({ name: '🔊-voz-comunidade', type: ChannelType.GuildVoice, parent: cat3.id });

                await i.followUp({ content: `✅ **Pronto! Servidor de ${tema} finalizado com cargos e canais específicos.**`, ephemeral: true });

            } catch (e) {
                console.log(e);
                await i.followUp({ content: "❌ Erro. Verifique se meu cargo está no topo!", ephemeral: true });
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
