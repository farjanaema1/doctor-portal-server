const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
const port = process.env.PORT||5000;
const app = express();
const  ObjectID = require('mongodb').ObjectId;

app.use(cors());
app.use(express.json());
const uri = `mongodb+srv://docPortal:TmPwIYqmp6Dknd1J@cluster0.zapyzlw.mongodb.net/?retryWrites=true&w=majority`;

console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// function verifyJWT(req,res,next){
//     console.log('token inside verifyJWT',req.headers.authorization);
//     const authheader =  req.headers.authorization;
//     if(!authheader){
//         return res.status(401).send('unauthorizes access');

//     }
//     const token = authheader.split( ' ' )[1];
//     jwt.verify(token, process.env.ACCESS_TOKEN, function(err,decoded){
//         if(err) {
//             return res.status(403).send( {message: 'forbidden access'})
//         }
//         req.decoded = decoded;
//         next();
//     })

// }
async function run() {
    try{
        const appointmentOptionsCollection = client.db('doctorportal2').collection('appointmentOptions')
        const bookingCollection = client.db('doctorportal2').collection('booking')
        
        const usersCollection = client.db('doctorportal2').collection('users')
        const doctorsCollection = client.db('doctorportal2').collection('doctors')
        app.get('/appointmentOptions',async(req,res) => {
            const date = req.query.date;
            console.log(date);
            const query = {};
            // const cursor = appointmentOptionsCollection.find(query);

            // const options = await cursor.toArray();
            const options = await appointmentOptionsCollection.find(query).toArray();
            const bookingQuery = {selectedDate: date}
            const alreadyBooked = await bookingCollection.find(bookingQuery).toArray();
            options.forEach( option => {
                const optionBooked = alreadyBooked.filter( book => book.treatmentName === option.name)


        //console.log(optionBooked);
                const bookedSlots = optionBooked.map( book => book.slot)
               // console.log( date,option.name,bookedSlots)
               const remainingSlots = option.slots.filter( slot => !bookedSlots.includes(slot))
              // console.log(date,option.name,remainingSlots.length)
                option.slots = remainingSlots;


           })
            res.send(options)
        })

        app.get('/jwt', async(req,res) => {
            const email = req.query.email;
            const query = {email: email};
          
            const user = await usersCollection.findOne(query);
            console.log(user);
            res.send({accessToken: 'token'});
             if(user){
                 const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1h'})
                 return res.send({accessToken:token})
             }
            
            // res.status(403).send({accessToken : ''});
         }
        )
        // app.get('/addPrice',async(req,res) => {
        //     const filter = {};
        //     const options = { upsert : true};
        //     const updatedDoc = {
        //         $set : {
        //             price:99
        //         }
        //     }
        //     const result = await appointmentOptionsCollection.updateMany(filter,updatedDoc,options);
        //     res.send(result);
        // })
// app.get('/booking/:id',async(req,res) => {
//     const id = req.params.id;
//     const query = { _id: new ObjectID(id)};
//     const booking = await bookingCollection.findOne(query);
//     res.send(booking);
// })
        app.get( '/users/admin/email', async(req,res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin'});
        })
      
        app.post('/users',async(req,res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })
         
        app.put('/users/admin/:id',async ( req,res) => {
            const id = req.params.id;
            const filter = {_id: new ObjectID(id)}
            const options = { upsert : true}
            const updatedDoc = {
                $set : {
                    role : 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter,updatedDoc,options);
            res.send(result);
        })
        app.post('/booking',async(req,res) => {
            const booking = req.body;
            //console.log(booking);
            const query = {
                selectedDate : booking.selectedDate,
                treatmentName : booking.treatmentName,
                email : booking.email
            }
            const alreadyBooked  = await bookingCollection.find(query).toArray();
            if(alreadyBooked.length) {
                const message = `you have a booking on ${booking.selectedDate}`
                return res.send({acknowledged:false,message})
            }
            const result = await bookingCollection.insertOne(booking)  
            res.send(result);
        })
        app.post('/doctors', async( req,res ) => {
            const doctor = req.body;
            const result = await doctorsCollection.insertOne(doctor);
            res.send(result);
        })
        app.get('/doctors',async( req,res) => {
            const query = {};
            const result = await doctorsCollection.find(query).toArray();
            res.send(result);
        })
       
        
       
        app.get('/booking', async(req,res) => {
            const email = req.query.email;
            //console.log(email);
            //const decodedEmail = req.decoded.email;

            // if(email !== decodedEmail){
            //     return res.status(403).send({message: 'forbidden access'})
            // }
           // console.log('token',req.headers.authorization);
            const query = {email:email};
            const booking = await bookingCollection.find(query).toArray();
            res.send(booking);
        })
        app.get('/appointmentspecialty',async(req,res) => {
            const query = {};
            const result = await appointmentOptionsCollection.find(query).project( {name:1}).toArray();
            res.send(result);
        })
      
app.get('/users',async(req,res) => {
    const query = {};
    const users = await usersCollection.find(query).toArray();

    res.send(users);
})
// app.delete('/doctors/:id',async(req,res) => {
//     const id = req.params.id;
//      const filter = {_id: new ObjectID(id)}

//      const result = await doctorsCollection.deleteOne(filter);
//      res.send(result);
//     // const query = { email };
//     // const result = await doctorsCollection.deleteOne(query);
//     // res.send(result);

// })

    }
    finally{

    }
}

run().catch(console.log);

app.get('/',async(req,res) => {
    res.send('DOCTORS PORTAL SERVER IS RUNNNING');

})
app.listen(port, () => {
    console.log(`Doctor's portal running on port ${port}`);

})



