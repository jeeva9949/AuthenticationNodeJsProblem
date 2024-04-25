const express = require('express')
const app = express()

app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

const path = require('path')

const dbpath = path.join(__dirname, 'userData.db')
let db = null

const initialiseDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('this is running on server 3000')
    })
  } catch (e) {
    console.log(`ERROR is ${e.message}`)
    process.exit(1)
  }
}
initialiseDBAndServer()

// Register API using post method

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const getUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbuser = await db.get(getUserQuery)
  if (dbuser === undefined) {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const hashedPassword = bcrypt.hash(password, 15)
      const createUserQuery = `INSERT INTO 
      user (username,name,password,gender,location) 
      VALUES (
        '${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}'
        );`
      await db.run(createUserQuery)
      response.send('User created successfully')
      response.status(200)
    }
  } else {
    // user already exits
    response.status(400)
    response.send('User already exists')
  }
})

// login API using post method

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const IsuserexitsQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbResponse = await db.get(IsuserexitsQuery)
  if (dbResponse === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const compareHasedPassword = await bcrypt.compare(
      password,
      dbResponse.password,
    )
    if (compareHasedPassword === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

// /change-password by using put request method

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const getPasswordQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbResponse = await db.get(getPasswordQuery)
  const isPasswordMatch = await bcrypt.compare(dbResponse.password, oldPassword)
  if (dbResponse === undefined) {
    response.status(400)
    response.send('Invalid user')
  } 
  else {
    if (isPasswordMatch === true) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } 
      else {
        const hasedpassword = await bcrypt.hash(newPassword, 10)
        const updatepasswordquery = `UPDATE user SET password = '${hasedpassword}' WHERE username = '${username}'`
        await db.run(updatepasswordquery)
        response.status(200)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
