const express = require("express");
const app = express();
const _=require("lodash");
var favicon = require('serve-favicon');
app.use(favicon(__dirname + '/public/images/favicon.ico'));

// mongoose for mongo db
const mongoose = require("mongoose");
//Using body-parser
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

const today = new Date();
    let options = {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    }
const date = today.toLocaleDateString("en-US", options);

//The public folder which holds the CSS
app.use(express.static("public"));

// connect mongoose 
mongoose.connect("mongodb+srv://admin:8FYqjbOzRbvu7GJ0@cluster0.dqtm1.mongodb.net/todolistDB", {
    useNewUrlParser: true
});
// Schema ad model
const listSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", listSchema);
//EJS
app.set('view engine', 'ejs');

// Creando objetos mongoose 

const item1 = new Item({
    name: "Welcome to your todolist!."
})
const item2 = new Item({
    name: "Hit the + button to add a new item."
})
const Item3 = new Item({
    name: "<--- hit this to delete an item."
})

const defaultItems = [item1, item2, Item3];


const newListSchema= new mongoose.Schema({
    name: String,
    items:[listSchema]
});

const List =  mongoose.model("List", newListSchema);
//Mostrando las paginas 
app.get("/", function (req, res) {
    
    Item.find(function (err, itemsDB) {
        if (itemsDB.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Elementos añadidos correctamente.");
                }
            })
            res.redirect("/");
        } else {
            res.render('list', {
                listTitle: date,
                newListItems: itemsDB
            })
        }

    });
})

// Dynamic pages per entry
app.get('/:userEntry', function(req, res){
    let newPage=_.capitalize(req.params.userEntry);

    List.findOne({name:newPage},function(err, page){
        if(!err){
            if(!page){
                // Create a new list
                const list =new List({
                    name: newPage,
                    items: defaultItems
                })
                list.save();
                res.redirect("/"+newPage);
            }else{
                // show existing one
                res.render('list', {
                    listTitle: page.name,
                    newListItems: page.items
                })

            }
        }
    })
    


    })

app.post('/', function (req, res) {
    const newTask = req.body.nuevaEntrada;
    const listName = req.body.list; 

    const addedItem = new Item({
        name: newTask
    });

    if (listName===date) {
        if (newTask === "") {
            res.redirect("/")
        } else {
            addedItem.save();
            res.redirect("/")
        } 
    } else {
        List.findOne({name:listName}, function(err, list){
            list.items.push(addedItem);
            list.save();
            res.redirect("/"+listName);
        })
    }


})

app.post("/delete", function(req, res){
    const deleteID =req.body.checkbox;
    const listName=req.body.listName; 

    if (listName===date) {
        Item.findByIdAndDelete(deleteID,function(err){
            if (err) {
                console.log(err);
            } else {
                console.log(`Item ${deleteID} deleted.`);
            }
        });
        setTimeout(() => {
            res.redirect("/");  
        }, 1000);
    } else {
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:deleteID}}},function(err,result){
            if (!err) {
                setTimeout(() => {
                    res.redirect("/"+listName);
                }, 1000);
            }
        })
    }

   
    
});
//Listening on port 3000 and if it goes well then logging a message saying that the server is running
app.listen(process.env.PORT || 3000, function () {
    console.log("Server is running at port 3000");
});