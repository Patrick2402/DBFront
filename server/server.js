const express = require('express')
const app = express()
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');

const cookieParser = require('cookie-parser');
const { application } = require('express');
app.use(cookieParser());



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



app.use(cookieSession({
    name: 'session',
    keys: ['your_secret_key'],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));


const connection = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "$Delfinek#21!",
});

connection.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('Database connected')
    }
})


app.get('/api/users', (req, res) => {
    connection.query("select * from SampleApp.Results where personName = 'Patryk Zawieja'", (err, results) => {
        if (err) {
            console.log(err);
        }
        console.log(results)
        res.setHeader('Content-Type', 'application/json');
        res.json(results);
    });
});

app.post('/api/login_req', async (req, res) => {
    const { username, password } = req.body;

    try {
        // get the user from the database
        const [rows, fields] = await connection.promise().query('SELECT * FROM rcubedb.regusers WHERE username = ?', [username]);
        const user = rows[0];

        // check if user exists
        if (!user) {
            return res.status(401).json({ msg: 'Invalid credentials' });
        }

        const mat = await password === user.password ? true : false;
        if (!mat) {
            return res.status(401).json({ msg: 'Invalid credentials' });
        }

        // set the login cookie
        res.cookie('loggedIn', true, { maxAge: 24 * 60 * 60 * 1000 }); // expires in 24 hours
        res.status(200).json({ msg: 'Successful login' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
});


app.post('/api/logout', (req, res) => {
    res.clearCookie('loggedIn'); // usunięcie ciasteczka
    res.json({ msg: 'Logged out' });
});

app.post('/api/sign',async (req,res) =>{
    const {username, password} = req.body;
    console.log(username,password)
    try{
        const [rows, fields] = await connection.promise().query('SELECT * FROM rcubedb.regusers WHERE username = ?', [username]);
        const user = rows[0];
        console.log(user)
        if(user){
            res.status(401).json({msg: 'User exists'})
        }else {
            const sql = "INSERT INTO rcubedb.regusers (username, password) VALUES (?, ?)";
            const values = [username, password];
        
            try {
                await connection.promise().query(sql, values);
                console.log("1 record inserted");
                res.status(201).json({ msg: 'New user added' });
            } catch (error) {
                console.error(error);
                res.status(500).json({ msg: 'Server error' });
            }
        }
        
    }catch (error){
        console.log(error);
        res.status(500).json({msg: 'Server error'});
    }

})

app.use((req, res, next) => {
    if (req.cookies.loggedIn) {
        next();
    } else {
        res.status(401).json({ msg: "Unauthorized" });
    }
});



// app.post('/api/sign', async (req, res) => {
//     const { username, password } = req.body;
//     console.log('asdasda')
//     try {
//         const [rows, fields] = await connection.promise().query('SELECT * FROM regusers WHERE username = ?', [username]);
//         const user = rows[0];
//         if (user) {
//             return res.status(401).json({ msg: 'Exisiting username in database' })
//         } else {
//             const sql = "INSERT INTO users (username, password) VALUES (?, ?)";
//             const values = [username, password];

//             try {
//                 await connection.promise().query(sql, values);
//                 console.log("1 record inserted");
//                 res.status(201).json({ msg: 'New user added' });
//             } catch (error) {
//                 console.error(error);
//                 res.status(500).json({ msg: 'Server error' });
//             }
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ msg: 'Server error' });
//     }
// })



app.listen(5001, () => {
    console.log('server is running')
})