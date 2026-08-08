const a0_0x2123aa = a0_0x2ac9;
(function (_0x120812, _0x188e3a) {
  const _0x2c297f = a0_0x2ac9,
    _0x8e3585 = _0x120812();
  while (!![]) {
    try {
      const _0x6fbc35 =
        parseInt(_0x2c297f(0x176)) / 0x1 +
        (parseInt(_0x2c297f(0x14e)) / 0x2) *
        (parseInt(_0x2c297f(0x17a)) / 0x3) +
        parseInt(_0x2c297f(0x175)) / 0x4 +
        (-parseInt(_0x2c297f(0x185)) / 0x5) *
        (parseInt(_0x2c297f(0x160)) / 0x6) +
        (-parseInt(_0x2c297f(0x184)) / 0x7) *
        (-parseInt(_0x2c297f(0x167)) / 0x8) +
        (parseInt(_0x2c297f(0x140)) / 0x9) *
        (parseInt(_0x2c297f(0x187)) / 0xa) +
        -parseInt(_0x2c297f(0x171)) / 0xb;
      if (_0x6fbc35 === _0x188e3a) break;
      else _0x8e3585["push"](_0x8e3585["shift"]());
    } catch (_0x3026f0) {
      _0x8e3585["push"](_0x8e3585["shift"]());
    }
  }
})(a0_0x25dd, 0xcb127);
const cron = require(a0_0x2123aa(0x157)),
  db = require(a0_0x2123aa(0x15c))["getConnection"](),
  VideoTask = require(a0_0x2123aa(0x146)),
  { processLocalVideoUpload } = require("../services/handle-upload.service"),
  Log = require(a0_0x2123aa(0x164)),
  Thread = require("../models/thread.model"),
  Config = require("../models/config.model"),
  initJobs = () => {
    const _0x56b8da = a0_0x2123aa,
      _0x5d669f = {
        ahuPB: function (_0x27abb2, _0x340b34) {
          return _0x27abb2 > _0x340b34;
        },
        Lmufp:
          "Credit\x20API\x20server\x20không\x20phản\x20hồi\x20—\x20kiểm\x20tra\x20kết\x20nối",
        TsteM: _0x56b8da(0x183),
        LfAwD: "Credit",
        Ytwyk: "2-digit",
        kLSGk: function (_0x174d1b, _0xb9eaa) {
          return _0x174d1b === _0xb9eaa;
        },
      };
    let _0x554f58 = ![];
    (setInterval(async () => {
      const _0x3e18f6 = _0x56b8da,
        _0x3ce7c4 = {
          qiGou: function (_0x247e1c, _0x306f6f) {
            return _0x247e1c(_0x306f6f);
          },
          wmYhb: function (_0x5dd385, _0x31b3f9) {
            const _0x3586b3 = a0_0x2ac9;
            return _0x5d669f[_0x3586b3(0x165)](_0x5dd385, _0x31b3f9);
          },
          ogWnh: function (_0x5172ea, _0x1ea4ad) {
            return _0x5172ea >= _0x1ea4ad;
          },
          KFwUl: function (_0x14c2a5, _0x2be1b0) {
            return _0x14c2a5 >= _0x2be1b0;
          },
          TNHfA: "success",
          MxuYv: _0x5d669f[_0x3e18f6(0x163)],
          iiYPe: _0x5d669f[_0x3e18f6(0x14b)],
          frdMh: "\x20—\x20cookie\x20hết\x20hạn\x20hoặc\x20IP\x20bị\x20chặn",
          xumkl: "timeout",
          ndzdX: _0x3e18f6(0x156),
          Fishs: "getExtra",
          ItXIn: _0x3e18f6(0x174),
          vNVPD: _0x5d669f[_0x3e18f6(0x170)],
          HmmCK: _0x3e18f6(0x17d),
          QfVSP: function (_0x3d9d8a, _0x5fe75d) {
            return _0x3d9d8a / _0x5fe75d;
          },
        };
      if (_0x554f58) return;
      _0x554f58 = !![];
      try {
        const _0x4e3fa5 = Math[_0x3e18f6(0x169)](
          Date[_0x3e18f6(0x16a)]() / 0x3e8,
        ),
          _0x2bb0bb = await new Promise((resolve, reject) => {
            db.all(
              "SELECT threads.*, users.username, users.cookie FROM threads JOIN users ON users.id = threads.user_id WHERE threads.status = 'inprogress' AND (threads.next_run_at IS NULL OR threads.next_run_at <= ?) ORDER BY threads.videos_uploaded ASC, threads.id ASC",
              [_0x4e3fa5],
              (err, rows) => {
                if (err) return reject(err);
                resolve(rows || []);
              }
            );
          });
        if (_0x2bb0bb["length"] === 0x0) return;
        await Promise["all"](
          _0x2bb0bb["map"](async (_0x5286b2) => {
            const _0x2c03bf = _0x3e18f6,
              _0x9687ef = {
                oBxCf: function (_0x4ddd3f, _0x1b2ed0) {
                  const _0x53f045 = a0_0x2ac9;
                  return _0x3ce7c4[_0x53f045(0x173)](_0x4ddd3f, _0x1b2ed0);
                },
                GdIwM: function (_0x52dd09, _0x45ac51) {
                  return _0x52dd09 > _0x45ac51;
                },
                hcfXH:
                  "UPDATE\x20threads\x20SET\x20status\x20=\x20\x22done\x22\x20WHERE\x20id\x20=\x20?",
              };
            if (
              _0x3ce7c4[_0x2c03bf(0x153)](_0x5286b2[_0x2c03bf(0x179)], 0x0) &&
              _0x3ce7c4["ogWnh"](
                _0x5286b2[_0x2c03bf(0x141)],
                _0x5286b2[_0x2c03bf(0x179)],
              )
            ) {
              await new Promise((_0x43daa0, _0x1dbacb) =>
                db["run"](_0x2c03bf(0x149), [_0x5286b2["id"]], (_0x4aef3c) =>
                  _0x4aef3c ? _0x1dbacb(_0x4aef3c) : _0x43daa0(),
                ),
              );
              return;
            }
            const _0x5aff01 = await new Promise((_0x2d9472, _0x358834) =>
              db["get"](
                "SELECT\x20status\x20FROM\x20threads\x20WHERE\x20id\x20=\x20?",
                [_0x5286b2["id"]],
                (_0x3e37c2, _0x2bb899) =>
                  _0x3e37c2 ? _0x358834(_0x3e37c2) : _0x2d9472(_0x2bb899),
              ),
            );
            if (!_0x5aff01 || _0x5aff01[_0x2c03bf(0x17b)] !== "inprogress")
              return;
            const _0xbefdaa = await VideoTask["getNextPendingForUser"](
              _0x5286b2[_0x2c03bf(0x186)],
            );
            if (!_0xbefdaa) {
              await new Promise((_0x50072f, _0x1f5486) =>
                db[_0x2c03bf(0x16f)](
                  "UPDATE\x20threads\x20SET\x20status\x20=\x20\x27done\x27\x20WHERE\x20id\x20=\x20?",
                  [_0x5286b2["id"]],
                  (_0x50afdc) =>
                    _0x50afdc ? _0x1f5486(_0x50afdc) : _0x50072f(),
                ),
              );
              return;
            }
            await VideoTask["updateStatus"](_0xbefdaa["id"], "uploading");
            let _0x3318d7 = null;
            if (_0x5286b2["proxy_host"] && _0x5286b2["proxy_port"])
              _0x3318d7 =
                _0x5286b2[_0x2c03bf(0x180)] && _0x5286b2["proxy_password"]
                  ? {
                    host: _0x5286b2["proxy_host"],
                    port: _0x5286b2[_0x2c03bf(0x14f)],
                    auth: {
                      username: _0x5286b2[_0x2c03bf(0x180)],
                      password: _0x5286b2["proxy_password"],
                    },
                  }
                  : {
                    host: _0x5286b2["proxy_host"],
                    port: _0x5286b2["proxy_port"],
                  };
            else {
              if (_0x5286b2["user_proxy"]) {
                const _0x235ac0 = _0x5286b2[_0x2c03bf(0x181)]["split"](":");
                if (_0x3ce7c4["KFwUl"](_0x235ac0["length"], 0x2)) {
                  _0x3318d7 = { host: _0x235ac0[0x0], port: _0x235ac0[0x1] };
                  if (_0x235ac0["length"] === 0x4)
                    _0x3318d7[_0x2c03bf(0x177)] = {
                      username: _0x235ac0[0x2],
                      password: _0x235ac0[0x3],
                    };
                }
              }
            }
            if (!_0x3318d7) {
              const randomProxyResult = await new Promise((resolve) => {
                db.get(
                  "SELECT proxy FROM proxies ORDER BY RANDOM() LIMIT 1",
                  [],
                  (err, row) => {
                    resolve(row ? row.proxy : null);
                  },
                );
              });
              if (randomProxyResult) {
                const parts = randomProxyResult.trim().split(":");
                if (parts.length >= 2) {
                  _0x3318d7 = { host: parts[0], port: parts[1] };
                  if (parts.length === 4) {
                    _0x3318d7["auth"] = {
                      username: parts[2],
                      password: parts[3],
                    };
                  }
                  await Thread.updateProxy(
                    _0x5286b2["id"],
                    parts[0],
                    parseInt(parts[1], 10),
                    parts[2] || null,
                    parts[3] || null,
                  );
                  console.log(
                    `🤖 Auto Proxy: Thread ${_0x5286b2["id"]} automatically assigned random proxy from pool: ${randomProxyResult}`,
                  );
                }
              }
            }
            const _proxyQueueKey = require("../utils/proxy-queue").getKey(_0x3318d7);
            const _releaseProxy = await require("../utils/proxy-queue").acquire(_proxyQueueKey);
            try {
              const _0x58c800 = await processLocalVideoUpload(
                _0xbefdaa[_0x2c03bf(0x166)],
                {
                  cookie: _0x5286b2["cookie"] || "",
                  proxy: _0x3318d7,
                  caption: _0xbefdaa[_0x2c03bf(0x14d)],
                  products: _0xbefdaa["products"],
                  country: _0x5286b2["country"] || "vn",
                },
              );
              (await new Promise((_0xd5f1af, _0x3e97f1) =>
                db["run"](_0x2c03bf(0x154), [_0x5286b2["id"]], (_0x28b4ef) =>
                  _0x28b4ef ? _0x3e97f1(_0x28b4ef) : _0xd5f1af(),
                ),
              ),
                await Promise[_0x2c03bf(0x172)]([
                  VideoTask[_0x2c03bf(0x144)](_0xbefdaa["id"], "completed", {
                    post_id: _0x58c800["postId"],
                    video_link: _0x58c800[_0x2c03bf(0x161)],
                  }),
                  Log[_0x2c03bf(0x16d)]({
                    username: _0x5286b2["username"],
                    status: _0x3ce7c4["TNHfA"],
                    post_id: _0x58c800[_0x2c03bf(0x162)],
                    extra_info: JSON[_0x2c03bf(0x168)]({
                      video: _0xbefdaa[_0x2c03bf(0x15a)],
                      link: _0x58c800[_0x2c03bf(0x161)],
                    }),
                  }),
                  new Promise((_0x3e3152, _0x2fa289) => {
                    const _0x37f828 = _0x2c03bf,
                      _0x42aac3 = {
                        hsWEJ: function (_0x347cd7, _0x330b9d) {
                          return _0x347cd7(_0x330b9d);
                        },
                      },
                      _0x2017fa = _0x5286b2["delay_min"] || 0x3c,
                      _0x223969 = _0x5286b2[_0x37f828(0x15d)] || 0xb4,
                      _0x328dd2 =
                        Math[_0x37f828(0x169)](
                          Math["random"]() * (_0x223969 - _0x2017fa + 0x1),
                        ) + _0x2017fa,
                      _0x5895e1 =
                        Math[_0x37f828(0x169)](
                          Date[_0x37f828(0x16a)]() / 0x3e8,
                        ) + _0x328dd2;
                    db["run"](
                      _0x37f828(0x17f),
                      [_0x5895e1, _0x5286b2["id"]],
                      (_0x137040) => {
                        const _0x34b833 = _0x37f828;
                        if (_0x137040)
                          return _0x9687ef[_0x34b833(0x17e)](
                            _0x2fa289,
                            _0x137040,
                          );
                        _0x9687ef["GdIwM"](
                          _0x5286b2["count_video_upload"],
                          0x0,
                        ) &&
                          _0x5286b2["videos_uploaded"] + 0x1 >=
                          _0x5286b2["count_video_upload"]
                          ? db[_0x34b833(0x16f)](
                            _0x9687ef["hcfXH"],
                            [_0x5286b2["id"]],
                            (_0x448bfd) => {
                              const _0x507f14 = _0x34b833;
                              if (_0x448bfd)
                                return _0x42aac3[_0x507f14(0x145)](
                                  _0x2fa289,
                                  _0x448bfd,
                                );
                              _0x3e3152();
                            },
                          )
                          : _0x3e3152();
                      },
                    );
                  }),
                ]));
            } catch (_0xe8512) {
              let _0x47de00 =
                _0xe8512?.["error"] ||
                _0xe8512?.[_0x2c03bf(0x15f)] ||
                _0x2c03bf(0x158);
              (_0x47de00[_0x2c03bf(0x143)](_0x2c03bf(0x17c)) ||
                _0x47de00["includes"]("<html")) &&
                (_0x47de00 = _0x3ce7c4["MxuYv"]);
              _0x47de00 = _0x47de00["substring"](0x0, 0xc8);
              const _0x1b5454 = _0x47de00[_0x2c03bf(0x143)](
                _0x3ce7c4[_0x2c03bf(0x13f)],
              )
                ? _0x3ce7c4["frdMh"]
                : _0x47de00["includes"]("418")
                  ? "\x20—\x20xác\x20thực\x20thất\x20bại"
                  : _0x47de00["includes"]("502") ||
                    _0x47de00[_0x2c03bf(0x143)](_0x2c03bf(0x178))
                    ? "\x20—\x20server\x20quá\x20tải"
                    : _0x47de00[_0x2c03bf(0x143)](
                      _0x3ce7c4[_0x2c03bf(0x151)],
                    ) || _0x47de00["includes"]("Timeout")
                      ? _0x2c03bf(0x150)
                      : _0x47de00[_0x2c03bf(0x143)](_0x3ce7c4["ndzdX"]) ||
                        _0x47de00["includes"](_0x2c03bf(0x147))
                        ? "\x20—\x20proxy\x20không\x20kết\x20nối\x20được"
                        : _0x47de00["includes"](_0x3ce7c4[_0x2c03bf(0x14c)])
                          ? ""
                          : _0x47de00["includes"](_0x3ce7c4["ItXIn"])
                            ? ""
                            : _0x47de00[_0x2c03bf(0x143)]("credit") ||
                              _0x47de00[_0x2c03bf(0x143)](
                                _0x3ce7c4[_0x2c03bf(0x155)],
                              )
                              ? ""
                              : "",
                _0x4b35f1 = _0x47de00 + _0x1b5454;

              // === AUTO-RETRY: Lỗi tạm thời → đưa video task về pending, không đánh dấu failed ===
              const _isTemporaryError = (
                _0x4b35f1.includes("quá tải") ||
                _0x4b35f1.includes("Empty token") ||
                _0x4b35f1.includes("too many") ||
                _0x4b35f1.includes("timeout") ||
                _0x4b35f1.includes("Timeout") ||
                _0x4b35f1.includes("ECONNRESET") ||
                _0x4b35f1.includes("ECONNREFUSED") ||
                _0x4b35f1.includes("ENETUNREACH") ||
                _0x4b35f1.includes("proxy không kết nối") ||
                _0x4b35f1.includes("502") ||
                _0x4b35f1.includes("503")
              );

              if (_isTemporaryError) {
                // Lỗi tạm thời: đưa video task về pending để retry tự động
                await VideoTask["updateStatus"](_0xbefdaa["id"], "pending");

                // === AUTO-ROTATE PROXY khi bị rate-limit hoặc proxy chết ===
                const _isRateLimit = _0x4b35f1.includes("too many") || _0x4b35f1.includes("quá tải") || _0x4b35f1.includes("502") || _0x4b35f1.includes("503");
                const _isProxyDead = _0x4b35f1.includes("Empty token") || _0x4b35f1.includes("ECONNRESET") || _0x4b35f1.includes("ECONNREFUSED") || _0x4b35f1.includes("proxy không kết nối");

                let _newProxyMsg = "";
                if (_isRateLimit || _isProxyDead) {
                  try {
                    const _rndProxy = await new Promise((_r) => {
                      db.get(
                        "SELECT proxy FROM proxies WHERE proxy NOT LIKE ? ORDER BY RANDOM() LIMIT 1",
                        ["%" + (_0x5286b2["proxy_host"] || "___") + "%"],
                        (e, row) => _r(row ? row.proxy : null)
                      );
                    });
                    if (_rndProxy) {
                      const _pp = _rndProxy.trim().split(":");
                      await new Promise((_r, _j) => db.run(
                        "UPDATE threads SET proxy_host = ?, proxy_port = ?, proxy_username = ?, proxy_password = ? WHERE id = ?",
                        [_pp[0], parseInt(_pp[1]), _pp[2] || null, _pp[3] || null, _0x5286b2["id"]],
                        (e) => e ? _j(e) : _r()
                      ));
                      _newProxyMsg = " → Đã đổi proxy sang " + _pp[0];
                    }
                  } catch(_proxyErr) {}
                }

                // Delay: rate-limit = 45-90s, proxy lỗi = 10-20s  
                const _retryDelay = _isRateLimit ? (45 + Math.floor(Math.random() * 45)) : (10 + Math.floor(Math.random() * 10));
                const _retryNextRun = Math.floor(Date.now() / 1000) + _retryDelay;
                await Promise["all"]([
                  new Promise((_r, _j) =>
                    db["run"](
                      "UPDATE threads SET error = ?, next_run_at = ? WHERE id = ?",
                      ["[Auto-Retry " + _retryDelay + "s" + _newProxyMsg + "] " + _0x4b35f1, _retryNextRun, _0x5286b2["id"]],
                      (_e) => _e ? _j(_e) : _r(),
                    ),
                  ),
                  Log["create"]({
                    username: _0x5286b2["username"] || _0xbefdaa["username"] || "unknown",
                    status: "error",
                    error: "[Auto-Retry " + _retryDelay + "s" + _newProxyMsg + "] " + _0x4b35f1,
                    failed_function: _0xe8512?.["failedFunction"] || _0x2c03bf(0x182),
                  }),
                ]);
              } else if (
                // === AUTO-STOP: Lỗi nghiêm trọng → dừng luồng hoàn toàn ===
                _0x4b35f1.includes("IllegalUserState") ||
                _0x4b35f1.includes("UserBanned") ||
                _0x4b35f1.includes("AccountDisabled")
              ) {
                await Promise["all"]([
                  VideoTask["updateStatus"](_0xbefdaa["id"], "pending"),
                  Log["create"]({
                    username: _0x5286b2["username"] || _0xbefdaa["username"] || "unknown",
                    status: "error",
                    error: "[AUTO-STOP] " + _0x4b35f1,
                    failed_function: _0xe8512?.["failedFunction"] || _0x2c03bf(0x182),
                  }),
                  new Promise((_r, _j) =>
                    db["run"](
                      "UPDATE threads SET status = 'done', error = ? WHERE id = ?",
                      ["[AUTO-STOP] TK bị Shopee khóa: " + _0x4b35f1, _0x5286b2["id"]],
                      (_e) => _e ? _j(_e) : _r(),
                    ),
                  ),
                ]);
              } else {
                // Lỗi vĩnh viễn (418, cookie hết hạn...): đánh dấu failed như cũ
                await Promise["all"]([
                  VideoTask["updateStatus"](_0xbefdaa["id"], _0x3ce7c4["HmmCK"], {
                    error: _0x4b35f1,
                  }),
                  Log["create"]({
                    username: _0x5286b2["username"] || _0xbefdaa["username"] || "unknown",
                    status: "error",
                    error: _0x4b35f1,
                    failed_function:
                      _0xe8512?.["failedFunction"] || _0x2c03bf(0x182),
                  }),
                  new Promise((_0x435b92, _0x2effe2) =>
                    db["run"](
                      "UPDATE\x20threads\x20SET\x20error\x20=\x20?\x20WHERE\x20id\x20=\x20?",
                      [_0x4b35f1, _0x5286b2["id"]],
                      (_0xd600cf) =>
                        _0xd600cf ? _0x2effe2(_0xd600cf) : _0x435b92(),
                    ),
                  ),
                ]);
                const _0x55f93d =
                  Math["floor"](
                    _0x3ce7c4["QfVSP"](Date[_0x2c03bf(0x16a)](), 0x3e8),
                  ) + 30 + Math.floor(Math.random() * 60);
                await new Promise((_0x513455, _0x253166) =>
                  db[_0x2c03bf(0x16f)](
                    "UPDATE\x20threads\x20SET\x20next_run_at\x20=\x20?\x20WHERE\x20id\x20=\x20?",
                    [_0x55f93d, _0x5286b2["id"]],
                    (_0x13c705) =>
                      _0x13c705 ? _0x253166(_0x13c705) : _0x513455(),
                  ),
                );
              }
            } finally {
              _releaseProxy();
            }
          }),
        );
      } catch (_0x3d0f2f) {
        console[_0x3e18f6(0x148)](_0x3e18f6(0x159), _0x3d0f2f);
      } finally {
        _0x554f58 = ![];
        try {
          const { checkAndSendFinishedReport } = require("../utils/telegram");
          checkAndSendFinishedReport().catch(e => console.error(e));
        } catch (teleErr) { }
      }
    }, 0x2710),
      cron["schedule"](_0x56b8da(0x142), async () => {
        const _0x56e0eb = _0x56b8da;
        try {
          const _0x277027 = await Config[_0x56e0eb(0x15b)](),
            _0x57e8b3 = new Date()["toLocaleTimeString"]("en-US", {
              hour12: ![],
              hour: _0x5d669f["Ytwyk"],
              minute: "2-digit",
            });
          _0x5d669f[_0x56e0eb(0x15e)](_0x57e8b3, _0x277027) &&
            (await Thread[_0x56e0eb(0x16e)](),
              console["log"](_0x56e0eb(0x16b)));
        } catch (_0x8fe2d8) {
          console[_0x56e0eb(0x148)](
            "[cron]\x20Error\x20restarting\x20threads:",
            _0x8fe2d8,
          );
        }
      }));

    cron.schedule('0 * * * *', async () => {
      try {
        const { sendHourlyReport } = require("../utils/telegram");
        await sendHourlyReport();
      } catch (err) {
        console.error("[Telegram Cron] Hourly report failed:", err);
      }
    });

    // === HEALTH MONITOR: Tự động sửa luồng bị kẹt mỗi 3 phút ===
    cron.schedule('*/3 * * * *', async () => {
      try {
        const now = Math.floor(Date.now() / 1000);

        // 1. Reset video_tasks bị stuck "uploading" quá 5 phút
        await new Promise((r, j) => db.run(
          "UPDATE video_tasks SET status = 'pending' WHERE status = 'uploading' AND created_at <= datetime('now', '-5 minutes')",
          [], (e) => e ? j(e) : r()
        ));

        // 2. Xóa error + reset next_run_at cho luồng bị kẹt lỗi tạm quá lâu (next_run_at đã quá hạn > 2 phút)
        const stuckResult = await new Promise((r, j) => {
          db.run(
            "UPDATE threads SET error = NULL, next_run_at = 0 WHERE status = 'inprogress' AND error IS NOT NULL AND error LIKE '%Auto-Retry%' AND next_run_at > 0 AND next_run_at < ?",
            [now - 120],
            function(e) { e ? j(e) : r(this.changes); }
          );
        });
        if (stuckResult > 0) {
          console.log("[Health Monitor] Đã giải phóng " + stuckResult + " luồng bị kẹt lỗi tạm");
        }

        // 3. Reset luồng có error nhưng next_run_at = 0 (bị bỏ quên)
        await new Promise((r, j) => db.run(
          "UPDATE threads SET error = NULL WHERE status = 'inprogress' AND error IS NOT NULL AND next_run_at = 0",
          [], function(e) { 
            if (!e && this.changes > 0) console.log("[Health Monitor] Xóa " + this.changes + " lỗi cũ bị bỏ quên");
            e ? j(e) : r(); 
          }
        ));

      } catch (healthErr) {
        console.error("[Health Monitor] Error:", healthErr);
      }
    });

    try {
      const { startTelegramBotListener } = require("../utils/telegram");
      startTelegramBotListener();
      console.log("🤖 Telegram Interactive Bot command listener started successfully.");
    } catch (e) {
      console.error("Lỗi khi khởi chạy trình lắng nghe lệnh Telegram Bot:", e);
    }
  };
