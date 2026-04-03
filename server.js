const express = require("express");
const cors = require("cors");
// require diagnosisRoutes and authRoutes
const diagnosisRoutes = require("./routes/diagnosisRoutes");
const authRoutes = require("./routes/authRoutes");


const app = express();
app.use(cors());
app.use(express.json());

// Add this route before your other routes
// Add to server.js
app.get('/api/debug/tau', (req, res) => {
  try {
    const pl = require('tau-prolog');
    res.json({ 
      status: 'ok', 
      version: pl.version || 'unknown',
      message: 'Tau Prolog loaded successfully' 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/diagnosis", diagnosisRoutes);

app.use("/api/symptoms", require("./routes/symptomRoutes"));


app.listen(5000, () => {
  console.log("Backend running on port 5000");
});
