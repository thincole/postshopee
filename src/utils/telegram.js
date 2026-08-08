const axios = require('axios');
const Config = require('../models/config.model');
const VideoTask = require('../models/video.model');

async function sendTelegramMessage(text, replyMarkup = null) {
    try {
        const { telegram_token, telegram_chat_id } = await Config.getTelegramSettings();
        if (!telegram_token || !telegram_chat_id) {
            return;
        }
        const url = `https://api.telegram.org/bot${telegram_token.trim()}/sendMessage`;
        const payload = {
            chat_id: telegram_chat_id.trim(),
            text: text,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        };
        if (replyMarkup) {
            payload.reply_markup = replyMarkup;
        }
        await axios.post(url, payload, { timeout: 10000 });
    } catch (err) {
        console.error('Lỗi gửi báo cáo Telegram:', err.message);
    }
}

const commandKeyboard = {
    inline_keyboard: [
        [
            { text: "🗑️ Xóa xong", callback_data: "xoaxong" },
            { text: "🔄 Đổi proxy lỗi", callback_data: "doiproxyloi" }
        ],
        [
            { text: "🔄 Retry Lỗi", callback_data: "retryloi" },
            { text: "📊 Thống kê", callback_data: "thongke" }
        ],
        [
            { text: "🇻🇳 Thêm VN", callback_data: "themvn" },
            { text: "🇵🇭 Thêm PH", callback_data: "themph" },
            { text: "🇮🇩 Thêm ID", callback_data: "themid" }
        ],
        [
            { text: "➕ Thêm tất cả luồng", callback_data: "themluong" }
        ]
    ]
};

// Checking completion of threads and reports
global.isTelegramFinishedReportSent = global.isTelegramFinishedReportSent || false;

async function checkAndSendFinishedReport(force = false) {
    try {
        const { telegram_report_success } = await Config.getTelegramSettings();
        if (!telegram_report_success) return;

        const db = require('../database/connection').getConnection();

        // Check if there are any threads with status 'inprogress'
        const activeThreadsCount = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as count FROM threads WHERE status = 'inprogress'", [], (err, row) => {
                if (err) return reject(err);
                resolve(row ? row.count : 0);
            });
        });

        if (activeThreadsCount > 0) {
            global.isTelegramFinishedReportSent = false;
            return;
        }

        // Only send if not already sent (or if forced)
        if (!global.isTelegramFinishedReportSent || force) {
            const stats = await VideoTask.getStats();
            if (stats.pending === 0 && stats.uploading === 0) {
                global.isTelegramFinishedReportSent = true;

                const text = `🏁 <b>HOÀN THÀNH TẤT CẢ CÁC LUỒNG!</b>\n\n` +
                    `🎉 Phần mềm đã chạy xong toàn bộ danh sách luồng cấu hình.\n\n` +
                    `📊 <b>THỐNG KÊ KẾT QUẢ CUỐI CÙNG:</b>\n` +
                    `▪️ <b>Tổng số video:</b> <code>${stats.total || 0}</code>\n` +
                    `▪️ <b>Chờ:</b> <code>${stats.pending || 0}</code>\n` +
                    `▪️ <b>Đang upload:</b> <code>${stats.uploading || 0}</code>\n` +
                    `▪️ <b>Thành công:</b> <code>${stats.completed || 0}</code>\n` +
                    `▪️ <b>Lỗi:</b> <code>${stats.failed || 0}</code>`;

                await sendTelegramMessage(text, commandKeyboard);
            }
        }
    } catch (err) {
        console.error('Lỗi khi kiểm tra gửi báo cáo hoàn thành:', err);
    }
}

async function sendHourlyReport() {
    try {
        const { telegram_report_hourly } = await Config.getTelegramSettings();
        if (!telegram_report_hourly) return;

        const stats = await VideoTask.getStats();
        const text = `🕒 <b>BÁO CÁO TIẾN ĐỘ ĐỊNH KỲ (HẰNG GIỜ)</b>\n\n` +
            `📊 <b>THỐNG KÊ TIẾN ĐỘ:</b>\n` +
            `▪️ <b>Tổng:</b> <code>${stats.total || 0}</code>\n` +
            `▪️ <b>Chờ:</b> <code>${stats.pending || 0}</code>\n` +
            `▪️ <b>Đang upload:</b> <code>${stats.uploading || 0}</code>\n` +
            `▪️ <b>Thành công:</b> <code>${stats.completed || 0}</code>\n` +
            `▪️ <b>Lỗi:</b> <code>${stats.failed || 0}</code>`;

        await sendTelegramMessage(text, commandKeyboard);
    } catch (err) {
        console.error('Lỗi gửi báo cáo đinh kỳ Telegram:', err);
    }
}

let isBotListenerRunning = false;
let lastUpdateId = 0;

