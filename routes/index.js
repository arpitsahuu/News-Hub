var express = require("express");
var router = express.Router();
const User = require("../models/UserModels");
const passport = require("passport");
const localStratagy = require("passport-local");
const Article = require("../models/ArticleModels");
passport.use(new localStratagy(User.authenticate()));
const imageupload = require("../helper/multer").single("image");
const proimageupload = require("../helper/profileMulter").single("avatar");
const fs = require("fs");

/* GET home page. */
router.get("/", async function (req, res, next) {
  const articles = await Article.find().sort({ _id: -1 }).limit(20);
  const toparticles = await Article.find().sort({ views: -1 }).limit(5);
  res.render("index", {
    title: "News",
    isLoggedIn: req.user ? true : false,
    user: req.user,
    articles,
    toparticles,
  });
});

/* GET about page. */
router.get("/About", async function (req, res, next) {
  res.render("about", {
    title: "About",
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});

/* GET contacts page. */
router.get("/Contacts", async function (req, res, next) {
  res.render("contacts", {
    title: "About",
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});

/* GET Signin page. */
router.get("/signin", function (req, res, next) {
  res.render("signin", { title: "Signin" });
});

/* post Signin route with Passport authentication . */
router.post(
  "/signin",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/signup",
  }),
  function (req, res, next) {}
);

/* GET Signup page. */
router.get("/signup", function (req, res, next) {
  res.render("signup", { title: "signup" });
});

// POST Sighup route.
router.post("/signup", async function (req, res, next) {
  const { username, email, password } = req.body;
  await User.register({ username, email }, password)
    .then((user) => {
      res.redirect("/signin");
    })
    .catch((err) => res.send(err));
});

/* GET forgetpassword page. */
router.get("/forgetpassword", function (req, res, next) {
  res.render("forgetpassword", { title: "Forgetpassword" });
});

/* POST forgetpassword Route. */
router.post("/send-mail", async function (req, res, next) {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.send("user not found");
  var code = `${Math.floor(Math.random() * 9000 + 1000)}`;

  //------ NODEMAILER
});

/* GET CODE page. */
router.get("/code/:id", async function (req, res, next) {
  res.render("getcode", { title: "code", id: req.params.id });
});

// POST CODE ROUTE.
router.post("/code/:id", async function (req, res, next) {
  const user = await User.findById(req.params.id);
  if (user.code == req.body.code) {
    await User.findByIdAndUpdate(user._id, { code: "" });
    res.redirect("/forgetpassword/" + user._id);
  } else {
    res.send("invalit code");
  }
});

router.get("/forgetpassword/:id", async function (req, res, next) {
  res.render("forgetpassword", { title: "Forgetpassword", id: req.params.id });
});

router.post("/forgetpassword/:id", async function (req, res, next) {
  var currentUser = await User.findOne({ _id: req.params.id });
  currentUser.setPassword(req.body.password, async (err, info) => {
    if (err) res.send(err);
    await currentUser.save();
    res.redirect("/signin");
  });
});

/* GET alticals page. */
router.get("/articles/:Category", isLoggedIn, async function (req, res, next) {
  const Categoryname = req.params.Category;
  const articles = await Article.find({ Category: Categoryname });
  const Toparticles = await Article.find({ Category: Categoryname })
    .sort({ Views: -1 })
    .limit(10);
  res.render("articles", {
    title: "Articles",
    isLoggedIn: req.user ? true : false,
    user: req.user,
    articles,
    Toparticles,
  });
});

router.get("/article/:id", isLoggedIn, async function (req, res, next) {
  const articleId = req.params.id;
  const article = await Article.findById(articleId);
  article.Views += 1;
  await article.save();
  res.render("article", {
    title: "News",
    isLoggedIn: req.user ? true : false,
    user: req.user,
    article,
  });
});

// router.get('/articles', function(req, res, next) {
//   res.render('articles', { title: 'News' });
// });

/* GET profile page. */
router.get("/profile", isLoggedIn, function (req, res, next) {
  if (req.user.isAdmin) {
    return res.redirect("adminProfile");
  }
  if (req.user.isAuthor) {
    return res.redirect("authorprofile");
  }
  console.log(req.user);
  res.render("profile", {
    title: "Profile",
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});

/* Post Write Artical page for Author. */
router.post("/profile-upload", isLoggedIn, async function (req, res, next) {
  proimageupload(req, res, function (err) {
    if (err) {
      console.log("ERROR>>>>>", err.message);
      res.send(err.message);
    }
    if (req.file) {
      if (req.user.avatar !== "default.png") {
        fs.unlinkSync("./public/images/profileimages/" + req.user.avatar);
      }
      req.user.avatar = req.file.filename;
      req.user
        .save()
        .then(() => {
          // res.redirect("/update/" + req.user._id);
          res.redirect("/profile");
        })
        .catch((err) => {
          res.send(err);
        });
    }
  });
});

router.get("/updateuser", isLoggedIn, function (req, res, next) {
  res.render("updateuser", {
    title: "Update user",
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});

// Route to handle updating user information
router.post("/updateuser", isLoggedIn, async (req, res) => {
  try {
    const user = req.user;
    const { email, status, username } = req.body;
    console.log(user);
    console.log(req.body);

    // Find the user by ID
    // const user = await User.findById(id);

    // Update the user information if provided
    if (email) {
      user.email = email;
    }
    if (status) {
      user.status = status;
    }
    if (username) {
      user.username = username;
    }
    // Save the updated user to the database
    await user.save();

    res.redirect("/profile");
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while updating user information" });
  }
});

// user logout
router.get("/logout", isLoggedIn, function (req, res, next) {
  req.logout(() => {
    res.redirect("/signin");
  });
});

// Route to handle liking an article
router.post("/articles-like/:id", isLoggedIn, async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have implemented user authentication

    // Check if the user and article exist
    const user = await User.findById(userId);
    const article = await Article.findById(req.params.id);

    if (!user || !article) {
      return res.status(404).json({ error: "User or article not found" });
    }

    // Add the article's ID to the user's liked articles array
    user.articles.push(article._id);
    await user.save();

    res.redirect(`/articles/${article._id}`);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while liking the article" });
  }
});

// Route to handle liking an article
router.post("/article/save/:id", isLoggedIn, async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have implemented user authentication

    // Check if the user and article exist
    // const user = await User.findById(userId);
    const article = await Article.findById(req.params.id);

    if (!user || !article) {
      return res.status(404).json({ error: "User or article not found" });
    }

    // Add the article's ID to the user's liked articles array
    user.SaveArticals.push(article._id);
    await user.save();

    res.redirect(`/articles/${article._id}`);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while liking the article" });
  }
});

/* GET Auther page. */
router.get("/authorProfile", isLoggedIn, async function (req, res, next) {
  const author = req.user;
  // Get the current date and time
  const currentDate = new Date();
  const loginTime = currentDate.toLocaleTimeString();

  // Update the user's login time and date
  author.lastSignin = {
    date: currentDate,
    time: loginTime,
  };

  await author.save();

  res.render("authorprofile", {
    title: "author-profile",
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});

/* GET Admin page. */
router.get("/adminProfile", isLoggedIn, function (req, res, next) {
  res.render("adminprofile", {
    title: "author-profile",
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});

/* GET Write Artical page for Author. */
router.get("/write-article", isLoggedIn, isAuthor, function (req, res, next) {
  res.render("writearticle", {
    title: "Write-Article",
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});

/* Post Write Artical page for Author. */
router.post(
  "/write-article",
  imageupload,
  isAuthor,
  async function (req, res, next) {
    try {
      const { Title, Content, Category } = req.body;
      const Author = req.user.id;
      // console.log(req.body)
      // console.log(req.file.filename)
      // const Image = req.file.filename;
      console.log(req.file.filename);
      const Image = req.file.filename;

      const article = await Article.create({
        Title,
        Content,
        Category,
        Author: req.user.id,
        Image,
      });

      // if(image){
      //   article.Image = image;
      // }

      // console.log(article)

      await article
        .save()
        .then(() => {
          res.redirect("/write-article");
        })
        .catch((err) => {
          res.send(err);
        });
    } catch (err) {
      res.send(err);
    }
  }
);

/* GET find Artical page for Author.to find articles */
router.get("/find-article", async function (req, res, next) {
  const articles = await Article.find();
  res.render("findarticle", {
    title: "find-Article",
    isLoggedIn: req.user ? true : false,
    user: req.user,
    articles,
  });
});

/* GET edite Artical page for Author*/
router.get(
  "/edit-article/:id",
  isLoggedIn,
  isAuthor,
  async function (req, res, next) {
    const article = await Article.findById(req.params.id);
    console.log(article);
    // const id = req.params.id;
    // console.log(id)
    // const article = Article.find()
    // res.json(article)
    res.render("editarticle", {
      title: "Edit-Article",
      isLoggedIn: req.user ? true : false,
      user: req.user,
      article,
    });
  }
);

/* Post edite Artical page for Author. */
router.post("/edit-article/:id", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    const { Title, Content, Category } = req.body;
    console.log(article);
    // Update the article information if provided
    if (Title) {
      article.Title = Title;
    }
    if (Content) {
      article.Content = Content;
    }
    if (Category) {
      article.Category = Category;
    }
    // Save the updated article to the database
    await article.save();

    res.redirect("/authorprofile");
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while updating user information" });
  }
});

/*  delete Artical page for Author. */
router.get("/delete-article/:id", async (req, res) => {
  try {
    console.log(req.params.id);
    const articleid = req.params.id;
    const article = await Article.findOneAndDelete({ id: articleid });

    res.redirect("back");
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while deleting the article" });
  }
});

/*  Get find users pages */
router.get("/find-users", isLoggedIn, isAdmin, async function (req, res, next) {
  const users = await User.find();
  res.render("findusers", {
    title: "find-Article",
    isLoggedIn: req.user ? true : false,
    user: req.user,
    users,
  });
});

router.get(
  "/delete-user/:id",
  isLoggedIn,
  isAdmin,
  async function (req, res, next) {
    try {
      const userid = req.params.id;
      await User.findOneAndDelete({ id: userid });
      res.redirect("back");
    } catch (error) {
      res.send(error);
    }
  }
);

// /* Get route for make Author */
// router.get("/make-author/:id",isLoggedIn,isAdmin, async function (req, res, next) {
//   const userid = req.params.id ;
//   const user = await User.findOne({id:userid})
//   if(!user){
//     return res.json({ error: 'User not found' });
//   }

//   user.isAuthor = true;

//   await user.save();

//   res.redirect("/find-users");
// });

/*  Get find Authors pages */
router.get(
  "/find-Authors",
  isLoggedIn,
  isAdmin,
  async function (req, res, next) {
    const authors = await User.find({ isAuthor: "true" });
    console.log(authors);
    res.render("findauthor", {
      title: "find-Article",
      isLoggedIn: req.user ? true : false,
      user: req.user,
      authors,
    });
  }
);

/* Post edite Artical page for Author. */
router.get("/terminate-Author/:id", async (req, res) => {
  try {
    const authorid = req.params.id;
    const author = await User.findById(authorid);
    console.log(author);
    author.isAuthor = false;
    // Save the updated article to the database
    await author.save();

    res.redirect("/find-Authors");
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while updating user information" });
  }
});

router.get(
  "/feed-author",
  isLoggedIn,
  isAdmin,
  async function (req, res, next) {
    const users = await User.find({ isAuthor: false, isAdmin: false });
    res.render("makeauthor", {
      title: "Make-author",
      isLoggedIn: req.user ? true : false,
      user: req.user,
      users,
    });
  }
);

/*  convert the user to Author */
router.get(
  "/make-author/:id",
  isLoggedIn,
  isAdmin,
  async function (req, res, next) {
    const authorid = req.params.id;
    const author = await User.findById(authorid);
    console.log(author);

    author.isAuthor = true;

    await author.save();

    res.redirect("back");
  }
);

router.get(
  "/author-delete/:id",
  isLoggedIn,
  isAdmin,
  async function (req, res, next) {
    try {
      const authorid = req.params.id;
      await User.findById({ id: authorid });
      if (!author) {
        return res.json({ error: "Author not found" });
      }
      res.redirect("/find-Author");
    } catch (error) {
      res.send(error);
    }
  }
);

/*  Get find Authors pages */
router.get(
  "/Article-reach",
  isLoggedIn,
  isAdmin,
  async function (req, res, next) {
    const articles = await Article.find();
    res.render("articlereach", {
      title: "find-Article",
      isLoggedIn: req.user ? true : false,
      user: req.user,
      articles,
    });
  }
);

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/signin");
  }
}

function isAuthor(req, res, next) {
  if (req.isAuthenticated() && req.user.isAuthor === true) {
    next();
  } else {
    res.send("Not Authenticated person ");
  }
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.isAdmin === true) {
    next();
  } else {
    res.send("Not Authenticated person ");
  }
}

module.exports = router;
