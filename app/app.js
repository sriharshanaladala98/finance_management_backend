const express = require("express");
const cors = require("../config/cors"); // Import CORS middleware
require("../config/database"); // Connect to MongoDB
const app = express();
const port = 3550;

// Use middleware
app.use(cors); // Apply CORS
app.use(express.json()); // Enable JSON parsing

app.get("/", (req, res) => {
    res.send("Hello from server");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
