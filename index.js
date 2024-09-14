const express = require("express");
const { UserModel, TodoModel } = require("./db");
const { auth, JWT_SECRET } = require("./auth");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;


mongoose.connect("mongodb://localhost:27017/monog")

const app = express();
app.use(express.json());

app.post("/signup", [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty()
], async function (req, res) {
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;

    const data = await UserModel.findOne({ email })

    if (data) {
        return res.status(411).json({
            message: "user already registered"
        })
    }



    const hashpassword = await bcrypt.hash(password, SALT_ROUNDS)
    await UserModel.create({
        email: email,
        password: hashpassword,
        name: name
    });

    res.json({
        message: "You are signed up"
    })
});


app.post("/signin", async function (req, res) {
    const email = req.body.email;
    const password = req.body.password;


    const response = await UserModel.findOne({ email: email });

    const invalidPass = await bcrypt.compare(password, response.password);

    if (!response) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (!invalidPass) {
        return res.status(404).json({ message: 'Invalid password' });
    }

    if (response) {
        const token = jwt.sign({
            id: response._id.toString()
        }, JWT_SECRET);

        res.json({
            token
        })
    } else {
        res.status(403).json({
            message: "Incorrect creds"
        })
    }
});


app.post("/todo", auth, async function (req, res) {
    const userId = req.userId;
    const title = req.body.title;
    const done = req.body.done;

    await TodoModel.create({
        userId,
        title,
        done
    });

    res.json({
        message: "Todo created"
    })
});


app.get("/todos", auth, async function (req, res) {
    const userId = req.userId;

    const todos = await TodoModel.find({
        userId
    });

    res.json({
        todos
    })
});

app.get('/', async (req, res) => {
    const data = await UserModel.find({})
    res.json({
        data: data
    })

})

app.listen(3000);