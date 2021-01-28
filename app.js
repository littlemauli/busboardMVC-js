const express = require('express');
var path = require('path');
const app = express();
const testController = require('./controllers/testController');


var port = process.env.PORT || 8080;

app.set('view engine', 'ejs');
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

//app.use(express.static('public'));
 //app.use('/public', express.static('public'));


app.get('/postcode/:postcode', testController.getBussesForPostcode)

app.listen(port, () => {
	console.log(`app is listening to the port ${port}`);
});