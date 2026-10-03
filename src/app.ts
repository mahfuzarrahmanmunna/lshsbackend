import express from "express";
import cors from "cors";
import prisma from "./lib/prisma.js";
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Sales CRM API is running",
    });
});

app.get("/api/v1/users", async (req, res) => {
    try {
        const users = await prisma.user.findMany();

        res.json(users);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch users",
        });
    }
});

const PORT = 5000;;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

export default app;