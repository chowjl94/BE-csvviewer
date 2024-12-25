import express from "express";
import fileRoutes from "./routes/fileRoutes";
import cors from "cors";

const app = express();
const port = 3000;

app.use(cors());

app.use("/api/files", fileRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});
