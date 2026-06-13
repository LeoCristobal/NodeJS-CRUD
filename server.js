import app from "./app.js";
import { PORT } from "./config/env.js";
import connectToDb from "./database/database.js";

app.listen(PORT, async () => {
  console.log(`listening on http://localhost:${PORT}`);
  await connectToDb();
});
