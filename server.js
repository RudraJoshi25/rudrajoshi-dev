require("dotenv").config();
const express = require("express");
const router = express.Router();
const cors = require("cors");
const nodemailer = require("nodemailer");

// server used to send emails
const app = express();
app.use(cors());
app.use(express.json());
app.use("/", router);
app.listen(5000, () => console.log("Server Running on port 5000"));

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_TO = process.env.EMAIL_TO || EMAIL_USER;

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn("Warning: EMAIL_USER or EMAIL_PASS is not set. Emails will fail to send.");
}

const contactEmail = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  },
});

contactEmail.verify((error) => {
  if (error) {
    console.error("Nodemailer verification error:", error);
  } else {
    console.log("Ready to send emails");
  }
});

router.post("/contact", async (req, res) => {
  const name = `${req.body.firstName || ""} ${req.body.lastName || ""}`.trim();
  const email = req.body.email;
  const message = req.body.message;
  const phone = req.body.phone;

  const mail = {
    from: EMAIL_USER,
    replyTo: email || undefined,
    to: EMAIL_TO,
    subject: "Contact Form Submission - Portfolio",
    html: `<p>Name: ${escapeHtml(name || "N/A")}</p>
           <p>Email: ${escapeHtml(email || "N/A")}</p>
           <p>Phone: ${escapeHtml(phone || "N/A")}</p>
           <p>Message: ${escapeHtml(message || "N/A")}</p>`,
  };

  try {
    await contactEmail.sendMail(mail);
    res.json({ code: 200, status: "Message Sent" });
  } catch (error) {
    console.error("Error sending mail:", error);
    res.status(500).json({ code: 500, status: "Message Failed" });
  }
});
