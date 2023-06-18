import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

const app = express();

mongoose
  .connect("mongodb://127.0.0.1:27017", { dbname: "backend" })
  .then(() => {
    console.log("Database Connected");
  })
  .catch((e) => {
    console.log(e);
  });

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const usermodel = mongoose.model("Users", UserSchema);

//using Miidlewares
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decoded = jwt.verify(token, "bsdfksdkbsdkjbk");
    req.user = await usermodel.findById(decoded);
    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/", isAuthenticated, (req, res) => {
  res.render("logout", { name: req.user.name });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  let user = await usermodel.findOne({ email: email });
  if (user) {
    return res.redirect("/login");
  }
  const hashedpass=await bcrypt.hash(password,10)
  user = await usermodel.create({
    name: name,
    email: email,
    password: hashedpass,
  });

  const token = jwt.sign({ _id: user._id }, "bsdfksdkbsdkjbk");
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let user = await usermodel.findOne({ email: email });
  if (!user) {
    return res.redirect("/register");
  }
  const isMatch = await bcrypt.compare(password,user.password);
  if (!isMatch) {
    return res.render("login", { email: email, message: "Incorrect Password" });
  }
  const token = jwt.sign({ _id: user._id }, "bsdfksdkbsdkjbk");
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

app.listen(2000, () => {
  console.log("Server is listening");
});
