import 'dotenv/config';
import { Client, GatewayIntentBits, AttachmentBuilder } from 'discord.js';
import { pdf } from 'pdf-to-img';
import libre from 'libreoffice-convert';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const convertAsync = promisify(libre.convert);

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
        const fileName = attachment.name.toLowerCase();
        
        // サポートするファイル形式をチェック
        const supportedFormats = ['.pdf', '.docx', '.doc', '.pptx', '.ppt'];
        const isSupported = supportedFormats.some(format => fileName.endsWith(format));
        
        if (isSupported) {
            try {
                await message.react('⏳');
                
                const response = await fetch(attachment.url);
                const buffer = await response.arrayBuffer();
                const originalExt = path.extname(attachment.name);
                const tempFilePath = path.join(tempDir, `temp_${Date.now()}${originalExt}`);
                
                fs.writeFileSync(tempFilePath, Buffer.from(buffer));
                
                let pdfPath = tempFilePath;
                
                // PDF以外の場合は、まずPDFに変換
                if (!fileName.endsWith('.pdf')) {
                    try {
                        const fileBuffer = fs.readFileSync(tempFilePath);
                        const pdfBuffer = await convertAsync(fileBuffer, '.pdf', undefined);
                        pdfPath = path.join(tempDir, `converted_${Date.now()}.pdf`);
                        fs.writeFileSync(pdfPath, pdfBuffer);
                        
                        // 元のファイルを削除
                        fs.unlinkSync(tempFilePath);
                    } catch (convertError) {
                        console.error('LibreOffice変換エラー:', convertError);
                        await message.reactions.removeAll();
                        await message.react('❌');
                        fs.unlinkSync(tempFilePath);
                        return;
                    }
                }
                
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
                    await message.reactions.removeAll();
                    await message.react('✅');
                    
                    // 新しいスレッドを作成
                    const thread = await message.startThread({
                        name: `変換結果 - ${attachment.name}`,
                        autoArchiveDuration: 60, // 1時間で自動アーカイブ
                        reason: 'ファイル画像変換結果'
                    });
                    
                    const maxFilesPerMessage = 10;
                    for (let i = 0; i < images.length; i += maxFilesPerMessage) {
                        const batch = images.slice(i, i + maxFilesPerMessage);
                        
                        await thread.send({
                            files: batch.map(img => img.attachment)
                        });
                    }
                } else {
                    await message.reactions.removeAll();
                    await message.react('❌');
                }
                
                // 一時ファイルの削除
                if (fs.existsSync(pdfPath)) {
                    fs.unlinkSync(pdfPath);
                }
                images.forEach(img => {
                    if (fs.existsSync(img.path)) {
                        fs.unlinkSync(img.path);
                    }
                });
                
            } catch (error) {
                console.error('ファイル変換エラー:', error);
                await message.reactions.removeAll();
                await message.react('❌');
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