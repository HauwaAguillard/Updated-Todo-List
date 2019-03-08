//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todoListV3Db", {useNewUrlParser: true});

const today = date.getDay();
const itemSchema = {
  name: String
};

const Item = mongoose.model("item", itemSchema);

const item1 = new Item({
  name: "Welcome to your todo List"
});

const item2 = new Item({
  name: "Hit the add button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems  = [item1, item2, item3];

const listSchema ={
  name: String,
  items: [itemSchema]
}
const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
  Item.find({} , (err, foundItems)=>{
    if(err) console.log(err);

    if(foundItems.length === 0){
      //Inserts default items to mongoose database
      Item.insertMany(defaultItems, (err) =>{
        if(err) console.log(err);
        console.log("Insertion Successful");
      });
      res.redirect("/");
    }else{
      res.render("list", {title: today, newListItems:foundItems});
    }
  });
});

app.post("/" , (req, res) => {
const itemName = req.body.newItem;
const listName = req.body.list;

const item = new Item({
  name: itemName
});

if(listName === today){
  item.save();
  res.redirect("/");
}else{
  List.findOne({name: listName}, (err, foundList)=>{
    foundList.items.push(item);
    foundList.save();
    res.redirect("/" + listName);
  });

}

});

app.post("/delete", (req, res) => {
const checkedItemId = req.body.checkbox;
const listName = req.body.listName;

if(listName === today){
  Item.findByIdAndRemove(checkedItemId, (err) =>{
    if(err) console.log(err);
    console.log("Successfully deleted one item");
    res.redirect("/");
  });
}else{
  List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList)=>{
    if(!err)
    res.redirect("/" + listName);
  });
}
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/contact",  (req, res) =>{
  res.render("contact");
});

app.get("/myList",  (req, res) =>{
  res.render("myList");
});

app.get("/:customListName", (req,res) => {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name:customListName}, (err, foundList) =>{
    if(!err){
      if(!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }else{
        //Show an existing list
        res.render("list", {title: foundList.name, newListItems: foundList.items});
      }
    }
  });


});


app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
