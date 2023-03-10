const express = require("express");
const router = new express.Router();
const NewextUser = require("../modals/newUser");
const auth = require("../middleware/auth");
const bcrypt = require("bcrypt");

router.get("/user", (req, res) => {
    res.send("user side");
});

router.post("/signup", (req, res) => {
    const { fname, email, password, lname, badgeImg } = req.body;
    try {
        NewextUser.findOne({ email: email }, async (err, user) => {
            if (user) {
                res.send({ message: "User already regestered" });
            } else {
                try {
                    const user = new NewextUser({ fname, lname, email, password, badgeImg });
                    const token = await user.generateAuthToken();
                    res.cookie("jwt", token, { httpOnly: true, SameSite: false });
                    const createUser = await user.save();
                    res.send({ user: createUser }).status(201);
                } catch (error) {
                    console.log(error);
                }
            }
        })
    } catch (error) {
        res.send(error).status(400);
    }
});

router.post("/signin", (req, res) => {
    const { email, password } = req.body;
    try {
        NewextUser.findOne({ email: email }, async (err, user) => {
            if (user) {
                const isMatch = await bcrypt.compare(password, user.password);
                if (isMatch) {
                    const token = await user.generateAuthToken();
                    res.cookie("jwt", token, { httpOnly: true, SameSite: false });
                    res.send({ user: user }).status(201);
                }
                else {
                    res.send({ message: "Invalid credentials" }).status(401);
                }
            }
            else {
                res.send({ noUser: "User not found" }).status(401);
            }
        })
    } catch (error) {
        res.send(error).status(400);
    }
});

router.get("/signout", auth, async (req, res) => {
    try {
        res.clearCookie("jwt");

        //logout only from single device
        req.user.tokens = req.user.tokens.filter((currElm) => {
            return currElm.token !== req.token;
        })

        await req.user.save();
        res.send({ message: "logedout" }).status(200);
    } catch (error) {
        res.status(500).send(error);
    }
})

module.exports = router;