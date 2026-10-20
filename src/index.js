

import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path: "./.env"
})


connectDB();
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT || 8000}`);
    })
});

.catch((error) => {
    console.error("MONGODB db Connection failed", error);
    process.exit(1);
}
