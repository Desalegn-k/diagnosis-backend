const express = require("express");
const cors = require("cors");
// require diagnosisRoutes and authRoutes
const diagnosisRoutes = require("./routes/diagnosisRoutes");
const authRoutes = require("./routes/authRoutes");


const app = express();
app.use(cors());
app.use(express.json());

// Add this route before your other routes
app.get('/api/health/prolog', (req, res) => {
  const { exec } = require('child_process');
  exec('swipl --version', (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ 
        prolog_installed: false, 
        error: error.message,
        stderr: stderr 
      });
    }
    res.json({ 
      prolog_installed: true, 
      version: stdout.trim(),
      node_version: process.version
    });
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/diagnosis", diagnosisRoutes);

app.use("/api/symptoms", require("./routes/symptomRoutes"));


app.listen(5000, () => {
  console.log("Backend running on port 5000");
});