function a0_0x25dd() {
  const _0x51d539 = [
    "ndK0nJK4ng52zeniza",
    "C3rYAw5NAwz5",
    "zMXVB3i",
    "BM93",
    "w2nYB25DiefSBcb0AhjLywrZihjLC2v0ihrVigLUChjVz3jLC3m",
    "DxnLCM5HBwu",
    "y3jLyxrL",
    "CMvZzxrbBgXuB0LUChjVz3jLC3nuAhjLywrZ",
    "CNvU",
    "tgzbD0q",
    "mZeZntC3ntvbu1vRweO",
    "ywXS",
    "CwLhB3u",
    "q29VA2LLigv4CgLYzwq",
    "nJiXnJa4nhPmt1nXuW",
    "mZCYmde1BMLxtuz0",
    "yxv0Aa",
    "ntaZ",
    "y291BNrFDMLKzw9FDxbSB2fK",
    "nMjAAwrvDq",
    "C3rHDhvZ",
    "pcfet0nuwvbf",
    "zMfPBgvK",
    "B0j4q2y",
    "vvbeqvrfihrOCMvHzhmGu0vuihzPzgvVC191CgXVywrLzca9ihzPzgvVC191CgXVywrLzcaRideSig5LEhrFCNvUx2f0id0GpYbxsevsrsbPzca9id8",
    "ChjVEhLFDxnLCM5HBwu",
    "DxnLCL9WCM94Eq",
    "Dw5RBM93BG",
    "ndaZ",
    "mtrjquLmrvO",
    "nxjiELrmzG",
    "DxnLCL9Pza",
    "mtqXmdaXnZb4AeT6yve",
    "AwLzugu",
    "ovrhzgnqqG",
    "DMLKzw9Zx3vWBg9HzgvK",
    "kIaQicOGkIaQ",
    "Aw5JBhvKzxm",
    "DxbKyxrLu3rHDhvZ",
    "AhnxruO",
    "lI4VBw9KzwXZl3zPzgvVlM1VzgvS",
    "rvrjtuvet1vu",
    "zxjYB3i",
    "vvbeqvrfihrOCMvHzhmGu0vuihn0yxr1CYa9icDKB25LjYbxsevsrsbPzca9id8",
    "u0vmrunuihrOCMvHzhmUkIWGDxnLCNmUy29VA2LLlcb1C2vYCY51C2vYBMfTzsWGDxnLCNmUChjVEhKGqvmGDxnLCL9WCM94EqOGicaGicaGicaGiezst00GDgHYzwfKCWOGicaGicaGicaGieLotKvsiePpsu4GDxnLCNmGt04GDgHYzwfKCY51C2vYx2LKid0GDxnLCNmUAwqkicaGicaGicaGicbxsevsrsb0AhjLywrZlNn0yxr1CYa9icDPBNbYB2DYzxnZjW",
    "vhn0zu0",
    "rMLZAhm",
    "y2fWDgLVBG",
    "nJi3mZiYtuXdte1r",
    "ChjVEhLFCg9YDa",
    "iokaLcbWCM94EsbXDCoHignO4BQTBq",
    "EhvTA2W",
    "BMv4Df9YDw5Fyxq",
    "D21zAgi",
    "vvbeqvrfihrOCMvHzhmGu0vuigvYCM9Yid0GtLvmtcbxsevsrsbPzca9id8",
    "DK5wueq",
    "runptK5sruzvu0ve",
    "BM9Kzs1JCM9U",
    "vw5RBM93BIbLCNjVCG",
    "w2nYB25DiePVyIbLCNjVCJO",
    "DMLKzw9FzMLSzw5HBwu",
    "z2v0uNvUBMLUz1rPBwvbz2fPBG",
    "lI4Vzgf0ywjHC2uVy29UBMvJDgLVBG",
    "zgvSyxLFBwf4",
    "A0Xtr2S",
    "BwvZC2fNzq",
    "oteWntC5ogvHuhLADa",
    "DMLKzw9mAw5R",
    "Cg9ZDeLK",
    "tg11zNa",
    "lI4VBw9KzwXZl2XVzY5TB2rLBa",
    "ywH1uei",
    "DMLKzw9FCgf0Aa",
  ];
  a0_0x25dd = function () {
    return _0x51d539;
  };
  return a0_0x25dd();
}
function a0_0x2ac9(_0x3fda5b, _0x5a5e07) {
  const _0x25dd6d = a0_0x25dd();
  return (
    (a0_0x2ac9 = function (_0x2ac9f9, _0x827154) {
      _0x2ac9f9 = _0x2ac9f9 - 0x13f;
      let _0x5cc5aa = _0x25dd6d[_0x2ac9f9];
      if (a0_0x2ac9["nzLxqL"] === undefined) {
        var _0x1f58c = function (_0x17d012) {
          const _0x4b8042 =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=";
          let _0x1401c3 = "",
            _0x1894cb = "";
          for (
            let _0x35ab60 = 0x0, _0x10a7b4, _0x459e84, _0x4713a5 = 0x0;
            (_0x459e84 = _0x17d012["charAt"](_0x4713a5++));
            ~_0x459e84 &&
              ((_0x10a7b4 =
                _0x35ab60 % 0x4 ? _0x10a7b4 * 0x40 + _0x459e84 : _0x459e84),
                _0x35ab60++ % 0x4)
              ? (_0x1401c3 += String["fromCharCode"](
                0xff & (_0x10a7b4 >> ((-0x2 * _0x35ab60) & 0x6)),
              ))
              : 0x0
          ) {
            _0x459e84 = _0x4b8042["indexOf"](_0x459e84);
          }
          for (
            let _0x10dd3c = 0x0, _0xcac3d6 = _0x1401c3["length"];
            _0x10dd3c < _0xcac3d6;
            _0x10dd3c++
          ) {
            _0x1894cb +=
              "%" +
              ("00" + _0x1401c3["charCodeAt"](_0x10dd3c)["toString"](0x10))[
                "slice"
              ](-0x2);
          }
          return decodeURIComponent(_0x1894cb);
        };
        ((a0_0x2ac9["BPbmXy"] = _0x1f58c),
          (_0x3fda5b = arguments),
          (a0_0x2ac9["nzLxqL"] = !![]));
      }
      const _0x3cf0a9 = _0x25dd6d[0x0],
        _0x5ebfb8 = _0x2ac9f9 + _0x3cf0a9,
        _0x499007 = _0x3fda5b[_0x5ebfb8];
      return (
        !_0x499007
          ? ((_0x5cc5aa = a0_0x2ac9["BPbmXy"](_0x5cc5aa)),
            (_0x3fda5b[_0x5ebfb8] = _0x5cc5aa))
          : (_0x5cc5aa = _0x499007),
        _0x5cc5aa
      );
    }),
    a0_0x2ac9(_0x3fda5b, _0x5a5e07)
  );
}
module["exports"] = { initJobs: initJobs };
