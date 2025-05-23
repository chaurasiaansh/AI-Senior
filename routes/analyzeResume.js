import express from "express";
import pdfParse from "pdf-parse";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        if (!req.files || !req.files.resume) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const resumeFile = req.files.resume;
        const pdfData = await pdfParse(resumeFile.data);

        if (!pdfData.text.trim()) {
            return res.status(400).json({ error: "No readable text found in the PDF." });
        }

        res.json({ extractedText: pdfData.text });
    } catch (error) {
        console.error("Error analyzing resume:", error);
        res.status(500).json({ error: "Server error while analyzing the resume." });
    }
});

export default router;