async function runBotListener() {
    const ThreadModel = require('../models/thread.model');
    const db = require('../database/connection').getConnection();

    while (isBotListenerRunning) {
        try {
            const { telegram_token, telegram_chat_id } = await Config.getTelegramSettings();
            if (!telegram_token || !telegram_chat_id) {
                await new Promise((resolve) => setTimeout(resolve, 10000));
                continue;
            }

            const url = `https://api.telegram.org/bot${telegram_token.trim()}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
            const response = await axios.get(url, { timeout: 35000 });
            if (response.data && response.data.ok && response.data.result) {
                for (const update of response.data.result) {
                    lastUpdateId = update.update_id;

                    let command = '';
                    let chatId = null;
                    let callbackQueryId = null;

                    if (update.message && update.message.text) {
                        chatId = update.message.chat.id;
                        command = update.message.text.trim().toLowerCase();
                    } else if (update.callback_query) {
                        chatId = update.callback_query.message.chat.id;
                        command = update.callback_query.data;
                        callbackQueryId = update.callback_query.id;
                    }

                    if (!chatId || !command) continue;

                    // Security check: Only allow messages from verified chat id
                    if (String(chatId) !== String(telegram_chat_id).trim()) {
                        continue;
                    }

                    // Answer callback callback if applicable
                    if (callbackQueryId) {
                        try {
                            const answerUrl = `https://api.telegram.org/bot${telegram_token.trim()}/answerCallbackQuery`;
                            await axios.post(answerUrl, {
                                callback_query_id: callbackQueryId,
                                text: 'Đang thực thi lệnh...'
                            }, { timeout: 5000 });
                        } catch (err) {
                            console.error('Error answering callback query:', err.message);
                        }
                    }

                    if (command === '/xoaxong' || command === 'xóa xong' || command === 'xoaxong') {
                        await new Promise((resolve, reject) => {
                            db.run(
                                "DELETE FROM threads WHERE status = 'done' AND (count_video_upload - videos_uploaded) <= 0",
                                [],
                                function (err) {
                                    if (err) return reject(err);
                                    resolve(this.changes);
                                }
                            );
                        }).then(async (deletedCount) => {
                            await sendTelegramMessage(`✅ <b>KẾT QUẢ THỰC THI LỆNH:</b>\n\nĐã xóa thành công <code>${deletedCount}</code> luồng có trạng thái "Xong" và Pending = 0.`);
                        }).catch(async (err) => {
                            await sendTelegramMessage(`❌ Lỗi thực thi lệnh Xóa Xong: ${err.message}`);
                        });
                    }

                    else if (command === '/doiproxyloi' || command === 'đổi proxy lỗi' || command === 'doiproxyloi') {
                        try {
                            const proxies = await new Promise((resolve, reject) => {
                                db.all('SELECT proxy FROM proxies', [], (err, rows) => {
                                    if (err) return reject(err);
                                    resolve(rows ? rows.map(r => r.proxy) : []);
                                });
                            });

                            if (proxies.length === 0) {
                                await sendTelegramMessage(`❌ Gặp lỗi: Không có proxy nào trong database. Vui lòng đồng bộ proxy trước.`);
                                continue;
                            }

                            const threads = await ThreadModel.getAll();
                            const targetThreads = threads.filter(t => {
                                const errText = t.error || '';
                                return errText.includes('getToken failed: Empty token response') ||
                                    errText.toLowerCase().includes('econnrefused') ||
                                    errText.includes('proxy không kết nối được');
                            });

                            if (targetThreads.length === 0) {
                                await sendTelegramMessage(`ℹ️ Không tìm thấy luồng nào bị lỗi proxy phù hợp để đổi.`);
                                continue;
                            }

                            const updatePromises = targetThreads.map(thread => {
                                return new Promise(async (resProm) => {
                                    const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
                                    let host = null, port = null, username = null, password = null;
                                    if (randomProxy) {
                                        const parts = randomProxy.trim().split(':');
                                        if (parts.length >= 2) {
                                            host = parts[0];
                                            port = parseInt(parts[1], 10);
                                            if (parts.length === 4) {
                                                username = parts[2];
                                                password = parts[3];
                                            }
                                        }
                                    }
                                    await ThreadModel.updateProxy(thread.id, host, port, username, password);
                                    await ThreadModel.updateError(thread.id, null);
                                    resProm();
                                });
                            });

                            await Promise.all(updatePromises);
                            await sendTelegramMessage(`✅ Đã đổi proxy thành công cho <code>${targetThreads.length}</code> luồng lỗi.`);
                        } catch (err) {
                            await sendTelegramMessage(`❌ Lỗi thực thi lệnh Đổi Proxy Lỗi: ${err.message}`);
                        }
                    }

                    else if (command === '/thongke' || command === 'thông kê' || command === 'thongke' || command === 'Thongke') {
                        try {
                            const stats = await VideoTask.getStats();

                            // Query thread info stats from SQLite database
                            const threadStats = await new Promise((resolve, reject) => {
                                db.all(
                                    "SELECT status, COUNT(*) as count FROM threads GROUP BY status",
                                    [],
                                    (err, rows) => {
                                        if (err) return reject(err);
                                        const res = { inprogress: 0, stopped: 0, done: 0, error: 0, total: 0 };
                                        if (rows) {
                                            for (const row of rows) {
                                                const s = row.status || 'stopped';
                                                res[s] = (res[s] || 0) + row.count;
                                                res.total += row.count;
                                            }
                                        }
                                        resolve(res);
                                    }
                                );
                            });

                            const text = `📊 <b>BÁO CÁO THỐNG KÊ CHI TIẾT</b>\n\n` +
                                `📈 <b>TIẾN ĐỘ THÀNH PHẦN (VIDEOS):</b>\n` +
                                `▪️ <b>Tổng số video:</b> <code>${stats.total || 0}</code>\n` +
                                `▪️ <b>Chờ xử lý:</b> <code>${stats.pending || 0}</code>\n` +
                                `▪️ <b>Đang upload:</b> <code>${stats.uploading || 0}</code>\n` +
                                `▪️ <b>Thành công:</b> <code>${stats.completed || 0}</code>\n` +
                                `▪️ <b>Thất bại:</b> <code>${stats.failed || 0}</code>\n\n` +
                                `🧵 <b>TRẠNG THÁI CÁC LUỒNG (THREADS):</b>\n` +
                                `▪️ <b>Tổng số luồng:</b> <code>${threadStats.total || 0}</code>\n` +
                                `▪️ <b>Đang chạy:</b> <code>${threadStats.inprogress || 0}</code>\n` +
                                `▪️ <b>Bị lỗi:</b> <code>${threadStats.error || 0}</code>\n` +
                                `▪️ <b>Đã hoàn thành:</b> <code>${threadStats.done || 0}</code>\n` +
                                `▪️ <b>Tạm dừng:</b> <code>${threadStats.stopped || 0}</code>`;

                            await sendTelegramMessage(text, commandKeyboard);
                        } catch (err) {
                            await sendTelegramMessage(`❌ Lỗi truy vấn thống kê: ${err.message}`);
                        }
                    }

                    else if (command === '/retryloi' || command === 'retry lỗi' || command === 'retryloi' || command === 'Retry Lỗi') {
                        try {
                            const count = await VideoTask.retryAllFailed();

                            // Reset thread status if they are in 'error' state to let them try posting again
                            await new Promise((resolve, reject) => {
                                db.run(
                                    "UPDATE threads SET status = 'inprogress', error = NULL WHERE status = 'error'",
                                    [],
                                    function (err) {
                                        if (err) return reject(err);
                                        resolve(this.changes);
                                    }
                                );
                            }).then(async (resetThreads) => {
                                await sendTelegramMessage(`✅ <b>KẾT QUẢ THỰC THI LỆNH:</b>\n\nĐã chuyển <code>${count}</code> task từ trạng thái "Lỗi" thành "Chờ". Đồng thời mở lại <code>${resetThreads}</code> luồng lỗi.`);
                            }).catch(async (err) => {
                                await sendTelegramMessage(`✅ <b>KẾT QUẢ THỰC THI LỆNH:</b>\n\nĐã chuyển <code>${count}</code> task từ trạng thái "Lỗi" thành "Chờ" (Lưu ý: Không thể tự động reset luồng lỗi: ${err.message}).`);
                            });
                        } catch (err) {
                            await sendTelegramMessage(`❌ Lỗi thực thi lệnh Retry Lỗi: ${err.message}`);
                        }
                    }

                    else if (command === '/themluong' || command === 'thêm luồng' || command === 'themluong' || command === 'them luong') {
                        try {
                            const importService = require('../services/import.service');
                            const cfg = importService.getImportConfigs();
                            
                            if (!cfg.countries || Object.keys(cfg.countries).length === 0) {
                                await sendTelegramMessage("❌ <b>Gặp lỗi:</b> Không tìm thấy cấu hình nhập luồng nhanh được lưu. Vui lòng thiết lập trên giao diện web trước.");
                                continue;
                            }
                            
                            const activeCountries = [];
                            for (const country in cfg.countries) {
                                const c = cfg.countries[country];
                                if (c.videoFolder && c.driveLink) {
                                    activeCountries.push({
                                        country,
                                        videoFolder: c.videoFolder,
                                        driveLink: c.driveLink,
                                        sheetName: c.sheetName || "",
                                        maxVideosPerAccount: c.maxVideosPerAccount,
                                        delayMin: cfg.general?.delayMin || "186",
                                        delayMax: cfg.general?.delayMax || "245",
                                        autoStart: cfg.general?.autoStart !== false
                                    });
                                }
                            }
                            
                            if (activeCountries.length === 0) {
                                await sendTelegramMessage("❌ <b>Gặp lỗi:</b> Không tìm thấy quốc gia nào có đầy đủ Folder Video và Link Google Sheet trong cấu hình đã lưu.");
                                continue;
                            }
                            
                            await sendTelegramMessage(`⏳ Đang chạy lệnh <b>Thêm tất cả luồng</b> cho <code>${activeCountries.length}</code> quốc gia...`);
                            
                            const results = [];
                            for (const act of activeCountries) {
                                try {
                                    const res = await importService.executeImport(act);
                                    results.push({
                                        country: act.country.toUpperCase(),
                                        success: true,
                                        imported: res.imported,
                                        created: res.threadsCreated,
                                        existed: res.threadsExisted
                                    });
                                } catch (e) {
                                    results.push({
                                        country: act.country.toUpperCase(),
                                        success: false,
                                        error: e.message
                                    });
                                }
                            }
                            
                            let reply = "🏁 <b>KẾT QUẢ THỰC THI LỆNH THÊM TẤT CẢ LUỒNG:</b>\n\n";
                            results.forEach(r => {
                                if (r.success) {
                                    reply += `✅ <b>[${r.country}]:</b> Nhập thành công <code>${r.imported}</code> tasks (${r.created} luồng mới, ${r.existed} luồng cũ)\n`;
                                } else {
                                    reply += `❌ <b>[${r.country}]:</b> Lỗi: <code>${r.error}</code>\n`;
                                }
                            });
                            
                            await sendTelegramMessage(reply, commandKeyboard);
                            
                        } catch (err) {
                            await sendTelegramMessage(`❌ Lỗi thực thi lệnh Thêm Luồng: ${err.message}`);
                        }
                    }

                    else if (command === '/themvn' || command === 'themvn' || command === 'thêm vn' ||
                             command === '/themph' || command === 'themph' || command === 'thêm ph' ||
                             command === '/themid' || command === 'themid' || command === 'thêm id') {
                        try {
                            let targetCountry = '';
                            if (command.includes('vn')) targetCountry = 'vn';
                            else if (command.includes('ph')) targetCountry = 'ph';
                            else if (command.includes('id')) targetCountry = 'id';

                            const importService = require('../services/import.service');
                            const cfg = importService.getImportConfigs();
                            
                            const c = cfg.countries?.[targetCountry];
                            if (!c || !c.videoFolder || !c.driveLink) {
                                await sendTelegramMessage(`❌ <b>Gặp lỗi:</b> Không tìm thấy cấu hình hợp lệ cho nước <code>${targetCountry.toUpperCase()}</code>. Vui lòng thiết lập trên giao diện web trước.`);
                                continue;
                            }
                            
                            await sendTelegramMessage(`⏳ Đang chạy lệnh <b>Thêm ${targetCountry.toUpperCase()}</b>...`);
                            
                            try {
                                const res = await importService.executeImport({
                                    country: targetCountry,
                                    videoFolder: c.videoFolder,
                                    driveLink: c.driveLink,
                                    sheetName: c.sheetName || "",
                                    maxVideosPerAccount: c.maxVideosPerAccount,
                                    delayMin: cfg.general?.delayMin || "186",
                                    delayMax: cfg.general?.delayMax || "245",
                                    autoStart: cfg.general?.autoStart !== false
                                });
                                
                                const reply = `🏁 <b>KẾT QUẢ THỰC THI LỆNH THÊM ${targetCountry.toUpperCase()}:</b>\n\n` +
                                    `✅ Nhập thành công <code>${res.imported}</code> tasks (${res.threadsCreated} luồng mới, ${res.threadsExisted} luồng cũ)`;
                                await sendTelegramMessage(reply, commandKeyboard);
                            } catch (e) {
                                await sendTelegramMessage(`❌ <b>[${targetCountry.toUpperCase()}]:</b> Lỗi: <code>${e.message}</code>`, commandKeyboard);
                            }
                            
                        } catch (err) {
                            await sendTelegramMessage(`❌ Lỗi thực thi lệnh: ${err.message}`);
                        }
                    }
                }
            }
        } catch (err) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}

function startTelegramBotListener() {
    if (isBotListenerRunning) return;
    isBotListenerRunning = true;
    runBotListener().catch(console.error);
}

function stopTelegramBotListener() {
    isBotListenerRunning = false;
}

module.exports = {
    sendTelegramMessage,
    checkAndSendFinishedReport,
    sendHourlyReport,
    startTelegramBotListener,
    stopTelegramBotListener
};
