const app = require("./app")
const port = 5000;

app.get("/",(req,res)=>{
  res.render('index')
})

app.listen(port,()=>{
  console.log(`server is running at http://localhost:${port}`);
})