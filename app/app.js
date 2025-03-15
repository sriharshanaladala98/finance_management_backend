const express = require("express")
const cors= require("cors")

const app = express();
const port = 3550
app.use(cors());
// app.use(express.json);

app.get("/",(req, res)=>{
    res.send("hello from server")
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})