const { createClient } = require("redis");

const redisClient = createClient({
  url: `redis://:${process.env.REDIS_PASS}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  database: parseInt(process.env.REDIS_DB_INDEX),
});
redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.connect().then(async () => {
  console.log("Redis Connected");
  //   LoadSettings();
});

module.exports.redis = redisClient;
