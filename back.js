import body from 'body-parser'
import express from 'express'
import fs from 'fs';
import path from 'path'

const app = express();
const port = 3000;

app.use(express.static(path.resolve('static')));
app.use(body.json());
app.use(body.urlencoded());
let f = true;

const d = {
  login: 'polytech',
  password: '2021year'
}

app.get('/login', (req, res) => {
  const data = {
    isAuth: f
  } 

  res.json(data);
});

app.post('/login', (req, res) => {
  const data = {
    login: req.body.login,
    password: req.body.password
  }
  
  f = data.login === d.login && data.password === d.password;
  
  res.redirect(`http://localhost:${port}/`);
});

app.get('/logout', (req, res) => {
  f = false;
  res.end();
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});
