import 'dotenv/config';
import { Client, GatewayIntentBits, AttachmentBuilder } from 'discord.js';
import { pdf } from 'pdf-to-img';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.attachments.size > 0) {
        const attachment = message.attachments.first();
        
        if (attachment.name.toLowerCase().endsWith('.pdf')) {
            try {
                await message.reply('📄 PDFを画像に変換中...');
                
                const response = await fetch(attachment.url);
                const buffer = await response.arrayBuffer();
                const pdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
                
                fs.writeFileSync(pdfPath, Buffer.from(buffer));
                
                const pdfDocument = await pdf(pdfPath, {
                    scale: 2.0
                });
                
                const images = [];
                let pageIndex = 1;
                
                for await (const imageBuffer of pdfDocument) {
                    const imagePath = path.join(tempDir, `page_${Date.now()}_${pageIndex}.png`);
                    fs.writeFileSync(imagePath, imageBuffer);
                    
                    const attachment = new AttachmentBuilder(imagePath, {
                        name: `page_${pageIndex}.png`
                    });
                    images.push({ attachment, path: imagePath });
                    pageIndex++;
                }
                
                if (images.length > 0) {
                    await message.reply({
                        content: `✅ PDFを${images.length}枚の画像に変換しました！`,
                        files: images.map(img => img.attachment)
                    });
                } else {
                    await message.reply('❌ 画像の変換に失敗しました。');
                }
                
                fs.unlinkSync(pdfPath);
                images.forEach(img => {
                    if (fs.existsSync(img.path)) {
                        fs.unlinkSync(img.path);
                    }
                });
                
            } catch (error) {
                console.error('PDF変換エラー:', error);
                await message.reply('❌ PDF変換中にエラーが発生しました。');
            }
        }
    }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('DISCORD_TOKENが設定されていません。環境変数を設定してください。');
    process.exit(1);
}

client.login(token);