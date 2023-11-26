require("dotenv").config();
const { Telegraf } = require("telegraf");
const express = require("express");
const app = express();
const expport = process.env.PORT || 5000;
const bot = new Telegraf(process.env.BOT_TOKEN);
const axios = require("axios").default;

const STOARGE_CHANNEL = process.env.STOARGE_CHANNEL;

bot.hears("ping", (ctx) => {
  ctx.reply("pong");
});

bot.launch().then(() => {
  console.log("bot launched");
});

const multer = require("multer");
const { redis } = require("./redis");
const upload = multer({ storage: multer.memoryStorage() });

app.get("/", (req, res) => {
  res.send("FileBot");
});

app.post("/img", upload.single("img"), async (req, res) => {
  try {
    const uploadedDoc = await bot.telegram.sendPhoto(STOARGE_CHANNEL, {
      source: req.file.buffer,
      filename: req.file.originalname,
    });

    res.send(
      "http://tfile.thotero.com:2095/img/" +
        uploadedDoc?.photo[uploadedDoc?.photo.length - 1].file_id
    );
  } catch (err) {
    console.log(err);
  }
});

app.get("/img/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;

    let fileUrl = await redis.GET(`file:${fileId}`);
    if (!fileUrl) {
      try {
        fileUrl = (await bot.telegram.getFileLink(fileId)).toString();
      } catch (err) {
        console.log("tg err", err);
        if (err?.response?.error_code == 400) {
          return res.status(404).send("404 - file not found");
        }
        return res.status(500).send(err.response);
      }
      await redis.SETEX(`file:${fileId}`, 55 * 60, fileUrl.toString());
      //   return res.setHeader("from-cache", "true").send({ ok: true });
    } else {
      res.setHeader("from-cache", "true");
    }

    const { data } = await axios.get(fileUrl, { responseType: "stream" });
    data.pipe(res);

    // console.log("ploadedDoc", uploadedDoc);

    // res.send(fileUrl);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});
app.listen(expport, () => {
  console.log(`Listening on port ${expport}`);
});
// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
