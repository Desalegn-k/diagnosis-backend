const express = require("express");
const cors = require("cors");
// require diagnosisRoutes and authRoutes
const diagnosisRoutes = require("./routes/diagnosisRoutes");
const authRoutes = require("./routes/authRoutes");


const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/diagnosis", diagnosisRoutes);

app.use("/api/symptoms", require("./routes/symptomRoutes"));


app.listen(5000, () => {
  console.log("Backend running on port 5000");
});
