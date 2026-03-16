const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // console.log("AUTH HEADER:", authHeader); // DEBUG

  if (!authHeader) {
    return res.status(401).json({ message: "No Authorization header" });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Invalid token format" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, "secret");
    req.user = decoded; // { id }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token verification failed" });
  }
};
