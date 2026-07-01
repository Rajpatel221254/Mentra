import app from "./src/app.js";
import { config } from "./src/config/config.js";
import { connectToDB } from "./src/config/db.js";

connectToDB();

app.listen(config.PORT, () => {
  console.log(`Server is running on port ${config.PORT}`);
});
