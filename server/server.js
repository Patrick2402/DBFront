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
    host: "localhost",
    user: "root",
    password: "root",
});

connection.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('Database connected')
    }
})

app.post('/api/results', (req, res) => {
    const { wcaid } = req.body;
    console.log(wcaid);
   
    connection.query('SELECT * FROM sampleappwca.RanksAverage INNER JOIN sampleappwca.Persons ON sampleappwca.Persons.id = sampleappwca.RanksAverage.personId WHERE sampleappwca.Persons.id = ?', [wcaid], (err, results) => {
            if (err) {
                console.log(err);
            }
            console.log(results);
            res.setHeader('Content-Type', 'application/json');
            res.json(results);
        })
});

app.post('/api/timerstats', (req, res) => {
    const { avg } = req.body;

    connection.query("SELECT COUNT(*) +1 as position FROM sampleappwca.ranksaverage WHERE eventId = '333' AND best > 2 AND best < ?", [avg], (err, results) => {
            if (err) {
                console.log(err);
            }
            res.setHeader('Content-Type', 'application/json');
            res.json(results);
        })
});
app.post('/api/timerstats_two', (req, res) => {
    const { avg } = req.body;

    connection.query("call sampleappwca.player_wins_tournaments(?, \"_Europe\");", [avg], (err, results) => {
            if (err) {
                console.log(err);
            }
            res.setHeader('Content-Type', 'application/json');
            res.json(results);
        })
});

app.post('/api/singleranks', (req, res) => {
    const { sin } = req.body;
    console.log(sin);
    connection.query("SELECT COUNT(*) +1 as singlepos FROM sampleappwca.rankssingle WHERE eventId = '333' AND best > 2 AND best < ?", [sin], (err, resu) => {
            if (err) {
                console.log(err);
            }
            console.log(resu);
            res.setHeader('Content-Type', 'application/json');
            res.json(resu);
        })
});
app.post('/api/rankings', (req, res) => {
    const {country, event, option} = req.body;
    console.log(event);
    const query = option === "single" ? 
        "call sampleappwca.get_best_country_and_event(?, ?);"
        : "call sampleappwca.get_average_country_and_event(?, ?);";

    connection.query(query, [event, country], (err, resu) => {
            if (err) {
                console.log(err);
            }
            console.log(resu);
            res.setHeader('Content-Type', 'application/json');
            res.json(resu);
        })
});

const run_db_procedure = (proc) => {
    app.get('/api/proc', (req, res) => {
        connection.query("call ?;", [proc], (err, resus) => {
            if (err) {
                console.log(err);
            }
            res.setHeader('Content-Type', 'application/json');
            res.json(resus);
        })
    })
}

app.get('/api/countries',(req,res) => {
    connection.query("SELECT id FROM sampleappwca.countries; ", (err, resus) => {
        if (err) {
            console.log(err);
        }
        res.setHeader('Content-Type', 'application/json');
        res.json(resus);
    })
})

app.get('/api/events',(req,res) => {
    connection.query("SELECT id FROM sampleappwca.events; ", (err, resus) => {
        if (err) {
            console.log(err);
        }
        res.setHeader('Content-Type', 'application/json');
        res.json(resus);
    })
})


// app.post('/api/users', (req, res) => {
//     connection.query("select * from sampleappwca.Results where personName = 'Patryk Zawieja'", (err, results) => {
//         if (err) {
//             console.log(err);
//         }
//         console.log(results)
//         res.setHeader('Content-Type', 'application/json');
//         res.json(results);
//     });
// });

app.post('/api/login_req', async (req, res) => {
    const { username, password } = req.body;

    try {
        // get the user from the database
        const [rows, fields] = await connection.promise().query('SELECT * FROM sampleappwca.users WHERE username = ?', [username]);
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

app.post('/api/sign', async (req, res) => {
    const { username, password } = req.body;
    console.log(username, password)
    try {
        const [rows, fields] = await connection.promise().query('SELECT * FROM sampleappwca.users WHERE username = ?', [username]);
        const user = rows[0];
        console.log(user)
        if (user) {
            res.status(401).json({ msg: 'User exists' })
        } else {
            const sql = "INSERT INTO sampleappwca.users (username, password) VALUES (?, ?)";
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

    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
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