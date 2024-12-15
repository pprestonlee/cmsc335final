const http = require("http");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') }) 
const uri = process.env.MONGO_CONNECTION_STRING;
const databaseAndCollection = {db: "JokeDB", collection:"userData"};
const { MongoClient, ServerApiVersion } = require('mongodb');

const express = require("express");
const app = express();
const fs = require("fs");
const mongoose = require('mongoose');
const User = require('./models/user');
const axios = require('axios');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

const portNumber = 10000;

process.stdin.setEncoding("utf8");

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.use(express.static('public'));

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/save-user', async (req, res) => {
    const { name, email } = req.body;

    const jokeResponse = await axios.get(process.env.JOKE_API_URL, {
        headers: { 'Content-Type': 'application/json' }
    });
    const joke = jokeResponse.data.setup + " " + jokeResponse.data.punchline;

    // Check if a user with the provided email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        // If the user exists, render the jokes page with their existing favorite joke
        res.render('jokes', { 
            name: existingUser.name, 
            email: existingUser.email, 
            joke: joke,
            fav_joke: existingUser.favoriteJoke
        });
    } else {
        // Create a new user
        const newUser = new User({ name, email, favoriteJoke: "" });
        await newUser.save();

        // Render the jokes page with the new user's information
        fav_joke = "";
        res.render('jokes', { name, email, joke, fav_joke });
    }
});

app.post('/update-favorite-joke', async (req, res) => {
    const { email, joke } = req.body;

    try {
        // Find the user by email and update their favoriteJoke
        const updatedUser = await User.findOneAndUpdate(
            { email },               // Query to find the user
            { favoriteJoke: joke },  // Update their favoriteJoke field
            { new: true }            // Return the updated document
        );

        if (updatedUser) {
            console.log(`Favorite joke updated for ${email}: ${joke}`);
            fav_joke = joke;
            res.render('update', { email, fav_joke })
        } else {
            res.status(404).send('User not found.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating favorite joke.');
    }
});

app.listen(portNumber);
console.log(`Web server started and running at at http://localhost:${portNumber}`);
console.log(`Stop to shutdown the server: `);

process.stdin.on("data", (data) => {
    if (data.trim() === "stop") {
        console.log("Shutting down the server");
        process.exit(0);
    }
    else {
        console.log(`Invalid command: ${data.trim()}`);
        console.log(`Stop to shutdown the server: `);

    }
    process.stdin.resume();
});