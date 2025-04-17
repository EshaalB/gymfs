require('dotenv').config(); // Load environment variables
const express = require('express'); 
const sql = require('mssql'); 
const cors = require('cors'); 
const multer = require('multer');
const upload = multer();

const app = express(); 
app.use(cors());  
app.use(express.urlencoded({ extended: true })); // For form-data & x-www-form-urlencoded
app.use(express.json());
// SQL Server Configuration using environment variables
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        trustServerCertificate: true,
        trustedConnection: false,
        enableArithAbort: true,
        instancename: process.env.DB_INSTANCE
    },
    port: parseInt(process.env.DB_PORT, 10)
};
//TEST 
app.get('/gymUser', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM gymUser');
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(result.recordset, null, 4)); 
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Database query failed" });
    }

    //ATIKA CODE 
});
app.get('/countMembers', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT membershipStatus, COUNT(*) AS member_count 
            FROM gymUser WHERE userRole = 'Member' 
            GROUP BY membershipStatus;
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database query failed" });
    }
});

// Retrieve members who have not attended any class in the last month
app.get('/inactiveMembers', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT M.userid, M.fName, M.lName FROM gymUser AS M
            LEFT JOIN Attendance AS A ON M.userid = A.memberId
            WHERE M.userRole = 'member' 
            AND DATEDIFF(MONTH, A.currDate, GETDATE()) = 1
            AND A.memberId IS NULL;
        `); 
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database query failed" });
    }
});

// View active members 
app.get('/activeMembers', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT userID, fName, lName, membershipType FROM gymUser 
            WHERE userRole = 'Member' AND membershipStatus = 'Active';
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database query failed" });
    }
});

// Class attendance rate
app.get('/attendanceRate', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT memberId, COUNT(*) AS TotalClasses,
                   COUNT(CASE WHEN attendanceStatus = 'P' THEN 1 END) AS presentCount,
                   COUNT(CASE WHEN attendanceStatus = 'A' THEN 1 END) AS absentCount,
                   (COUNT(CASE WHEN attendanceStatus = 'P' THEN 1 END) * 100) / COUNT(*) AS percent
            FROM Attendance
            GROUP BY memberId;
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database query failed" });
    }
});

// Register user
app.post('/registerUser', async (req, res) => {
    const { fName, lName, email, password, age, dateOfBirth, gender, userRole, specialization, experienceYears, salary, membershipType, membershipStatus } = req.body;
    console.log("Received Data:", req.body); // Debugging Log
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT 1 FROM gymUser WHERE email = @email');
        
        if (result.recordset.length > 0) {
            return res.status(400).json({ error: "Email already registered!" });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters!" });
        }

        if (age < 14) {
            return res.status(400).json({ error: "Age must be greater than 13!" });
        }

        await pool.request()
            .input('fName', sql.VarChar, fName)
            .input('lName', sql.VarChar, lName)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, password)
            .input('age', sql.Int, age)
            .input('dateOfBirth', sql.Date, dateOfBirth)
            .input('gender', sql.VarChar, gender)
            .input('userRole', sql.VarChar, userRole)
            .input('specialization', sql.VarChar, specialization)
            .input('experienceYears', sql.Int, experienceYears)
            .input('salary', sql.Decimal(10, 2), salary)
            .input('membershipType', sql.VarChar, membershipType)
            .input('membershipStatus', sql.VarChar, membershipStatus)
            .query(`
                INSERT INTO gymUser (fName, lName, email, password, age, dateOfBirth, gender, userRole, specialization, experienceYears, salary, membershipType, membershipStatus)
                VALUES (@fName, @lName, @email, @password, @age, @dateOfBirth, @gender, @userRole, @specialization, @experienceYears, @salary, @membershipType, @membershipStatus);
            `);

        res.json({ message: "User registered successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database insertion failed" });
    }
});

// Mark attendance
app.post('/markAttendance', async (req, res) => {
    const { memberId, classId, attendanceStatus } = req.body;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('memberId', sql.Int, memberId)
            .query('SELECT email FROM gymUser WHERE userId = @memberId');
        
        if (result.recordset.length === 0) {
            return res.status(400).json({ error: "User does not exist!" });
        }

        const memberEmail = result.recordset[0].email;
        
        const classResult = await pool.request()
            .input('classId', sql.Int, classId)
            .query('SELECT trainerId, trainerEmail FROM Class WHERE classId = @classId');
        
        if (classResult.recordset.length === 0) {
            return res.status(400).json({ error: "Class not found!" });
        }

        const { trainerId, trainerEmail } = classResult.recordset[0];
        const currDate = new Date().toISOString().split('T')[0];
        
        await pool.request()
            .input('memberId', sql.Int, memberId)
            .input('memberEmail', sql.VarChar, memberEmail)
            .input('classId', sql.Int, classId)
            .input('currDate', sql.Date, currDate)
            .input('trainerId', sql.Int, trainerId)
            .input('trainerEmail', sql.VarChar, trainerEmail)
            .input('attendanceStatus', sql.VarChar, attendanceStatus)
            .query(`
                INSERT INTO Attendance (memberId, memberEmail, classId, currDate, trainerId, trainerEmail, attendanceStatus)
                VALUES (@memberId, @memberEmail, @classId, @currDate, @trainerId, @trainerEmail, @attendanceStatus);
            `);

        res.json({ message: "Attendance marked successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database insertion failed" });
    }
});


// ROHAIL CODE 
app.get('/classes', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT g.userId AS TrainerID, g.fName as FirstName, g.lName As LastName, c.classId, c.className
            FROM gymUser g
            JOIN Class c ON g.userId = c.trainerId
            WHERE g.userRole = 'Trainer';
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database query failed" });
    }
});

// Query: List of Trainers with Less Than 2 Classes Assigned
app.get('/underutilized', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT g.userId AS TrainerID, g.fName FirstName, g.lName LastName, COUNT(c.classId) AS AssignedClasses
            FROM gymUser g
            LEFT JOIN Class c ON g.userId = c.trainerId
            WHERE g.userRole = 'Trainer'
            GROUP BY g.userId, g.fName, g.lName
            HAVING COUNT(c.classId) < 2;
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database query failed" });
    }
});

// Stored Procedure: Assign Trainer to a Class
app.post('/assignT',upload.none(), async (req, res) => {
    const { trainerId, classId } = req.body;
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('trainerId', sql.Int, trainerId)
            .input('classId', sql.Int, classId)
            .query(`
                EXEC AssignTrainerToClass @trainerId, @classId;
            `);
        res.json({ message: "Trainer assigned successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to assign trainer" });
    }
});

// View: Underfilled Classes (<50% Seats Filled)
app.get('/underfilled', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`SELECT c.classId, c.className, c.Seats, COUNT(e.memberId) AS EnrolledMembers
FROM Class c
LEFT JOIN Class_Enrollment e ON c.classId = e.classId
GROUP BY c.classId, c.className, c.Seats
HAVING COUNT(e.memberId) < (c.Seats / 2);`);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch underfilled classes" });
    }
});

// Query: Members Without a Workout Plan
app.get('/without-plan', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT g.userId, g.fName, g.lName
            FROM gymUser g
            LEFT JOIN WorkoutPlan wp ON g.userId = wp.memberId
            WHERE g.userRole = 'Member' AND wp.planId IS NULL;
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch members without a workout plan" });
    }
});

// Query: Most Popular Workout Plan Based on Assignments
app.get('/popular', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT wp.planId, wp.plan_Name, COUNT(g.userId) AS AssignedMembers
            FROM WorkoutPlan wp
            JOIN gymUser g ON wp.memberId = g.userId
            GROUP BY wp.planId, wp.plan_Name
            ORDER BY COUNT(g.userId) DESC;
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch popular workout plans" });
    }
});
// Stored Procedure: Assign Workout Plan
app.post('/assignW',upload.none(), async (req, res) => {
    const { memberId, memberEmail } = req.body;
    console.log("Received Data:", req.body); // Debugging Log

    if (!memberId || !memberEmail) {
        return res.status(400).json({ error: "Missing memberId or memberEmail" });
    }
    try {
        const pool = await sql.connect(config);
        await pool.request()
        .input('memberId', sql.Int, memberId)
            .input('memberEmail', sql.VarChar, memberEmail)
            .query(`EXEC AssignWorkoutPlan @memberId, @memberEmail;`);
        res.json({ message: "Workout plan assigned successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to assign workout plan" });
    }
});

// View: Workout Plans Categorized by Trainer
app.get('/by-trainer', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`SELECT g.userId AS TrainerID, g.fName AS FirstName, g.lName AS LastName, wp.planId, wp.plan_Name
FROM gymUser g
JOIN WorkoutPlan wp ON g.userId = wp.trainerId
WHERE g.userRole = 'Trainer';`);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch workout plans by trainer" });
    }
});

// ESHAAL  

// Query: Total Revenue by Membership Type
app.get('/membership-type', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT m.membershipType, SUM(amount) AS totalRevenue
            FROM Payment AS p
            JOIN gymUser AS m ON m.userId = p.memberId
            WHERE p.status = 'Completed'
            GROUP BY m.membershipType;
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch revenue by membership type" });
    }
});

// Query: Monthly Revenue Trend Over the Last 6 Months
app.get('/monthly-trend', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT YEAR(p.paymentDate) AS Year, MONTH(p.paymentDate) AS Month, 
                   m.membershipType, SUM(p.amount) AS totalRevenue
            FROM Payment AS p
            JOIN gymUser AS m ON m.userId = p.memberId
            WHERE p.paymentDate >= DATEADD(MONTH, -6, EOMONTH(GETDATE())) 
                  AND p.status = 'Completed'
            GROUP BY YEAR(p.paymentDate), MONTH(p.paymentDate), m.membershipType
            ORDER BY Year ASC, Month ASC, m.membershipType;
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch monthly revenue trend" });
    }
});

// Stored Procedure: Process Payment
app.post('/process', async (req, res) => {
    // Destructure with default values and ensure all required fields are present
    const { 
        memberId, 
        memberEmail,
        amount, 
        paymentDate, 
        status = 'Completed' 
    } = req.body;

    // Validate required fields
    if (!memberId || !amount || !paymentDate) {
        return res.status(400).json({ 
            error: "Missing required fields: memberId, amount, and paymentDate are required" 
        });
    }

    try {
        // Convert and validate data types
        const parsedMemberId = parseInt(memberId);
        const parsedAmount = parseFloat(amount);
        const parsedPaymentDate = new Date(paymentDate);
        const validatedStatus = typeof status === 'string' && status.length <= 20 ? status : 'Completed';

        // Additional validation
        if (isNaN(parsedMemberId)) {
            return res.status(400).json({ error: "Invalid memberId: must be a valid integer" });
        }
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ error: "Invalid amount: must be a positive number" });
        }
        if (isNaN(parsedPaymentDate.getTime())) {
            return res.status(400).json({ error: "Invalid paymentDate: must be a valid date" });
        }

        const pool = await sql.connect(config);
        await pool.request()
            .input('memberId', sql.Int, parsedMemberId)
            .input('memberEmail', sql.VarChar, memberEmail)
            .input('amount', sql.Decimal(10, 2), parsedAmount)
            .input('paymentDate', sql.Date, parsedPaymentDate)
            .input('status', sql.VarChar(20), validatedStatus)
            .query(`EXEC ProcessPayment @memberId, @amount, @paymentDate, @status;`);

        res.json({ message: "Payment processed successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            error: "Failed to process payment",
            details: err.message 
        });
    }
});

// View: Pending Payments
app.get('/pending', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT p.paymentId, p.memberId, m.fName, m.lName, p.amount, p.paymentDate
            FROM Payment AS p
            JOIN gymUser AS m ON p.memberId = m.userId
            WHERE p.status = 'Pending'
            ORDER BY p.paymentDate ASC;
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch pending payments" });
    }
});

// Endpoint to test stored procedure with query parameters
app.get('/testProcedure', async (req, res) => {
    const { param1, param2 } = req.query; // Get parameters from query string
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('param1', sql.VarChar, param1) // Use query parameter
            .input('param2', sql.Int, param2) // Use query parameter
            .query(`EXEC YourStoredProcedureName @param1, @param2;`);
        
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to execute stored procedure" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get('/', (req, res) => {
    return res.json("Hi, I am backend");
});
