let spawn = require("child_process").spawn;
let redis = spawn("./src/scripts/redis/starting.sh");
redis.stdout.on("data", (data) => {
  console.log("STARTING....");
  console.log(data);
});
redis.stderr.on("data", (err) => {
  console.log("ERROR: ", err);
});
