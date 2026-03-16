const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).send("All fields are required");

  }
  // check the length of the password
  if(password.length<8){
     return res.status(400).send("The password length at least 8 characters");


  }

  // Check if email already registered
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, users) => {
    if (err) return res.status(500).send("Server error");

    if (users && users.length) {
      return res.status(409).send("This email is registered");
    }

    const hashed = bcrypt.hashSync(password, 10);
    db.query(
      "INSERT INTO users (full_name,email,password) VALUES (?,?,?)",
      [full_name, email, hashed],
      (insertErr) => {
        if (insertErr) return res.status(500).send("Server error");
        res.send("Registered");
      },
    );
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Both fields are required" });
  }

  db.query("SELECT * FROM users WHERE email=?", [email], (err, users) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (!users.length)
      return res.status(401).json({ message: "User not found" });

    const user = users[0];

    if (!bcrypt.compareSync(password, user.password))
      return res.status(401).json({ message: "Wrong password" });

    // 🔥 extract first name
    const firstName = user.full_name.split(" ")[0];

    const token = jwt.sign({ id: user.id, firstName }, "secret", {
      expiresIn: "1d",
    });

    res.json({
      token,
      firstName, // 👈 send it explicitly
    });
  });
};
